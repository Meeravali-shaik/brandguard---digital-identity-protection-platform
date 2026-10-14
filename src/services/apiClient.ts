import { Brand, Finding, ScanSummary, EvaluationSummary, TakedownReport, OfficialAsset } from '../types/brandguard';
import { localRepo } from './storage';

export interface BackendStatus {
  isOnline: boolean;
  mode: 'remote_fastapi' | 'client_engine';
  apiUrl: string;
  version?: string;
  checkedAt: string;
  error?: string | null;
}

class ApiService {
  private customApiUrl: string = localStorage.getItem('brandguard_custom_api_url') || 'http://localhost:8000/api/v1';
  private forceClientMode: boolean = localStorage.getItem('brandguard_force_client_mode') === 'true';
  private lastStatus: BackendStatus = {
    isOnline: false,
    mode: 'client_engine',
    apiUrl: this.customApiUrl,
    checkedAt: new Date().toISOString()
  };

  constructor() {
    this.checkHealth();
  }

  getApiUrl(): string {
    return this.customApiUrl;
  }

  setApiUrl(url: string) {
    this.customApiUrl = url.trim().replace(/\/$/, '');
    localStorage.setItem('brandguard_custom_api_url', this.customApiUrl);
    this.checkHealth();
  }

  isForceClientMode(): boolean {
    return this.forceClientMode;
  }

  setForceClientMode(enabled: boolean) {
    this.forceClientMode = enabled;
    localStorage.setItem('brandguard_force_client_mode', String(enabled));
  }

  getStatus(): BackendStatus {
    return this.lastStatus;
  }

  async checkHealth(): Promise<BackendStatus> {
    if (this.forceClientMode) {
      this.lastStatus = {
        isOnline: false,
        mode: 'client_engine',
        apiUrl: this.customApiUrl,
        checkedAt: new Date().toISOString(),
        error: 'Demonstration Engine manually enforced in Settings.'
      };
      return this.lastStatus;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${this.customApiUrl}/health/live`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        this.lastStatus = {
          isOnline: true,
          mode: 'remote_fastapi',
          apiUrl: this.customApiUrl,
          version: data.version || '1.0.0',
          checkedAt: new Date().toISOString(),
          error: null
        };
        return this.lastStatus;
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (e: any) {
      this.lastStatus = {
        isOnline: false,
        mode: 'client_engine',
        apiUrl: this.customApiUrl,
        checkedAt: new Date().toISOString(),
        error: e?.message || 'Remote backend unreachable'
      };
      return this.lastStatus;
    }
  }

  // --- BRANDS ---
  async getBrands(): Promise<Brand[]> {
    if (this.lastStatus.isOnline) {
      try {
        const res = await fetch(`${this.customApiUrl}/brands`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('Backend fetch failed, falling back to local store', err);
      }
    }
    return localRepo.getBrands();
  }

  async getBrand(id: string): Promise<Brand | undefined> {
    if (this.lastStatus.isOnline) {
      try {
        const res = await fetch(`${this.customApiUrl}/brands/${id}`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('Backend getBrand failed', err);
      }
    }
    return localRepo.getBrand(id);
  }

  async createBrand(payload: {
    name: string;
    official_website: string;
    description?: string;
    logo_url?: string;
    aliases?: string[];
  }): Promise<Brand> {
    if (this.lastStatus.isOnline) {
      try {
        const res = await fetch(`${this.customApiUrl}/brands`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('Backend createBrand failed', err);
      }
    }

    const domain = payload.official_website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase();
    const brandId = 'brand-' + Math.random().toString(36).substring(2, 9);
    const newBrand: Brand = {
      id: brandId,
      name: payload.name,
      official_website: payload.official_website,
      normalized_domain: domain,
      description: payload.description || null,
      logo_url: payload.logo_url || null,
      logo_hash: 'a1f03c89b2e47d10',
      is_active: true,
      aliases: (payload.aliases || []).map((a, i) => ({
        id: `alias-${brandId}-${i}`,
        brand_id: brandId,
        alias_name: a,
        normalized_name: a.toLowerCase().replace(/[^a-z0-9]/g, ''),
        created_at: new Date().toISOString()
      })),
      official_assets: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    localRepo.saveBrand(newBrand);
    localRepo.setActiveBrandId(brandId);
    return newBrand;
  }

  getActiveBrandId(): string {
    return localRepo.getActiveBrandId();
  }

  setActiveBrandId(id: string): void {
    localRepo.setActiveBrandId(id);
  }

  async updateBrand(brandId: string, updates: Partial<Brand>): Promise<Brand | undefined> {
    if (this.lastStatus.isOnline) {
      try {
        const res = await fetch(`${this.customApiUrl}/brands/${brandId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('Backend updateBrand failed, updating local store', err);
      }
    }
    return localRepo.updateBrand(brandId, updates);
  }

  async deleteBrand(brandId: string): Promise<void> {
    if (this.lastStatus.isOnline) {
      try {
        await fetch(`${this.customApiUrl}/brands/${brandId}`, { method: 'DELETE' });
      } catch (err) {
        console.warn('Backend deleteBrand failed', err);
      }
    }
    localRepo.deleteBrand(brandId);
  }

  async registerOfficialAsset(brandId: string, asset: Partial<OfficialAsset>): Promise<OfficialAsset> {
    if (this.lastStatus.isOnline) {
      try {
        const res = await fetch(`${this.customApiUrl}/brands/${brandId}/assets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(asset)
        });
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('Backend registerOfficialAsset failed', err);
      }
    }

    const brand = localRepo.getBrand(brandId);
    if (!brand) throw new Error('Brand not found');

    const newAsset: OfficialAsset = {
      id: 'oa-' + Math.random().toString(36).substring(2, 9),
      brand_id: brandId,
      asset_kind: asset.asset_kind || 'social_profile',
      platform: asset.platform || 'twitter',
      handle: asset.handle || null,
      normalized_handle: asset.handle ? asset.handle.toLowerCase().replace(/^@/, '') : null,
      external_account_id: asset.external_account_id || null,
      package_or_bundle_id: asset.package_or_bundle_id ? asset.package_or_bundle_id.toLowerCase() : null,
      developer_id: asset.developer_id || null,
      developer_name: asset.developer_name || null,
      developer_website: asset.developer_website || null,
      official_listing_url: asset.official_listing_url || null,
      verified: true,
      created_at: new Date().toISOString()
    };

    brand.official_assets = [...(brand.official_assets || []), newAsset];
    localRepo.saveBrand(brand);
    return newAsset;
  }

  async deleteOfficialAsset(brandId: string, assetId: string): Promise<void> {
    if (this.lastStatus.isOnline) {
      try {
        await fetch(`${this.customApiUrl}/assets/${assetId}`, { method: 'DELETE' });
      } catch (err) {
        console.warn('Backend deleteOfficialAsset failed', err);
      }
    }

    const brand = localRepo.getBrand(brandId);
    if (brand) {
      brand.official_assets = brand.official_assets.filter(a => a.id !== assetId);
      localRepo.saveBrand(brand);
    }
  }

  // --- SCANS ---
  async triggerScan(brandId: string, options?: { selectedSources?: string[] }): Promise<ScanSummary> {
    const selectedSources = options?.selectedSources || ['synthetic_demo'];
    const brand = localRepo.getBrand(brandId);

    // If online backend available and only default scan requested
    if (this.lastStatus.isOnline && selectedSources.includes('synthetic_demo') && selectedSources.length === 1) {
      try {
        const res = await fetch(`${this.customApiUrl}/scans`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brand_id: brandId })
        });
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('Backend triggerScan failed, using deterministic local engine', err);
      }
    }

    const sourceResults: Array<{
      id: string;
      source_name: string;
      source_type: string;
      candidates_found: number;
      status: 'success' | 'empty' | 'partial' | 'failed' | 'not_configured';
      notes?: string;
    }> = [];

    const extraCandidates: any[] = [];

    // 1. Synthetic feed if selected
    if (selectedSources.includes('synthetic_demo')) {
      const demoCount = localRepo.getCandidates().length;
      sourceResults.push({
        id: 'src-synthetic',
        source_name: 'Synthetic Identity Benchmark Feed',
        source_type: 'synthetic_demo',
        candidates_found: demoCount,
        status: 'success',
        notes: 'Controlled fictional benchmark containing homoglyphs, exact clones, and test fixtures.'
      });
    }

    // 2. Real Apple iTunes Public Search API if selected
    if (selectedSources.includes('apple_itunes') && brand) {
      try {
        const searchTerm = encodeURIComponent(brand.name);
        const itunesRes = await fetch(`https://itunes.apple.com/search?term=${searchTerm}&entity=software&limit=8`);
        if (itunesRes.ok) {
          const itunesData = await itunesRes.json();
          const items = itunesData.results || [];
          if (items.length > 0) {
            sourceResults.push({
              id: 'src-itunes',
              source_name: 'Apple App Store Public Store Feed',
              source_type: 'live_api',
              candidates_found: items.length,
              status: 'success',
              notes: `Queried Apple iTunes public search API for '${brand.name}' without scraping.`
            });

            for (const item of items) {
              extraCandidates.push({
                id: 'apple-live-' + item.trackId,
                entity_type: 'mobile_app',
                platform: 'app_store',
                display_name: item.trackName,
                handle: null,
                external_id: String(item.trackId),
                package_or_bundle_id: item.bundleId,
                developer_id: String(item.artistId || ''),
                developer_name: item.artistName,
                avatar_or_icon_url: item.artworkUrl100 || item.artworkUrl60 || null,
                description: item.description ? item.description.substring(0, 400) : '',
                perceptual_hash: 'b3f12a89c4e47d19',
                source_feed: 'apple_itunes'
              });
            }
          } else {
            sourceResults.push({
              id: 'src-itunes',
              source_name: 'Apple App Store Public Store Feed',
              source_type: 'live_api',
              candidates_found: 0,
              status: 'empty',
              notes: `Apple search returned 0 software listings for query '${brand.name}'.`
            });
          }
        } else {
          sourceResults.push({
            id: 'src-itunes',
            source_name: 'Apple App Store Public Store Feed',
            source_type: 'live_api',
            candidates_found: 0,
            status: 'failed',
            notes: `Apple search responded with HTTP ${itunesRes.status}.`
          });
        }
      } catch (err: any) {
        sourceResults.push({
          id: 'src-itunes',
          source_name: 'Apple App Store Public Store Feed',
          source_type: 'live_api',
          candidates_found: 0,
          status: 'failed',
          notes: `Network error reaching Apple search API: ${err?.message || 'request timed out'}.`
        });
      }
    }

    return localRepo.executeScan(brandId, {
      sourceResults,
      additionalCandidates: extraCandidates
    });
  }

  async getScans(brandId?: string): Promise<ScanSummary[]> {
    if (this.lastStatus.isOnline) {
      try {
        const url = brandId ? `${this.customApiUrl}/scans?brand_id=${brandId}` : `${this.customApiUrl}/scans`;
        const res = await fetch(url);
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('Backend getScans failed', err);
      }
    }
    return localRepo.getScans(brandId);
  }

  // --- FINDINGS ---
  async getFindings(filters?: {
    brandId?: string;
    platform?: string;
    riskBand?: string;
    reviewStatus?: string;
    entityType?: string;
    search?: string;
  }): Promise<Finding[]> {
    if (this.lastStatus.isOnline) {
      try {
        const params = new URLSearchParams();
        if (filters?.brandId) params.append('brand_id', filters.brandId);
        if (filters?.platform) params.append('platform', filters.platform);
        if (filters?.riskBand) params.append('risk_band', filters.riskBand);
        if (filters?.reviewStatus) params.append('review_status', filters.reviewStatus);
        if (filters?.entityType) params.append('entity_type', filters.entityType);
        if (filters?.search) params.append('search', filters.search);

        const res = await fetch(`${this.customApiUrl}/findings?${params.toString()}`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('Backend getFindings failed', err);
      }
    }

    let results = localRepo.getFindings(filters?.brandId);
    if (filters?.platform) {
      results = results.filter(f => f.candidate.platform.toLowerCase() === filters.platform?.toLowerCase());
    }
    if (filters?.riskBand) {
      results = results.filter(f => f.risk_band === filters.riskBand);
    }
    if (filters?.reviewStatus) {
      results = results.filter(f => f.review_status === filters.reviewStatus);
    }
    if (filters?.entityType) {
      results = results.filter(f => f.candidate.entity_type === filters.entityType);
    }
    if (filters?.search) {
      const s = filters.search.toLowerCase();
      results = results.filter(f =>
        f.candidate.display_name.toLowerCase().includes(s) ||
        (f.candidate.handle && f.candidate.handle.toLowerCase().includes(s)) ||
        (f.candidate.package_or_bundle_id && f.candidate.package_or_bundle_id.toLowerCase().includes(s))
      );
    }

    return results;
  }

  async getFinding(id: string): Promise<Finding | undefined> {
    if (this.lastStatus.isOnline) {
      try {
        const res = await fetch(`${this.customApiUrl}/findings/${id}`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('Backend getFinding failed', err);
      }
    }
    return localRepo.getFinding(id);
  }

  async updateFindingReview(findingId: string, status: string, notes?: string): Promise<Finding | undefined> {
    if (this.lastStatus.isOnline) {
      try {
        const res = await fetch(`${this.customApiUrl}/findings/${findingId}/review`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, notes })
        });
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('Backend updateFindingReview failed', err);
      }
    }
    return localRepo.updateFindingReview(findingId, status, notes);
  }

  async getTakedownReport(findingId: string): Promise<TakedownReport> {
    if (this.lastStatus.isOnline) {
      try {
        const res = await fetch(`${this.customApiUrl}/findings/${findingId}/report`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('Backend getTakedownReport failed', err);
      }
    }

    const finding = localRepo.getFinding(findingId);
    if (!finding) throw new Error('Finding not found');
    const brand = localRepo.getBrand(finding.brand_id);
    const cand = finding.candidate;

    const checklist = [
      'Verify candidate is not an authorized international affiliate, partner agency, or contractor.',
      'Confirm that registered official external account ID or package identifier has not recently migrated.',
      'Document archival timestamped screenshots of profile bio, avatar, and recent activity.',
      'Submit notice under relevant platform Terms of Service / Trademark Abuse procedure.'
    ];

    const signalsSummary = finding.signals.map(s => ({
      signal: s.signal_type.replace('_', ' ').toUpperCase(),
      score: s.raw_score,
      method: s.method_used,
      explanation: s.explanation
    }));

    const markdown = `# BRAND IMPERSONATION TAKEDOWN NOTICE (DRAFT)
**Status:** DRAFT — FOR HUMAN SECURITY ANALYST REVIEW ONLY
**Generated At:** ${new Date().toUTCString()}
**Protected Entity:** ${brand?.name || 'Protected Brand'} (${brand?.official_website || 'N/A'})

---

### 1. TARGET INFRINGING ENTITY
- **Platform:** ${cand.platform.toUpperCase()}
- **Entity Type:** ${cand.entity_type.replace('_', ' ').toUpperCase()}
- **Target Name/Title:** ${cand.display_name}
- **Handle / Identifier:** ${cand.handle || cand.package_or_bundle_id || cand.external_id || 'N/A'}
- **Observed Bio / Description:** ${cand.description || 'N/A'}

### 2. RISK ANALYSIS & EVIDENCE STATEMENT
- **Calculated Risk Score:** ${finding.risk_score} / 100
- **Risk Band:** ${finding.risk_band.toUpperCase()}
- **Corroboration Verified:** ${finding.corroboration_met ? 'YES' : 'NO'}
- **Analyst Review State:** ${finding.review_status.toUpperCase()}

**Forensic Synthesis:**
${finding.explanation_summary}

### 3. TECHNICAL SIGNAL BREAKDOWN
${signalsSummary.map(s => `- **${s.signal}** (${s.score}% - ${s.method}): ${s.explanation}`).join('\n')}

### 4. RECOMMENDED ACTION
Initiate standard takedown request to ${cand.platform.toUpperCase()} abuse desk alleging deceptive brand impersonation and misleading consumer credentials.

### 5. HUMAN PRE-SUBMISSION VERIFICATION CHECKLIST
${checklist.map(c => `[ ] ${c}`).join('\n')}

---
*Notice: BrandGuard does not issue automated legal demands or claim content removal. This document serves as an internal forensic evidence draft.*`;

    return {
      finding_id: finding.id,
      report_title: `BrandGuard Takedown Notice Draft - ${cand.display_name} (${cand.platform})`,
      draft_status: 'DRAFT - FOR HUMAN REVIEW ONLY',
      generated_at: new Date().toISOString(),
      brand_protected: {
        name: brand?.name || 'NovaPay',
        website: brand?.official_website || 'https://www.novapay.io',
        domain: brand?.normalized_domain || 'novapay.io'
      },
      target_infringing_entity: {
        platform: cand.platform,
        display_name: cand.display_name,
        handle: cand.handle,
        external_id: cand.external_id,
        package_id: cand.package_or_bundle_id,
        developer: cand.developer_name
      },
      corroborated_signals: signalsSummary,
      evidence_statement: finding.explanation_summary,
      recommended_action: `Escalate to ${cand.platform} Trust & Safety team.`,
      human_verification_checklist: checklist,
      raw_markdown: markdown
    };
  }

  // --- EVALUATION ---
  async getEvaluationSummary(): Promise<EvaluationSummary> {
    if (this.lastStatus.isOnline) {
      try {
        const res = await fetch(`${this.customApiUrl}/evaluation/summary`);
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('Backend getEvaluationSummary failed', err);
      }
    }

    const candidates = localRepo.getCandidates();
    const findings = localRepo.getFindings();
    const exclusions = localRepo.getExclusions();

    let tp = 0;
    let fp = 0;
    let fn = 0;
    let tn = 0;
    let correctExclusions = 0;
    let totalOfficial = 0;

    const techMap: Record<string, { total: number; tp: number; fp: number; fn: number; tn: number }> = {};

    for (const cand of candidates) {
      const gt = cand.ground_truth;
      if (!gt) continue;

      const techName = gt.threat_technique || 'Standard Check';
      if (!techMap[techName]) {
        techMap[techName] = { total: 0, tp: 0, fp: 0, fn: 0, tn: 0 };
      }
      techMap[techName].total++;

      const isExcluded = exclusions.some(e => e.record_id === cand.id);
      if (gt.is_official_asset) {
        totalOfficial++;
        if (isExcluded) correctExclusions++;
      }

      const finding = findings.find(f => f.record_id === cand.id);
      const isPredictedPositive = !isExcluded && finding && (finding.risk_band === 'high' || finding.risk_band === 'medium');

      if (gt.is_impersonation) {
        if (isPredictedPositive) {
          tp++;
          techMap[techName].tp++;
        } else {
          fn++;
          techMap[techName].fn++;
        }
      } else {
        if (isPredictedPositive) {
          fp++;
          techMap[techName].fp++;
        } else {
          tn++;
          techMap[techName].tn++;
        }
      }
    }

    const precision = tp + fp > 0 ? Math.round((tp / (tp + fp)) * 1000) / 1000 : 1.0;
    const recall = tp + fn > 0 ? Math.round((tp / (tp + fn)) * 1000) / 1000 : 1.0;
    const fpr = fp + tn > 0 ? Math.round((fp / (fp + tn)) * 1000) / 1000 : 0.0;
    const f1 = precision + recall > 0 ? Math.round((2 * precision * recall) / (precision + recall) * 1000) / 1000 : 0.0;
    const exclCorrectness = totalOfficial > 0 ? Math.round((correctExclusions / totalOfficial) * 1000) / 1000 : 1.0;

    const techniqueList = Object.entries(techMap).map(([name, stat]) => {
      const p = stat.tp + stat.fp > 0 ? Math.round((stat.tp / (stat.tp + stat.fp)) * 100) / 100 : 1.0;
      const r = stat.tp + stat.fn > 0 ? Math.round((stat.tp / (stat.tp + stat.fn)) * 100) / 100 : 0.0;
      const f = p + r > 0 ? Math.round((2 * p * r) / (p + r) * 100) / 100 : 0.0;
      return {
        technique_name: name,
        sample_count: stat.total,
        true_positives: stat.tp,
        false_positives: stat.fp,
        false_negatives: stat.fn,
        true_negatives: stat.tn,
        precision: p,
        recall: r,
        f1_score: f
      };
    });

    return {
      total_evaluated_records: tp + fp + fn + tn,
      dataset_origin: 'Synthetic Identity Benchmark Suite (Controlled Fictional Universe)',
      limitations_disclaimer: 'Evaluation metrics reflect performance solely against the controlled synthetic test suite. Real-world efficacy may differ due to emerging adversary tactics and platform-specific metadata variations.',
      true_positives: tp,
      false_positives: fp,
      false_negatives: fn,
      true_negatives: tn,
      precision,
      recall,
      false_positive_rate: fpr,
      f1_score: f1,
      exclusion_correctness_rate: exclCorrectness,
      confusion_matrix: {
        true_positives: tp,
        false_positives: fp,
        false_negatives: fn,
        true_negatives: tn
      },
      techniques: techniqueList
    };
  }

  // --- DEMO RESET ---
  async resetDemoData(): Promise<void> {
    if (this.lastStatus.isOnline) {
      try {
        await fetch(`${this.customApiUrl}/demo/reset`, { method: 'POST' });
      } catch (err) {
        console.warn('Backend resetDemoData failed', err);
      }
    }
    localRepo.resetToDemo();
  }

  // Auto trigger scan if none exists
  async ensureInitialScan(brandId: string): Promise<void> {
    const scans = await this.getScans(brandId);
    if (scans.length === 0) {
      await this.triggerScan(brandId);
    }
  }
}

export const apiClient = new ApiService();
