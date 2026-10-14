from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID


class DemoLoadRequest(BaseModel):
    brand_name: Optional[str] = "NovaPay"
    reset_existing: bool = True


class DemoLoadResponse(BaseModel):
    success: bool
    brand_id: UUID
    brand_name: str
    official_assets_count: int
    candidate_records_count: int
    message: str
