from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict
from uuid import UUID
from datetime import datetime


class ScanCreate(BaseModel):
    brand_id: UUID
    source_names: Optional[List[str]] = ["synthetic_demo"]


class SourceResultResponse(BaseModel):
    id: UUID
    source_name: str
    source_type: str
    candidates_found: int
    status: str
    error_details: Optional[str] = None

    model_config = {"from_attributes": True}


class ScanSummaryResponse(BaseModel):
    id: UUID
    brand_id: UUID
    status: str
    candidates_analyzed: int
    findings_created: int
    exclusions_applied: int
    high_risk_count: int
    medium_risk_count: int
    needs_review_count: int
    ignored_count: int
    confirmed_count: int
    source_results: List[SourceResultResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
