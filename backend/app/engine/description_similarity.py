import re
import math
from typing import Dict, Any, Optional
from collections import Counter


def tokenize_text(text: str) -> list[str]:
    """Simple stopword-filtered tokenizer for TF-IDF cosine comparison."""
    stopwords = {
        "the", "a", "an", "and", "or", "in", "on", "at", "to", "for", "with", "by",
        "of", "is", "are", "was", "were", "it", "this", "that", "your", "our", "all"
    }
    words = re.findall(r'\b[a-zA-Z]{2,}\b', text.lower())
    return [w for w in words if w not in stopwords]


def compute_description_similarity(cand_desc: Optional[str], ref_desc: Optional[str]) -> Dict[str, Any]:
    """
    Computes TF-IDF / Term Frequency Cosine Similarity between candidate description
    and the official brand description.
    """
    if not cand_desc or not ref_desc or not cand_desc.strip() or not ref_desc.strip():
        return {
            "is_available": False,
            "raw_score": 0.0,
            "shared_keywords": [],
            "method": "tfidf_cosine_similarity",
            "explanation": "Description not provided for candidate or official brand profile.",
        }

    cand_tokens = tokenize_text(cand_desc)
    ref_tokens = tokenize_text(ref_desc)

    if not cand_tokens or not ref_tokens:
        return {
            "is_available": False,
            "raw_score": 0.0,
            "shared_keywords": [],
            "method": "tfidf_cosine_similarity",
            "explanation": "Insufficient lexical tokens after noise removal.",
        }

    cand_tf = Counter(cand_tokens)
    ref_tf = Counter(ref_tokens)

    # Dot product
    common_terms = set(cand_tf.keys()).intersection(set(ref_tf.keys()))
    dot_product = sum(cand_tf[t] * ref_tf[t] for t in common_terms)

    # Magnitudes
    cand_mag = math.sqrt(sum(v * v for v in cand_tf.values()))
    ref_mag = math.sqrt(sum(v * v for v in ref_tf.values()))

    if cand_mag == 0 or ref_mag == 0:
        cosine_sim = 0.0
    else:
        cosine_sim = dot_product / (cand_mag * ref_mag)

    score = round(cosine_sim * 100.0, 1)
    shared_sample = sorted(list(common_terms))[:5]
    
    if score >= 70:
        explanation = f"High description phrasing overlap ({score}% cosine similarity). Shared terms: {', '.join(shared_sample)}."
    elif score >= 35:
        explanation = f"Moderate topical overlap ({score}% cosine similarity) with official brand profile."
    else:
        explanation = f"Low description similarity ({score}% cosine similarity). Minimal copied narrative."

    return {
        "is_available": True,
        "raw_score": float(score),
        "shared_keywords": shared_sample,
        "method": "tfidf_cosine_similarity",
        "explanation": explanation,
    }
