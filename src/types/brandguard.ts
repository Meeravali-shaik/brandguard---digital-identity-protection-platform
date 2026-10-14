export type EntityType = 'social_profile' | 'mobile_app';
export type PlatformType = 'twitter' | 'instagram' | 'facebook' | 'play_store' | 'app_store' | 'tiktok' | 'youtube';
export type RiskBand = 'ignored' | 'needs_review' | 'medium' | 'high';
export type ReviewStatus = 'new' | 'investigating' | 'confirmed' | 'false_positive' | 'dismissed';

export interface BrandAlias {
  id: string;
  brand_id: string;
  alias_name: string;
  normalized_name: string;
  created_at: string;
}

export interface OfficialAsset {
  id: string;
  brand_id: string;
  asset_kind: 'social_profile' | 'mobile_application';
  platform: string;
  handle?: string | null;
  normalized_handle?: string | null;
  external_account_id?: string | null; // Strict exclusion anchor
  package_or_bundle_id?: string | null; // Strict exclusion anchor
  developer_id?: string | null;
  developer_name?: string | null;
  developer_website?: string | null;
  official_listing_url?: string | null;
  verified: boolean;
  created_at: string;
}

export interface Brand {
  id: string;
  name: string;
  official_website: string;
  normalized_domain: string;
  description?: string | null;
  logo_url?: string | null;
  logo_hash?: string | null;
  is_active: boolean;
  aliases: BrandAlias[];
  official_assets: OfficialAsset[];
  created_at: string;
  updated_at: string;
}

export interface DatasetRecord {
  id: string;
  batch_id: string;
  target_brand_name: string;
  entity_type: EntityType;
  platform: string;
  display_name: string;
  handle?: string | null;
  external_id?: string | null;
  package_or_bundle_id?: string | null;
  developer_id?: string | null;
  developer_name?: string | null;
  description?: string | null;
  avatar_or_icon_url?: string | null;
  profile_or_store_url?: string | null;
  perceptual_hash?: string | null;
  raw_metadata?: Record<string, any>;
  ground_truth?: {
    is_impersonation: boolean;
    is_official_asset: boolean;
    threat_technique?: string;
    notes?: string;
  };
}

export interface FindingSignal {
  id: string;
  finding_id: string;
  signal_type: 'name_similarity' | 'logo_similarity' | 'description_similarity' | 'identity_conflict';
  raw_score: number;
  weight: number;
  contribution: number;
  is_available: boolean;
  raw_candidate_value?: string | null;
  raw_reference_value?: string | null;
  normalized_candidate_value?: string | null;
  normalized_reference_value?: string | null;
  method_used: string;
  explanation: string;
}

export interface ReviewEvent {
  id: string;
  finding_id: string;
  previous_status: string;
  new_status: string;
  notes?: string | null;
  reviewer_identity: string;
  created_at: string;
}

export interface Finding {
  id: string;
  scan_id: string;
  brand_id: string;
  record_id: string;
  risk_score: number;
  risk_band: RiskBand;
  corroboration_met: boolean;
  explanation_summary: string;
  evidence_breakdown: Record<string, any>;
  review_status: ReviewStatus;
  analyst_notes?: string | null;
  reviewed_at?: string | null;
  candidate: DatasetRecord;
  signals: FindingSignal[];
  review_events: ReviewEvent[];
  created_at: string;
}

export interface SourceResult {
  id: string;
  source_name: string;
  source_type: string;
  candidates_found: number;
  status: 'success' | 'failed' | 'empty';
  error_details?: string | null;
}

export interface ScanSummary {
  id: string;
  brand_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'partial';
  candidates_analyzed: number;
  findings_created: number;
  exclusions_applied: number;
  high_risk_count: number;
  medium_risk_count: number;
  needs_review_count: number;
  ignored_count: number;
  confirmed_count: number;
  source_results: SourceResult[];
  created_at: string;
  updated_at: string;
}

export interface ExclusionRecord {
  id: string;
  scan_id: string;
  record_id: string;
  matched_official_asset_id?: string | null;
  exclusion_reason: string;
  matched_criteria: Record<string, any>;
  created_at: string;
}

export interface TechniqueMetric {
  technique_name: string;
  sample_count: number;
  true_positives: number;
  false_positives: number;
  false_negatives: number;
  true_negatives: number;
  precision: number;
  recall: number;
  f1_score: number;
}

export interface EvaluationSummary {
  total_evaluated_records: number;
  dataset_origin: string;
  limitations_disclaimer: string;
  true_positives: number;
  false_positives: number;
  false_negatives: number;
  true_negatives: number;
  precision: number;
  recall: number;
  false_positive_rate: number;
  f1_score: number;
  exclusion_correctness_rate: number;
  confusion_matrix: {
    true_positives: number;
    false_positives: number;
    false_negatives: number;
    true_negatives: number;
  };
  techniques: TechniqueMetric[];
}

export interface TakedownReport {
  finding_id: string;
  report_title: string;
  draft_status: string;
  generated_at: string;
  brand_protected: {
    name: string;
    website: string;
    domain: string;
  };
  target_infringing_entity: {
    platform: string;
    display_name: string;
    handle?: string | null;
    external_id?: string | null;
    package_id?: string | null;
    developer?: string | null;
  };
  corroborated_signals: Array<{
    signal: string;
    score: number;
    method: string;
    explanation: string;
  }>;
  evidence_statement: string;
  recommended_action: string;
  human_verification_checklist: string[];
  raw_markdown: string;
}
