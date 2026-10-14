from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import datetime, timezone

from app.database import get_db
from app.models.brand import Brand, OfficialAsset
from app.models.dataset import DatasetBatch, DatasetRecord
from app.models.scan import ScanRun, SourceResult, Exclusion, Finding, FindingSignal, ScanStatus, FindingRiskBand, ReviewStatus
from app.schemas.scan import ScanCreate, ScanSummaryResponse
from app.engine.name_similarity import compute_name_similarity
from app.engine.image_similarity import compute_hash_distance
from app.engine.description_similarity import compute_description_similarity
from app.engine.exclusions import evaluate_official_exclusion
from app.engine.scoring import calculate_risk_score

router = APIRouter(prefix="/scans", tags=["Scans"])


@router.post("", response_model=ScanSummaryResponse, status_code=status.HTTP_201_CREATED)
def trigger_scan(payload: ScanCreate, db: Session = Depends(get_db)):
    """
    Executes a deterministic digital risk protection scan for the specified brand.
    Applies strict official asset exclusion and multivariant signal corroboration.
    """
    brand = db.query(Brand).filter(Brand.id == payload.brand_id).first()
    if not brand:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Protected brand not found.")

    # 1. Initialize ScanRun
    scan = ScanRun(
        brand_id=brand.id,
        status=ScanStatus.RUNNING.value,
        candidates_analyzed=0,
        findings_created=0,
        exclusions_applied=0
    )
    db.add(scan)
    db.flush()

    # 2. Collect official assets for exclusion evaluation
    official_assets_raw = [
        {
            "id": a.id,
            "asset_kind": a.asset_kind,
            "platform": a.platform,
            "handle": a.handle,
            "external_account_id": a.external_account_id,
            "package_or_bundle_id": a.package_or_bundle_id,
            "developer_id": a.developer_id
        }
        for a in brand.official_assets
    ]

    # 3. Fetch candidate records from active dataset batches
    candidates = db.query(DatasetRecord).all()
    
    # Record Source Result
    source_result = SourceResult(
        scan_id=scan.id,
        source_name="Synthetic Identity Benchmark Feed",
        source_type="synthetic_demo",
        candidates_found=len(candidates),
        status="success" if len(candidates) > 0 else "empty"
    )
    db.add(source_result)

    findings_count = 0
    exclusions_count = 0
    high_count = 0
    med_count = 0
    review_count = 0
    ignored_count = 0

    brand_logo_hash = None
    if brand.image_assets:
        brand_logo_hash = brand.image_assets[0].perceptual_hash
    # fallback to default demo hash if not uploaded via asset table yet
    if not brand_logo_hash:
        brand_logo_hash = "a1f03c89b2e47d10"

    # 4. Deterministic Analysis Loop
    for cand in candidates:
        scan.candidates_analyzed += 1

        # Check Official Exclusion First
        is_excluded, excl_reason, matched_criteria = evaluate_official_exclusion(
            candidate_entity_type=cand.entity_type,
            candidate_platform=cand.platform,
            candidate_handle=cand.handle,
            candidate_external_id=cand.external_id,
            candidate_package_id=cand.package_or_bundle_id,
            candidate_developer_id=cand.developer_id,
            official_assets=official_assets_raw
        )

        if is_excluded:
            exclusions_count += 1
            exclusion = Exclusion(
                scan_id=scan.id,
                record_id=cand.id,
                matched_official_asset_id=matched_criteria.get("matched_asset_id") if matched_criteria else None,
                exclusion_reason=excl_reason or "Official asset identity verified",
                matched_criteria=matched_criteria or {}
            )
            db.add(exclusion)
            continue  # Excluded cleanly!

        # Signal 1: Name Similarity
        name_res = compute_name_similarity(cand.display_name, brand.name)

        # Signal 2: Logo / Icon Similarity
        logo_res = compute_hash_distance(cand.perceptual_hash, brand_logo_hash)

        # Signal 3: Description Similarity
        desc_res = compute_description_similarity(cand.description, brand.description)

        # Signal 4: Identity Conflict
        conflict_res = {
            "type": "identity_conflict",
            "is_available": True,
            "raw_score": 0.0,
            "explanation": "No conflicting identity anchors detected."
        }
        if cand.entity_type == "social_profile":
            if cand.external_id:
                conflict_res["raw_score"] = 90.0
                conflict_res["explanation"] = f"Candidate operates under external ID '{cand.external_id}', distinct from registered official account."
            else:
                conflict_res["raw_score"] = 50.0
                conflict_res["explanation"] = "Candidate lacks external account verification anchor."
        elif cand.entity_type == "mobile_app":
            if cand.package_or_bundle_id:
                conflict_res["raw_score"] = 95.0
                conflict_res["explanation"] = f"Candidate bundle ID '{cand.package_or_bundle_id}' conflicts with registered official application."
            else:
                conflict_res["raw_score"] = 60.0
                conflict_res["explanation"] = "Candidate package identifier is unpublished or unverified."

        signals_to_evaluate = [
            {
                "type": "name_similarity",
                "raw_score": name_res["score"],
                "is_available": True,
                "raw_candidate": name_res["raw_candidate"],
                "raw_ref": name_res["raw_reference"],
                "norm_candidate": name_res["normalized_candidate"],
                "norm_ref": name_res["normalized_reference"],
                "method": name_res["method"],
                "explanation": name_res["explanation"]
            },
            {
                "type": "logo_similarity",
                "raw_score": logo_res["raw_score"],
                "is_available": logo_res["is_available"],
                "raw_candidate": cand.perceptual_hash,
                "raw_ref": brand_logo_hash,
                "norm_candidate": None,
                "norm_ref": None,
                "method": logo_res["method"],
                "explanation": logo_res["explanation"]
            },
            {
                "type": "description_similarity",
                "raw_score": desc_res["raw_score"],
                "is_available": desc_res["is_available"],
                "raw_candidate": cand.description,
                "raw_ref": brand.description,
                "norm_candidate": None,
                "norm_ref": None,
                "method": desc_res["method"],
                "explanation": desc_res["explanation"]
            },
            {
                "type": "identity_conflict",
                "raw_score": conflict_res["raw_score"],
                "is_available": conflict_res["is_available"],
                "raw_candidate": cand.external_id or cand.package_or_bundle_id,
                "raw_ref": "Registered Brand Identity",
                "norm_candidate": None,
                "norm_ref": None,
                "method": "identity_anchor_cross_check",
                "explanation": conflict_res["explanation"]
            }
        ]

        composite_score, risk_band, corroboration_met, summary_expl = calculate_risk_score(signals_to_evaluate)

        if risk_band == FindingRiskBand.HIGH.value:
            high_count += 1
        elif risk_band == FindingRiskBand.MEDIUM.value:
            med_count += 1
        elif risk_band == FindingRiskBand.NEEDS_REVIEW.value:
            review_count += 1
        else:
            ignored_count += 1

        # Save finding if not ignored or if analyst review is needed
        findings_count += 1
        finding = Finding(
            scan_id=scan.id,
            brand_id=brand.id,
            record_id=cand.id,
            risk_score=composite_score,
            risk_band=risk_band,
            corroboration_met=corroboration_met,
            explanation_summary=summary_expl,
            evidence_breakdown={
                "candidate_name": cand.display_name,
                "candidate_platform": cand.platform,
                "corroboration_met": corroboration_met,
                "raw_signals": {s["type"]: s["raw_score"] for s in signals_to_evaluate}
            },
            review_status=ReviewStatus.NEW.value
        )
        db.add(finding)
        db.flush()

        for s in signals_to_evaluate:
            db.add(FindingSignal(
                finding_id=finding.id,
                signal_type=s["type"],
                raw_score=s["raw_score"],
                weight=0.25,
                contribution=round(s["raw_score"] * 0.25, 1),
                is_available=s["is_available"],
                raw_candidate_value=str(s.get("raw_candidate") or ""),
                raw_reference_value=str(s.get("raw_ref") or ""),
                normalized_candidate_value=str(s.get("norm_candidate") or ""),
                normalized_reference_value=str(s.get("norm_ref") or ""),
                method_used=s["method"],
                explanation=s["explanation"]
            ))

    scan.findings_created = findings_count
    scan.exclusions_applied = exclusions_count
    scan.status = ScanStatus.COMPLETED.value
    db.commit()
    db.refresh(scan)

    return ScanSummaryResponse(
        id=scan.id,
        brand_id=scan.brand_id,
        status=scan.status,
        candidates_analyzed=scan.candidates_analyzed,
        findings_created=scan.findings_created,
        exclusions_applied=scan.exclusions_applied,
        high_risk_count=high_count,
        medium_risk_count=med_count,
        needs_review_count=review_count,
        ignored_count=ignored_count,
        confirmed_count=0,
        source_results=scan.source_results,
        created_at=scan.created_at,
        updated_at=scan.updated_at
    )


@router.get("", response_model=List[ScanSummaryResponse])
def list_scans(brand_id: UUID = None, db: Session = Depends(get_db)):
    """List historical scan executions."""
    q = db.query(ScanRun)
    if brand_id:
        q = q.filter(ScanRun.brand_id == brand_id)
    scans = q.order_by(ScanRun.created_at.desc()).all()
    
    summaries = []
    for s in scans:
        high = db.query(Finding).filter(Finding.scan_id == s.id, Finding.risk_band == FindingRiskBand.HIGH.value).count()
        med = db.query(Finding).filter(Finding.scan_id == s.id, Finding.risk_band == FindingRiskBand.MEDIUM.value).count()
        rev = db.query(Finding).filter(Finding.scan_id == s.id, Finding.risk_band == FindingRiskBand.NEEDS_REVIEW.value).count()
        ign = db.query(Finding).filter(Finding.scan_id == s.id, Finding.risk_band == FindingRiskBand.IGNORED.value).count()
        conf = db.query(Finding).filter(Finding.scan_id == s.id, Finding.review_status == ReviewStatus.CONFIRMED.value).count()

        summaries.append(ScanSummaryResponse(
            id=s.id,
            brand_id=s.brand_id,
            status=s.status,
            candidates_analyzed=s.candidates_analyzed,
            findings_created=s.findings_created,
            exclusions_applied=s.exclusions_applied,
            high_risk_count=high,
            medium_risk_count=med,
            needs_review_count=rev,
            ignored_count=ign,
            confirmed_count=conf,
            source_results=s.source_results,
            created_at=s.created_at,
            updated_at=s.updated_at
        ))
    return summaries
