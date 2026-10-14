import unicodedata
import re
from typing import Dict, Any, Tuple
try:
    from rapidfuzz import fuzz, distance
except ImportError:
    # Standard python fallback if rapidfuzz is not yet installed in runtime
    class FuzzFallback:
        @staticmethod
        def ratio(s1: str, s2: str) -> float:
            if not s1 or not s2: return 0.0
            if s1 == s2: return 100.0
            # Basic Levenshtein ratio
            from difflib import SequenceMatcher
            return SequenceMatcher(None, s1, s2).ratio() * 100.0
            
        @staticmethod
        def token_sort_ratio(s1: str, s2: str) -> float:
            t1 = " ".join(sorted(s1.split()))
            t2 = " ".join(sorted(s2.split()))
            return FuzzFallback.ratio(t1, t2)
    fuzz = FuzzFallback()

# Common Cyrillic & Greek homoglyphs used in spoofing attacks
HOMOGLYPH_MAP = {
    'а': 'a', 'с': 'c', 'е': 'e', 'о': 'o', 'р': 'p', 'х': 'x', 'у': 'y',
    'і': 'i', 'ј': 'j', 'ѕ': 's', 'ԁ': 'd', 'ԛ': 'q', 'ԝ': 'w',
    'А': 'A', 'В': 'B', 'С': 'C', 'Е': 'E', 'Н': 'H', 'І': 'I', 'Ј': 'J',
    'К': 'K', 'М': 'M', 'О': 'O', 'Р': 'P', 'Т': 'T', 'Х': 'X', 'Ү': 'Y',
}

LEETSPEAK_MAP = {
    '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', '$': 's'
}


def normalize_unicode(text: str) -> Tuple[str, bool]:
    """
    Normalizes unicode to NFKC and detects confusable homoglyphs.
    Returns (normalized_text, has_homoglyphs).
    """
    if not text:
        return "", False
    
    nfkc = unicodedata.normalize("NFKC", text)
    has_homoglyphs = False
    converted_chars = []
    
    for ch in nfkc:
        if ch in HOMOGLYPH_MAP:
            converted_chars.append(HOMOGLYPH_MAP[ch])
            has_homoglyphs = True
        else:
            converted_chars.append(ch)
            
    return "".join(converted_chars), has_homoglyphs


def clean_token_string(text: str) -> str:
    """Removes non-alphanumeric punctuation and lowercases for compact matching."""
    norm, _ = normalize_unicode(text)
    return re.sub(r'[^a-zA-Z0-9]', '', norm).lower()


def compute_name_similarity(candidate_name: str, reference_name: str) -> Dict[str, Any]:
    """
    Computes explainable deterministic name similarity metrics.
    """
    if not candidate_name or not reference_name:
        return {
            "score": 0.0,
            "is_exact": False,
            "has_homoglyphs": False,
            "raw_candidate": candidate_name,
            "raw_reference": reference_name,
            "normalized_candidate": "",
            "normalized_reference": "",
            "method": "string_distance",
            "explanation": "Candidate or reference name is missing.",
        }

    norm_cand, cand_homoglyph = normalize_unicode(candidate_name)
    norm_ref, _ = normalize_unicode(reference_name)
    
    clean_cand = clean_token_string(norm_cand)
    clean_ref = clean_token_string(norm_ref)
    
    # 1. Exact string equality
    if candidate_name.strip() == reference_name.strip():
        return {
            "score": 100.0,
            "is_exact": True,
            "has_homoglyphs": False,
            "raw_candidate": candidate_name,
            "raw_reference": reference_name,
            "normalized_candidate": norm_cand,
            "normalized_reference": norm_ref,
            "method": "exact_match",
            "explanation": f"Candidate name '{candidate_name}' exactly matches registered brand '{reference_name}'.",
        }
    
    # 2. Homoglyph spoofing check
    if cand_homoglyph and clean_cand == clean_ref:
        return {
            "score": 96.0,
            "is_exact": False,
            "has_homoglyphs": True,
            "raw_candidate": candidate_name,
            "raw_reference": reference_name,
            "normalized_candidate": norm_cand,
            "normalized_reference": norm_ref,
            "method": "unicode_homoglyph_deobfuscation",
            "explanation": f"Candidate name '{candidate_name}' contains confusable homoglyphs mapping directly to '{reference_name}'.",
        }
        
    # 3. Leetspeak substitution check
    deleet_cand = clean_cand
    for k, v in LEETSPEAK_MAP.items():
        deleet_cand = deleet_cand.replace(k, v)
        
    if deleet_cand == clean_ref and clean_cand != clean_ref:
        return {
            "score": 92.0,
            "is_exact": False,
            "has_homoglyphs": False,
            "raw_candidate": candidate_name,
            "raw_reference": reference_name,
            "normalized_candidate": norm_cand,
            "normalized_reference": norm_ref,
            "method": "leetspeak_substitution",
            "explanation": f"Candidate name '{candidate_name}' uses leetspeak substitution of '{reference_name}'.",
        }

    # 4. Standard distance ratios
    ratio = fuzz.ratio(clean_cand, clean_ref)
    token_ratio = fuzz.token_sort_ratio(candidate_name.lower(), reference_name.lower())
    composite_score = round(max(ratio, token_ratio), 1)

    # Edit distance explanation
    diff_chars = abs(len(clean_cand) - len(clean_ref))
    explanation = f"Candidate name '{candidate_name}' has {composite_score}% similarity to brand '{reference_name}'."
    if composite_score >= 80 and diff_chars <= 2:
        explanation += f" Demonstrates single/double character alteration."
        
    return {
        "score": float(composite_score),
        "is_exact": False,
        "has_homoglyphs": cand_homoglyph,
        "raw_candidate": candidate_name,
        "raw_reference": reference_name,
        "normalized_candidate": norm_cand,
        "normalized_reference": norm_ref,
        "method": "rapidfuzz_levenshtein",
        "explanation": explanation,
    }
