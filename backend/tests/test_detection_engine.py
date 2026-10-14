from app.engine.name_similarity import compute_name_similarity, normalize_unicode
from app.engine.image_similarity import compute_hash_distance
from app.engine.description_similarity import compute_description_similarity
from app.engine.scoring import calculate_risk_score


def test_exact_name_similarity():
    res = compute_name_similarity("NovaPay", "NovaPay")
    assert res["score"] == 100.0
    assert res["is_exact"] is True


def test_unicode_homoglyph_detection():
    # Cyrillic 'а' U+0430
    spoofed = "Nov\u0430Pay"
    res = compute_name_similarity(spoofed, "NovaPay")
    assert res["has_homoglyphs"] is True
    assert res["score"] >= 90.0
    assert "homoglyph" in res["method"]


def test_leetspeak_substitution():
    res = compute_name_similarity("N0vaPay", "NovaPay")
    assert res["score"] >= 90.0
    assert res["method"] == "leetspeak_substitution"


def test_name_only_never_becomes_high_risk():
    """
    CRITICAL REQUIREMENT: A name-only match cannot become a high-risk finding.
    Must be capped at needs_review when lacking corroborating signals.
    """
    signals = [
        {
            "type": "name_similarity",
            "raw_score": 100.0,
            "is_available": True,
            "explanation": "Exact name match"
        },
        {
            "type": "logo_similarity",
            "raw_score": 0.0,
            "is_available": False,
            "explanation": "No logo"
        },
        {
            "type": "description_similarity",
            "raw_score": 0.0,
            "is_available": False,
            "explanation": "No description"
        },
        {
            "type": "identity_conflict",
            "raw_score": 0.0,
            "is_available": False,
            "explanation": "No anchor conflict"
        }
    ]
    composite_score, risk_band, corroboration_met, summary = calculate_risk_score(signals)
    assert risk_band != "high"
    assert risk_band != "medium"
    assert risk_band == "needs_review"
    assert corroboration_met is False
    assert "Confined to name similarity" in summary


def test_corroborated_signals_reach_high_risk():
    signals = [
        {
            "type": "name_similarity",
            "raw_score": 100.0,
            "is_available": True,
            "explanation": "Exact name match"
        },
        {
            "type": "logo_similarity",
            "raw_score": 95.0,
            "is_available": True,
            "explanation": "Identical logo hash"
        },
        {
            "type": "identity_conflict",
            "raw_score": 90.0,
            "is_available": True,
            "explanation": "Rogue external ID"
        }
    ]
    composite_score, risk_band, corroboration_met, summary = calculate_risk_score(signals)
    assert risk_band == "high"
    assert corroboration_met is True
