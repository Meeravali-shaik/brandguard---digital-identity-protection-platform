from typing import Dict, Any, Optional
import math


def compute_hash_distance(hash1: Optional[str], hash2: Optional[str]) -> Dict[str, Any]:
    """
    Computes Hamming distance between 64-bit perceptual hashes (hex string representation).
    Hamming distance 0 = identical image.
    Distance <= 10 = highly similar perceptual features.
    Distance > 20 = distinct images.
    """
    if not hash1 or not hash2:
        return {
            "is_available": False,
            "raw_score": 0.0,
            "hamming_distance": None,
            "method": "perceptual_hash_hamming",
            "explanation": "Image hash not available for candidate or brand reference asset.",
        }

    try:
        # Convert hex strings to binary integers
        int1 = int(hash1, 16)
        int2 = int(hash2, 16)
        xor_result = int1 ^ int2
        # Count set bits (Hamming distance)
        hamming_dist = bin(xor_result).count('1')
        
        # Max distance for 64-bit hash is 64
        # Convert to a 0-100 similarity score: 0 dist -> 100%, 10 dist -> 75%, 25+ dist -> 0%
        if hamming_dist == 0:
            score = 100.0
            explanation = "Candidate logo hash is identical to official brand logo (0-bit difference)."
        elif hamming_dist <= 5:
            score = 90.0 - (hamming_dist * 3.0)
            explanation = f"Candidate logo shows near-identical visual features (Hamming distance {hamming_dist}/64)."
        elif hamming_dist <= 12:
            score = 70.0 - ((hamming_dist - 5) * 4.0)
            explanation = f"Candidate logo shows moderate visual similarity to official brand logo (Hamming distance {hamming_dist}/64)."
        else:
            score = max(0.0, 40.0 - (hamming_dist * 1.5))
            explanation = f"Candidate logo differs significantly from official brand logo (Hamming distance {hamming_dist}/64)."

        return {
            "is_available": True,
            "raw_score": round(score, 1),
            "hamming_distance": hamming_dist,
            "method": "perceptual_dhash_hamming",
            "explanation": explanation,
        }
    except Exception as e:
        return {
            "is_available": False,
            "raw_score": 0.0,
            "hamming_distance": None,
            "method": "perceptual_hash_hamming",
            "explanation": f"Failed to compute image hash distance: {str(e)}",
        }
