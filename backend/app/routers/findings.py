from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone

from app.database import get_db
from app.models.brand import Brand
from app.models.dataset import DatasetRecord
from app.models.scan import Finding, FindingSignal, ReviewEvent, ReviewStatus
from app.schemas.finding import (
    FindingResponse, FindingReviewUpdate, TakedownReportResponse,
    CandidateSnapshotResponse, FindingSignalResponse, ReviewEventResponse
)

router = APIRouter(prefix="/findings", tags=["Findings"])


@router.get("", response_model=List[FindingResponse])
def list_findings(
    brand_id: Optional[UUID] = None,
    scan_id: Optional[UUID] = None,
    platform: Optional[str] = None,
    risk_band: Optional[str] = None,
    review_status: Optional[str] = None,
    entity_type: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Retrieve risk-ranked findings with rich query filters."""
    q = db.query(Finding).join(DatasetRecord, Finding.record_id == DatasetRecord.id)

    if brand_id:
        q = q.filter(Finding.brand_id == brand_id)
    if scan_id:
        q = q.filter(Finding.scan_id == scan_id)
    if platform:
        q = q.filter(DatasetRecord.platform == platform.lower())
    if risk_band:
        q = q.filter(Finding.risk_band == risk_band.lower())
    if review_status:
        q = q.filter(Finding.review_status == review_status.lower())
    if entity_type:
        q = q.filter(DatasetRecord.entity_type == entity_type.lower())
    if search:
        s = f"%{search.lower()}%"
        q = q.filter((DatasetRecord.display_name.ilike(s)) | (DatasetRecord.handle.ilike(s)))

    findings = q.order_by(Finding.risk_score.desc()).offset(offset).limit(limit).all()

    results = []
    for f in findings:
        cand = f.record
        results.append(FindingResponse(
            id=f.id,
            scan_id=f.scan_id,
            brand_id=f.brand_id,
            record_id=f.record_id,
            risk_score=f.risk_score,
            risk_band=f.risk_band,
            corroboration_met=f.corroboration_met,
            explanation_summary=f.explanation_summary,
            evidence_breakdown=f.evidence_breakdown,
            review_status=f.review_status,
            analyst_notes=f.analyst_notes,
            reviewed_at=f.reviewed_at,
            candidate=CandidateSnapshotResponse(
                id=cand.id,
                entity_type=cand.entity_type,
                platform=cand.platform,
                display_name=cand.display_name,
                handle=cand.handle,
                external_id=cand.external_id,
                package_or_bundle_id=cand.package_or_bundle_id,
                developer_id=cand.developer_id,
                developer_name=cand.developer_name,
                description=cand.description,
                avatar_or_icon_url=cand.avatar_or_icon_url,
                profile_or_store_url=cand.profile_or_store_url
            ),
            signals=[
                FindingSignalResponse(
                    id=s.id,
                    signal_type=s.signal_type,
                    raw_score=s.raw_score,
                    weight=s.weight,
                    contribution=s.contribution,
                    is_available=s.is_available,
                    raw_candidate_value=s.raw_candidate_value,
                    raw_reference_value=s.raw_reference_value,
                    normalized_candidate_value=s.normalized_candidate_value,
                    normalized_reference_value=s.normalized_reference_value,
                    method_used=s.method_used,
                    explanation=s.explanation
                ) for s in f.signals
            ],
            review_events=[
                ReviewEventResponse(
                    id=re.id,
                    previous_status=re.previous_status,
                    new_status=re.new_status,
                    notes=re.notes,
                    reviewer_identity=re.reviewer_identity,
                    created_at=re.created_at
                ) for re in f.review_events
            ],
            created_at=f.created_at
        ))
    return results


@router.get("/{finding_id}", response_model=FindingResponse)
def get_finding(finding_id: UUID, db: Session = Depends(get_db)):
    """Retrieve complete evidence packet for a specific finding."""
    f = db.query(Finding).filter(Finding.id == finding_id).first()
    if not f:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Finding not found.")
    
    cand = f.record
    return FindingResponse(
        id=f.id,
        scan_id=f.scan_id,
        brand_id=f.brand_id,
        record_id=f.record_id,
        risk_score=f.risk_score,
        risk_band=f.risk_band,
        corroboration_met=f.corroboration_met,
        explanation_summary=f.explanation_summary,
        evidence_breakdown=f.evidence_breakdown,
        review_status=f.review_status,
        analyst_notes=f.analyst_notes,
        reviewed_at=f.reviewed_at,
        candidate=CandidateSnapshotResponse(
            id=cand.id,
            entity_type=cand.entity_type,
            platform=cand.platform,
            display_name=cand.display_name,
            handle=cand.handle,
            external_id=cand.external_id,
            package_or_bundle_id=cand.package_or_bundle_id,
            developer_id=cand.developer_id,
            developer_name=cand.developer_name,
            description=cand.description,
            avatar_or_icon_url=cand.avatar_or_icon_url,
            profile_or_store_url=cand.profile_or_store_url
        ),
        signals=[
            FindingSignalResponse(
                id=s.id,
                signal_type=s.signal_type,
                raw_score=s.raw_score,
                weight=s.weight,
                contribution=s.contribution,
                is_available=s.is_available,
                raw_candidate_value=s.raw_candidate_value,
                raw_reference_value=s.raw_reference_value,
                normalized_candidate_value=s.normalized_candidate_value,
                normalized_reference_value=s.normalized_reference_value,
                method_used=s.method_used,
                explanation=s.explanation
            ) for s in f.signals
        ],
        review_events=[
            ReviewEventResponse(
                id=re.id,
                previous_status=re.previous_status,
                new_status=re.new_status,
                notes=re.notes,
                reviewer_identity=re.reviewer_identity,
                created_at=re.created_at
            ) for re in f.review_events
        ],
        created_at=f.created_at
    )


@router.patch("/{finding_id}/review", response_model=FindingResponse)
def update_finding_review(finding_id: UUID, payload: FindingReviewUpdate, db: Session = Depends(get_db)):
    """
    Analyst review state transition.
    Preserves original detection signals and appends immutable audit event.
    """
    f = db.query(Finding).filter(Finding.id == finding_id).first()
    if not f:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Finding not found.")

    prev_status = f.review_status
    f.review_status = payload.status
    f.analyst_notes = payload.notes
    f.reviewed_at = datetime.now(timezone.utc)

    # Append audit trail event
    event = ReviewEvent(
        finding_id=f.id,
        previous_status=prev_status,
        new_status=payload.status,
        notes=payload.notes,
        reviewer_identity=payload.reviewer_identity or "Security Analyst"
    )
    db.add(event)
    db.commit()
    db.refresh(f)

    return get_finding(f.id, db)


@router.get("/{finding_id}/report", response_model=TakedownReportResponse)
def generate_takedown_report(finding_id: UUID, db: Session = Depends(get_db)):
    """
    Generates a formal, downloadable takedown report draft.
    Does not take automated destructive action. Marked as DRAFT for human validation.
    """
    f = db.query(Finding).filter(Finding.id == finding_id).first()
    if not f:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Finding not found.")

    brand = db.query(Brand).filter(Brand.id == f.brand_id).first()
    cand = f.record

    signals_summary = []
    for s in f.signals:
        signals_summary.append({
            "signal": s.signal_type,
            "score": s.raw_score,
            "method": s.method_used,
            "explanation": s.explanation
        })

    checklist = [
        "Verify candidate is not an authorized international affiliate, partner agency, or contractor.",
        "Confirm that registered official external account ID or package identifier has not recently migrated.",
        "Document archival timestamped screenshots of profile bio, avatar, and recent activity.",
        "Submit notice under relevant platform Terms of Service / Trademark Abuse procedure."
    ]

    report_markdown = f"""# BRAND IMPERSONATION TAKEDOWN NOTICE (DRAFT)
**Status:** DRAFT — FOR HUMAN SECURITY ANALYST REVIEW ONLY
**Generated At:** {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}
**Protected Entity:** {brand.name} ({brand.official_website})

---

### 1. TARGET INFRINGING ENTITY
- **Platform:** {cand.platform.upper()}
- **Entity Type:** {cand.entity_type.replace('_', ' ').title()}
- **Target Name/Title:** {cand.display_name}
- **Handle / Identifier:** {cand.handle or cand.package_or_bundle_id or cand.external_id or 'N/A'}
- **Observed Bio / Description:** {cand.description or 'N/A'}

### 2. RISK ANALYSIS & EVIDENCE STATEMENT
- **Calculated Risk Score:** {f.risk_score} / 100
- **Risk Band:** {f.risk_band.upper()}
- **Corroboration Verified:** {'YES' if f.corroboration_met else 'NO'}
- **Analyst Review State:** {f.review_status.upper()}

**Synthesis:**
{f.explanation_summary}

### 3. TECHNICAL SIGNAL BREAKDOWN
{chr(10).join(f"- **{s['signal']}** ({s['score']}% - {s['method']}): {s['explanation']}" for s in signals_summary)}

### 4. RECOMMENDED ACTION
Initiate standard takedown request to {cand.platform.title()} abuse desk alleging deceptive brand impersonation and misleading consumer credentials.

### 5. HUMAN PRE-SUBMISSION VERIFICATION CHECKLIST
{chr(10).join(f"[ ] {c}" for c in checklist)}

---
*Notice: BrandGuard does not issue automated legal demands or claim content removal. This document serves as an internal forensic evidence draft.*
"""

    return TakedownReportResponse(
        finding_id=f.id,
        report_title=f"BrandGuard Takedown Notice Draft - {cand.display_name} ({cand.platform})",
        draft_status="DRAFT - FOR HUMAN REVIEW ONLY",
        generated_at=datetime.now(timezone.utc),
        brand_protected={
            "name": brand.name,
            "website": brand.official_website,
            "domain": brand.normalized_domain
        },
        target_infringing_entity={
            "platform": cand.platform,
            "display_name": cand.display_name,
            "handle": cand.handle,
            "external_id": cand.external_id,
            "package_id": cand.package_or_bundle_id,
            "developer": cand.developer_name
        },
        corroborated_signals=signals_summary,
        evidence_statement=f.explanation_summary,
        recommended_action=f"Escalate to {cand.platform} Trust & Safety team.",
        human_verification_checklist=checklist,
        raw_markdown=report_markdown
    )
