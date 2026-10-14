from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.dataset import DatasetRecord, EvaluationLabel
from app.models.scan import Finding, Exclusion, FindingRiskBand
from app.schemas.evaluation import EvaluationSummaryResponse, TechniqueMetric

router = APIRouter(prefix="/evaluation", tags=["Evaluation"])


@router.get("/summary", response_model=EvaluationSummaryResponse)
def get_evaluation_summary(db: Session = Depends(get_db)):
    """
    Evaluates detector performance against isolated ground-truth labels.
    STRICT: Ground truth labels are stored in `evaluation_labels` and were NEVER
    accessible to the detection engine during inference.
    """
    records_with_labels = db.query(DatasetRecord).join(EvaluationLabel).all()

    tp = 0  # True Impersonator predicted as Medium or High Risk
    fp = 0  # Non-Impersonator incorrectly predicted as Medium or High Risk
    fn = 0  # True Impersonator missed (Ignored or Needs Review)
    tn = 0  # Non-Impersonator correctly Ignored, Needs Review, or Excluded

    exclusion_correct_count = 0
    total_official_assets_evaluated = 0

    techniques_map = {}

    for record in records_with_labels:
        gt = record.evaluation_label
        is_true_impersonator = gt.is_impersonation
        is_official = gt.is_official_asset
        technique = gt.primary_threat_technique or "standard_identity_check"

        if technique not in techniques_map:
            techniques_map[technique] = {
                "sample_count": 0, "tp": 0, "fp": 0, "fn": 0, "tn": 0
            }
        techniques_map[technique]["sample_count"] += 1

        # Check if record was excluded
        exclusion = db.query(Exclusion).filter(Exclusion.record_id == record.id).first()
        is_excluded = exclusion is not None

        if is_official:
            total_official_assets_evaluated += 1
            if is_excluded:
                exclusion_correct_count += 1

        # Fetch latest finding
        finding = db.query(Finding).filter(Finding.record_id == record.id).order_by(Finding.created_at.desc()).first()
        predicted_positive = False
        if finding and not is_excluded:
            predicted_positive = finding.risk_band in [FindingRiskBand.HIGH.value, FindingRiskBand.MEDIUM.value]

        if is_true_impersonator:
            if predicted_positive:
                tp += 1
                techniques_map[technique]["tp"] += 1
            else:
                fn += 1
                techniques_map[technique]["fn"] += 1
        else:
            if predicted_positive:
                fp += 1
                techniques_map[technique]["fp"] += 1
            else:
                tn += 1
                techniques_map[technique]["tn"] += 1

    total = tp + fp + fn + tn
    precision = round(tp / (tp + fp), 4) if (tp + fp) > 0 else 0.0
    recall = round(tp / (tp + fn), 4) if (tp + fn) > 0 else 0.0
    fpr = round(fp / (fp + tn), 4) if (fp + tn) > 0 else 0.0
    f1 = round(2 * (precision * recall) / (precision + recall), 4) if (precision + recall) > 0 else 0.0
    excl_correctness = (
        round(exclusion_correct_count / total_official_assets_evaluated, 4)
        if total_official_assets_evaluated > 0 else 1.0
    )

    technique_metrics = []
    for t_name, counts in techniques_map.items():
        t_p = (
            round(counts["tp"] / (counts["tp"] + counts["fp"]), 3)
            if (counts["tp"] + counts["fp"]) > 0 else 1.0
        )
        t_r = (
            round(counts["tp"] / (counts["tp"] + counts["fn"]), 3)
            if (counts["tp"] + counts["fn"]) > 0 else 0.0
        )
        t_f1 = (
            round(2 * (t_p * t_r) / (t_p + t_r), 3)
            if (t_p + t_r) > 0 else 0.0
        )
        technique_metrics.append(TechniqueMetric(
            technique_name=t_name.replace("_", " ").title(),
            sample_count=counts["sample_count"],
            true_positives=counts["tp"],
            false_positives=counts["fp"],
            false_negatives=counts["fn"],
            true_negatives=counts["tn"],
            precision=t_p,
            recall=t_r,
            f1_score=t_f1
        ))

    return EvaluationSummaryResponse(
        total_evaluated_records=total,
        dataset_origin="Synthetic Identity Benchmark Suite (Controlled Fictional Universe)",
        limitations_disclaimer=(
            "Evaluation metrics reflect performance solely against the controlled synthetic test suite. "
            "Real-world efficacy may differ due to emerging adversary tactics and platform-specific metadata variations."
        ),
        true_positives=tp,
        false_positives=fp,
        false_negatives=fn,
        true_negatives=tn,
        precision=precision,
        recall=recall,
        false_positive_rate=fpr,
        f1_score=f1,
        exclusion_correctness_rate=excl_correctness,
        confusion_matrix={
            "true_positives": tp,
            "false_positives": fp,
            "false_negatives": fn,
            "true_negatives": tn
        },
        techniques=technique_metrics
    )
