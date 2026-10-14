import { RiskBand } from '../types/brandguard';

export const SIGNAL_BASE_WEIGHTS: Record<string, number> = {
  name_similarity: 0.40,
  logo_similarity: 0.25,
  identity_conflict: 0.20,
  description_similarity: 0.15
};

export const BAND_THRESHOLDS = {
  ignored: 30.0,
  needs_review: 55.0,
  medium: 75.0,
  high: 100.0
};

export interface EvaluatedSignal {
  type: 'name_similarity' | 'logo_similarity' | 'description_similarity' | 'identity_conflict';
  rawScore: number;
  isAvailable: boolean;
  explanation: string;
}

export function calculateRiskScore(signals: EvaluatedSignal[]): {
  compositeScore: number;
  riskBand: RiskBand;
  corroborationMet: boolean;
  summaryExplanation: string;
} {
  const availableSignals = signals.filter(s => s.isAvailable);

  if (availableSignals.length === 0) {
    return {
      compositeScore: 0,
      riskBand: 'ignored',
      corroborationMet: false,
      summaryExplanation: 'No signals were available for analysis.'
    };
  }

  const totalWeight = availableSignals.reduce((sum, s) => sum + (SIGNAL_BASE_WEIGHTS[s.type] || 0.1), 0) || 1.0;

  let rawWeightedSum = 0;
  for (const s of availableSignals) {
    const w = (SIGNAL_BASE_WEIGHTS[s.type] || 0.1) / totalWeight;
    rawWeightedSum += s.rawScore * w;
  }

  const compositeScore = Math.round(rawWeightedSum * 10) / 10;

  // Corroboration checks
  const highSignals = availableSignals.filter(s => s.rawScore >= 65);
  const nameOnlyActive = highSignals.length === 1 && highSignals[0].type === 'name_similarity';

  const strongCorroboration = availableSignals.filter(s => s.rawScore >= 60).length >= 2;
  const moderateCorroboration = availableSignals.filter(s => s.rawScore >= 45).length >= 2 || strongCorroboration;

  let riskBand: RiskBand = 'ignored';
  let corroborationMet = false;

  if (compositeScore >= BAND_THRESHOLDS.medium && strongCorroboration && !nameOnlyActive) {
    riskBand = 'high';
    corroborationMet = true;
  } else if (compositeScore >= BAND_THRESHOLDS.needs_review && moderateCorroboration && !nameOnlyActive) {
    riskBand = 'medium';
    corroborationMet = true;
  } else if (compositeScore >= BAND_THRESHOLDS.ignored) {
    riskBand = 'needs_review';
    corroborationMet = false;
  } else {
    riskBand = 'ignored';
    corroborationMet = false;
  }

  // Enforce anti-false-positive guardrail: Name-only similarity never generates medium or high!
  if (nameOnlyActive && (riskBand === 'high' || riskBand === 'medium')) {
    riskBand = 'needs_review';
    corroborationMet = false;
  }

  // Build explainable summary
  const activeReasons = availableSignals
    .filter(s => s.rawScore >= 50)
    .map(s => s.explanation);

  let summaryExplanation = '';
  if (activeReasons.length === 0) {
    summaryExplanation = `Low composite similarity score (${compositeScore}%). Indicators do not warrant operational escalation.`;
  } else {
    summaryExplanation = activeReasons.join(' ');
    if (nameOnlyActive) {
      summaryExplanation += ' Confined to name similarity without independent corroborating signals; capped at needs review.';
    }
  }

  return {
    compositeScore,
    riskBand,
    corroborationMet,
    summaryExplanation
  };
}
