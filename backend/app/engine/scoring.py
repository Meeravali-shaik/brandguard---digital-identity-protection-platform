from typing import Dict, Any, List, Tuple
import enum


class FindingRiskBand(str, enum.Enum):
    IGNORED = "ignored"          # 0 - 29.99
    NEEDS_REVIEW = "needs_review"# 30 - 54.99
    MEDIUM = "medium"            # 55 - 74.99 with corroboration
    HIGH = "high"                # 75 - 100 with strong corroboration


# Signal Weights (sum of available weights is normalized to 1.0)
SIGNAL_BASE_WEIGHTS = {
    "name_similarity": 0.40,
    "logo_similarity": 0.25,
    "identity_conflict": 0.20,
    "description_similarity": 0.15,
}

# Score Bands
BAND_THRESHOLDS = {
    "ignored": 30.0,      # < 30.0
    "needs_review": 55.0, # 30.0 to 54.99
    "medium": 75.0,       # 55.0 to 74.99 with corroboration
    "high": 100.0,        # 75.0 to 100 with strong corroboration
}


def calculate_risk_score(signals: List[Dict[str, Any]]) -> Tuple[float, str, bool, str]:
    """
    Coverage-aware risk score calculation.
    
    Returns:
    (final_score, risk_band, corroboration_met, summary_explanation)
    """
    available_signals = [s for s in signals if s.get("is_available", True)]
    
    if not available_signals:
        return 0.0, FindingRiskBand.IGNORED.value, False, "No signals were available for analysis."

    total_weight = sum(SIGNAL_BASE_WEIGHTS.get(s["type"], 0.1) for s in available_signals)
    if total_weight == 0:
        total_weight = 1.0

    raw_weighted_sum = 0.0
    for s in available_signals:
        w = SIGNAL_BASE_WEIGHTS.get(s["type"], 0.1) / total_weight
        raw_weighted_sum += s["raw_score"] * w

    composite_score = round(raw_weighted_sum, 1)

    # Corroboration checks:
    # A name-only similarity must NEVER generate a medium or high finding!
    high_signals = [s for s in available_signals if s["raw_score"] >= 65.0]
    name_only_active = len(high_signals) == 1 and high_signals[0]["type"] == "name_similarity"
    
    # Strong corroboration: at least 2 distinct signals >= 60%
    strong_corroboration = len([s for s in available_signals if s["raw_score"] >= 60.0]) >= 2
    moderate_corroboration = len([s for s in available_signals if s["raw_score"] >= 45.0]) >= 2 or strong_corroboration

    # Assign risk band based on thresholds & corroboration constraints
    if composite_score >= BAND_THRESHOLDS["medium"] and strong_corroboration and not name_only_active:
        risk_band = FindingRiskBand.HIGH.value
        corroboration_met = True
    elif composite_score >= BAND_THRESHOLDS["needs_review"] and moderate_corroboration and not name_only_active:
        risk_band = FindingRiskBand.MEDIUM.value
        corroboration_met = True
    elif composite_score >= BAND_THRESHOLDS["ignored"]:
        risk_band = FindingRiskBand.NEEDS_REVIEW.value
        corroboration_met = False
    else:
        risk_band = FindingRiskBand.IGNORED.value
        corroboration_met = False

    # Force downgrade if only name similarity triggered
    if name_only_active and risk_band in [FindingRiskBand.HIGH.value, FindingRiskBand.MEDIUM.value]:
        risk_band = FindingRiskBand.NEEDS_REVIEW.value
        corroboration_met = False

    # Generate explainable summary
    active_reasons = []
    for s in available_signals:
        if s["raw_score"] >= 50.0:
            active_reasons.append(s["explanation"])

    if not active_reasons:
        summary_explanation = f"Low composite similarity score ({composite_score}%). Indicators do not warrant immediate operational escalation."
    else:
        summary_explanation = " ".join(active_reasons)
        if name_only_active:
            summary_explanation += " Confined to name similarity without independent corroborating signals; capped at needs review."

    return composite_score, risk_band, corroboration_met, summary_explanation
