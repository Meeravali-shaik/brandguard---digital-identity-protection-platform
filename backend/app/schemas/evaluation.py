from pydantic import BaseModel
from typing import List, Dict, Any, Optional


class TechniqueMetric(BaseModel):
    technique_name: str
    sample_count: int
    true_positives: int
    false_positives: int
    false_negatives: int
    true_negatives: int
    precision: float
    recall: float
    f1_score: float


class EvaluationSummaryResponse(BaseModel):
    total_evaluated_records: int
    dataset_origin: str = "Labelled Synthetic Benchmark (Fictional Identities)"
    limitations_disclaimer: str
    true_positives: int
    false_positives: int
    false_negatives: int
    true_negatives: int
    precision: float
    recall: float
    false_positive_rate: float
    f1_score: float
    exclusion_correctness_rate: float
    confusion_matrix: Dict[str, int]
    techniques: List[TechniqueMetric] = []
