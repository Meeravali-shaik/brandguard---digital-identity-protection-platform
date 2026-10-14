import { Brand, DatasetRecord, ScanSummary, Finding, ExclusionRecord, ReviewEvent } from '../types/brandguard';
import { INITIAL_DEMO_BRAND, INITIAL_DEMO_CANDIDATES } from '../data/syntheticData';
import { computeNameSimilarity } from '../engine/nameSimilarity';
import { computeHashDistance } from '../engine/imageSimilarity';
import { computeDescriptionSimilarity } from '../engine/descriptionSimilarity';
import { evaluateOfficialExclusion } from '../engine/exclusions';
import { calculateRiskScore, EvaluatedSignal } from '../engine/scoring';

const STORAGE_KEYS = {
  BRANDS: 'brandguard_brands',
  CANDIDATES: 'brandguard_candidates',
  SCANS: 'brandguard_scans',
  FINDINGS: 'brandguard_findings',
  EXCLUSIONS: 'brandguard_exclusions',
  ACTIVE_BRAND_ID: 'brandguard_active_brand_id',
  CONFIG: 'brandguard_config'
};

class LocalSecurityRepository {
  private get<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('Storage quota error', e);
    }
  }

  init(): void {
    if (!localStorage.getItem(STORAGE_KEYS.BRANDS)) {
      this.resetToDemo();
    }
  }

  resetToDemo(): void {
    this.set(STORAGE_KEYS.BRANDS, [INITIAL_DEMO_BRAND]);
    this.set(STORAGE_KEYS.CANDIDATES, INITIAL_DEMO_CANDIDATES);
    this.set(STORAGE_KEYS.SCANS, []);
    this.set(STORAGE_KEYS.FINDINGS, []);
    this.set(STORAGE_KEYS.EXCLUSIONS, []);
    this.set(STORAGE_KEYS.ACTIVE_BRAND_ID, INITIAL_DEMO_BRAND.id);
  }

  getBrands(): Brand[] {
    return this.get<Brand[]>(STORAGE_KEYS.BRANDS, [INITIAL_DEMO_BRAND]);
  }

  getBrand(id: string): Brand | undefined {
    return this.getBrands().find(b => b.id === id);
  }

  saveBrand(brand: Brand): void {
    const brands = this.getBrands();
    const idx = brands.findIndex(b => b.id === brand.id);
    if (idx >= 0) {
      brands[idx] = brand;
    } else {
      brands.push(brand);
    }
    this.set(STORAGE_KEYS.BRANDS, brands);
  }

  updateBrand(brandId: string, updates: Partial<Brand>): Brand | undefined {
    const brand = this.getBrand(brandId);
    if (!brand) return undefined;

    if (updates.name) brand.name = updates.name.trim();
    if (updates.official_website) {
      brand.official_website = updates.official_website.trim();
      brand.normalized_domain = brand.official_website
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .split('/')[0]
        .toLowerCase();
    }
    if (updates.description !== undefined) {
      brand.description = updates.description ? updates.description.trim() : null;
    }
    if (updates.logo_url !== undefined) {
      brand.logo_url = updates.logo_url ? updates.logo_url.trim() : null;
    }
    if (updates.logo_hash !== undefined) {
      brand.logo_hash = updates.logo_hash ? updates.logo_hash.trim() : brand.logo_hash;
    }
    if (updates.aliases !== undefined) {
      brand.aliases = updates.aliases;
    }
    brand.updated_at = new Date().toISOString();

    this.saveBrand(brand);
    return brand;
  }

  deleteBrand(brandId: string): void {
    const brands = this.getBrands().filter(b => b.id !== brandId);
    if (brands.length === 0) {
      this.resetToDemo();
      return;
    }
    this.set(STORAGE_KEYS.BRANDS, brands);
    if (this.getActiveBrandId() === brandId) {
      this.setActiveBrandId(brands[0].id);
    }
    const findings = this.getFindings().filter(f => f.brand_id !== brandId);
    this.set(STORAGE_KEYS.FINDINGS, findings);
    const scans = this.getScans().filter(s => s.brand_id !== brandId);
    this.set(STORAGE_KEYS.SCANS, scans);
  }

  getActiveBrandId(): string {
    const brands = this.getBrands();
    const stored = this.get<string>(STORAGE_KEYS.ACTIVE_BRAND_ID, '');
    if (stored && brands.some(b => b.id === stored)) return stored;
    return brands[0]?.id || '';
  }

  setActiveBrandId(id: string): void {
    this.set(STORAGE_KEYS.ACTIVE_BRAND_ID, id);
  }

  getCandidates(): DatasetRecord[] {
    return this.get<DatasetRecord[]>(STORAGE_KEYS.CANDIDATES, INITIAL_DEMO_CANDIDATES);
  }

  getScans(brandId?: string): ScanSummary[] {
    const scans = this.get<ScanSummary[]>(STORAGE_KEYS.SCANS, []);
    if (!brandId) return scans;
    return scans.filter(s => s.brand_id === brandId);
  }

  getFindings(brandId?: string): Finding[] {
    const findings = this.get<Finding[]>(STORAGE_KEYS.FINDINGS, []);
    if (!brandId) return findings;
    return findings.filter(f => f.brand_id === brandId);
  }

  getFinding(findingId: string): Finding | undefined {
    return this.getFindings().find(f => f.id === findingId);
  }

  getExclusions(brandId?: string): ExclusionRecord[] {
    return this.get<ExclusionRecord[]>(STORAGE_KEYS.EXCLUSIONS, []);
  }

  updateFindingReview(findingId: string, newStatus: string, notes?: string, reviewer = 'Security Analyst'): Finding | undefined {
    const findings = this.get<Finding[]>(STORAGE_KEYS.FINDINGS, []);
    const f = findings.find(item => item.id === findingId);
    if (!f) return undefined;

    const prevStatus = f.review_status;
    f.review_status = newStatus as any;
    f.analyst_notes = notes || null;
    f.reviewed_at = new Date().toISOString();

    const event: ReviewEvent = {
      id: 'rev-' + Math.random().toString(36).substring(2, 9),
      finding_id: f.id,
      previous_status: prevStatus,
      new_status: newStatus,
      notes: notes || null,
      reviewer_identity: reviewer,
      created_at: new Date().toISOString()
    };
    f.review_events = [event, ...(f.review_events || [])];

    this.set(STORAGE_KEYS.FINDINGS, findings);
    return f;
  }

  executeScan(
    brandId: string,
    options?: {
      sourceResults?: Array<{
        id: string;
        source_name: string;
        source_type: string;
        candidates_found: number;
        status: 'success' | 'empty' | 'partial' | 'failed' | 'not_configured';
        notes?: string;
      }>;
      additionalCandidates?: DatasetRecord[];
    }
  ): ScanSummary {
    const brand = this.getBrand(brandId);
    if (!brand) throw new Error('Protected brand not found');

    const baseCandidates = this.getCandidates();
    const candidates = options?.additionalCandidates && options.additionalCandidates.length > 0
      ? [...baseCandidates, ...options.additionalCandidates]
      : baseCandidates;

    const scanId = 'scan-' + Date.now();

    // Map existing candidate reviews for this brand to preserve triage audit work
    const priorFindings = this.getFindings(brandId);
    const priorReviewsByRecordId = new Map<string, Finding>();
    for (const pf of priorFindings) {
      if (pf.review_status !== 'new' || pf.analyst_notes || (pf.review_events && pf.review_events.length > 0)) {
        priorReviewsByRecordId.set(pf.record_id, pf);
      }
    }

    const existingFindings = this.getFindings().filter(f => f.brand_id !== brandId);
    const existingExclusions = this.getExclusions().filter(e => e.scan_id !== scanId);

    const newFindings: Finding[] = [];
    const newExclusions: ExclusionRecord[] = [];

    let highCount = 0;
    let medCount = 0;
    let revCount = 0;
    let ignCount = 0;

    for (const cand of candidates) {
      // 1. Strict official asset exclusion
      const exclusion = evaluateOfficialExclusion(
        cand.entity_type,
        cand.platform,
        cand.handle,
        cand.external_id,
        cand.package_or_bundle_id,
        cand.developer_id,
        brand.official_assets
      );

      if (exclusion.isExcluded) {
        newExclusions.push({
          id: 'excl-' + Math.random().toString(36).substring(2, 9),
          scan_id: scanId,
          record_id: cand.id,
          matched_official_asset_id: exclusion.matchedCriteria?.matchedAssetId,
          exclusion_reason: exclusion.exclusionReason || 'Official asset verified',
          matched_criteria: exclusion.matchedCriteria || {},
          created_at: new Date().toISOString()
        });
        continue; // Excluded!
      }

      // 2. Compute Signals
      const nameRes = computeNameSimilarity(cand.display_name, brand.name);
      const logoRes = computeHashDistance(cand.perceptual_hash, brand.logo_hash || 'a1f03c89b2e47d10');
      const descRes = computeDescriptionSimilarity(cand.description, brand.description);

      // Identity conflict signal
      let conflictScore = 0;
      let conflictExplanation = 'No conflicting identity anchors detected.';
      if (cand.entity_type === 'social_profile') {
        if (cand.external_id) {
          conflictScore = 90;
          conflictExplanation = `Candidate operates under external ID '${cand.external_id}', distinct from registered official account.`;
        } else {
          conflictScore = 50;
          conflictExplanation = 'Candidate lacks verified platform identity anchor.';
        }
      } else if (cand.entity_type === 'mobile_app') {
        if (cand.package_or_bundle_id) {
          conflictScore = 95;
          conflictExplanation = `Candidate bundle ID '${cand.package_or_bundle_id}' conflicts with registered official application.`;
        } else {
          conflictScore = 60;
          conflictExplanation = 'Candidate package identifier is unverified.';
        }
      }

      const signalsToEval: EvaluatedSignal[] = [
        {
          type: 'name_similarity',
          rawScore: nameRes.score,
          isAvailable: true,
          explanation: nameRes.explanation
        },
        {
          type: 'logo_similarity',
          rawScore: logoRes.rawScore,
          isAvailable: logoRes.isAvailable,
          explanation: logoRes.explanation
        },
        {
          type: 'description_similarity',
          rawScore: descRes.rawScore,
          isAvailable: descRes.isAvailable,
          explanation: descRes.explanation
        },
        {
          type: 'identity_conflict',
          rawScore: conflictScore,
          isAvailable: true,
          explanation: conflictExplanation
        }
      ];

      const { compositeScore, riskBand, corroborationMet, summaryExplanation } = calculateRiskScore(signalsToEval);

      if (riskBand === 'high') highCount++;
      else if (riskBand === 'medium') medCount++;
      else if (riskBand === 'needs_review') revCount++;
      else ignCount++;

      // Check if candidate was already triaged by analyst to preserve review history
      const priorReview = priorReviewsByRecordId.get(cand.id);

      const findingId = 'find-' + Math.random().toString(36).substring(2, 9);
      const finding: Finding = {
        id: findingId,
        scan_id: scanId,
        brand_id: brandId,
        record_id: cand.id,
        risk_score: compositeScore,
        risk_band: riskBand,
        corroboration_met: corroborationMet,
        explanation_summary: summaryExplanation,
        evidence_breakdown: {
          candidateName: cand.display_name,
          candidatePlatform: cand.platform,
          corroborationMet,
          rawSignals: {
            name: nameRes.score,
            logo: logoRes.rawScore,
            description: descRes.rawScore,
            conflict: conflictScore
          }
        },
        review_status: priorReview?.review_status || 'new',
        analyst_notes: priorReview?.analyst_notes || null,
        reviewed_at: priorReview?.reviewed_at,
        candidate: cand,
        signals: [
          {
            id: 'sig-name-' + findingId,
            finding_id: findingId,
            signal_type: 'name_similarity',
            raw_score: nameRes.score,
            weight: 0.40,
            contribution: Math.round(nameRes.score * 0.4),
            is_available: true,
            raw_candidate_value: cand.display_name,
            raw_reference_value: brand.name,
            normalized_candidate_value: nameRes.normalizedCandidate,
            normalized_reference_value: nameRes.normalizedReference,
            method_used: nameRes.method,
            explanation: nameRes.explanation
          },
          {
            id: 'sig-logo-' + findingId,
            finding_id: findingId,
            signal_type: 'logo_similarity',
            raw_score: logoRes.rawScore,
            weight: 0.25,
            contribution: Math.round(logoRes.rawScore * 0.25),
            is_available: logoRes.isAvailable,
            raw_candidate_value: cand.perceptual_hash || null,
            raw_reference_value: brand.logo_hash || 'a1f03c89b2e47d10',
            normalized_candidate_value: null,
            normalized_reference_value: null,
            method_used: logoRes.method,
            explanation: logoRes.explanation
          },
          {
            id: 'sig-desc-' + findingId,
            finding_id: findingId,
            signal_type: 'description_similarity',
            raw_score: descRes.rawScore,
            weight: 0.15,
            contribution: Math.round(descRes.rawScore * 0.15),
            is_available: descRes.isAvailable,
            raw_candidate_value: cand.description || null,
            raw_reference_value: brand.description || null,
            normalized_candidate_value: null,
            normalized_reference_value: null,
            method_used: descRes.method,
            explanation: descRes.explanation
          },
          {
            id: 'sig-conf-' + findingId,
            finding_id: findingId,
            signal_type: 'identity_conflict',
            raw_score: conflictScore,
            weight: 0.20,
            contribution: Math.round(conflictScore * 0.20),
            is_available: true,
            raw_candidate_value: cand.external_id || cand.package_or_bundle_id || 'unverified',
            raw_reference_value: 'Official Registered Identity',
            normalized_candidate_value: null,
            normalized_reference_value: null,
            method_used: 'identity_anchor_cross_check',
            explanation: conflictExplanation
          }
        ],
        review_events: priorReview?.review_events || [],
        created_at: new Date().toISOString()
      };

      newFindings.push(finding);
    }

    const confirmedCount = newFindings.filter(f => f.review_status === 'confirmed').length;

    const defaultSourceResults = [
      {
        id: 'src-1',
        source_name: 'Synthetic Identity Benchmark Feed',
        source_type: 'synthetic_demo',
        candidates_found: baseCandidates.length,
        status: 'success' as const
      }
    ];

    const scanSummary: ScanSummary = {
      id: scanId,
      brand_id: brandId,
      status: 'completed',
      candidates_analyzed: candidates.length,
      findings_created: newFindings.length,
      exclusions_applied: newExclusions.length,
      high_risk_count: highCount,
      medium_risk_count: medCount,
      needs_review_count: revCount,
      ignored_count: ignCount,
      confirmed_count: confirmedCount,
      source_results: options?.sourceResults && options.sourceResults.length > 0
        ? (options.sourceResults as any)
        : defaultSourceResults,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const existingScans = this.getScans().filter(s => s.brand_id !== brandId);
    this.set(STORAGE_KEYS.SCANS, [scanSummary, ...existingScans]);
    this.set(STORAGE_KEYS.FINDINGS, [...newFindings, ...existingFindings]);
    this.set(STORAGE_KEYS.EXCLUSIONS, [...newExclusions, ...existingExclusions]);

    return scanSummary;
  }
}

export const localRepo = new LocalSecurityRepository();
localRepo.init();
