from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime


class OfficialAssetCreate(BaseModel):
    asset_kind: str = Field(..., pattern="^(social_profile|mobile_application)$")
    platform: str = Field(..., min_length=2, max_length=50)
    # Social attributes
    handle: Optional[str] = None
    external_account_id: Optional[str] = None
    # App attributes
    package_or_bundle_id: Optional[str] = None
    developer_id: Optional[str] = None
    developer_name: Optional[str] = None
    developer_website: Optional[str] = None
    official_listing_url: Optional[str] = None


class OfficialAssetUpdate(BaseModel):
    handle: Optional[str] = None
    external_account_id: Optional[str] = None
    package_or_bundle_id: Optional[str] = None
    developer_id: Optional[str] = None
    developer_name: Optional[str] = None
    verified: Optional[bool] = None
