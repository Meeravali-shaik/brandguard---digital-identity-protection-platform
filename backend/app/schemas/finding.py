from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict
from uuid import UUID
from datetime import datetime


class FindingSignalResponse(BaseModel):
    id: UUID
    signal_type: str
    raw_score: float
    weight: float
    contribution: float
    is_available: bool
    raw_candidate_value: Optional[str] = None
    raw_reference_value: Optional[str] = None
    normalized_candidate_value: Optional[str] = None
    normalized_reference_value: Optional[str] = None
    method_used: str
    explanation: str

    model_config = {"from_attributes": True}


class CandidateSnapshotResponse(BaseModel):
    id: UUID
    entity_type: str
    platform: str
    display_name: str
    handle: Optional[str] = None
    external_id: Optional[str] = None
    package_or_bundle_id: Optional[str] = None
    developer_id: Optional[str] = None
    developer_name: Optional[str] = None
    description: Optional[str] = None
    avatar_or_icon_url: Optional[str] = None
    profile_or_store_url: Optional[str] = None

    model_config = {"from_attributes": True}


class ReviewEventResponse(BaseModel):
    id: UUID
    previous_status: str
    new_status: str
    notes: Optional[str] = None
    reviewer_identity: str
    created_at: datetime

    model_config = {"from_attributes": True}


class FindingResponse(BaseModel):
    id: UUID
    scan_id: UUID
    brand_id: UUID
    record_id: UUID
    risk_score: float
    risk_band: str
    corroboration_met: bool
    explanation_summary: str
    evidence_breakdown: Dict[str, Any]
    review_status: str
    analyst_notes: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    candidate: CandidateSnapshotResponse
    signals: List[FindingSignalResponse] = []
    review_events: List[ReviewEventResponse] = []
    created_at: datetime

    model_config = {"from_attributes": True}


class FindingReviewUpdate(BaseModel):
    status: str = Field(..., pattern="^(investigating|confirmed|false_positive|dismissed)$")
    notes: Optional[str] = None
    reviewer_identity: Optional[str] = "Security Analyst"


class TakedownReportResponse(BaseModel):
    finding_id: UUID
    report_title: str
    draft_status: str = "DRAFT - FOR HUMAN REVIEW ONLY"
    generated_at: datetime
    brand_protected: Dict[str, Any]
    target_infringing_entity: Dict[str, Any]
    corroborated_signals: List[Dict[str, Any]]
    evidence_statement: str
    recommended_action: str
    human_verification_checklist: List[str]
    raw_markdown: str
