from pydantic import BaseModel, Field, HttpUrl
from typing import List, Optional
from uuid import UUID
from datetime import datetime


class BrandAliasCreate(BaseModel):
    alias_name: str = Field(..., min_length=1, max_length=255)


class BrandAliasResponse(BaseModel):
    id: UUID
    brand_id: UUID
    alias_name: str
    normalized_name: str
    created_at: datetime

    model_config = {"from_attributes": True}


class BrandCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    official_website: str = Field(..., min_length=3, max_length=512)
    description: Optional[str] = None
    logo_url: Optional[str] = None
    aliases: Optional[List[str]] = []


class BrandUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    official_website: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    is_active: Optional[bool] = None


class OfficialAssetResponse(BaseModel):
    id: UUID
    brand_id: UUID
    asset_kind: str
    platform: str
    handle: Optional[str] = None
    normalized_handle: Optional[str] = None
    external_account_id: Optional[str] = None
    package_or_bundle_id: Optional[str] = None
    developer_id: Optional[str] = None
    developer_name: Optional[str] = None
    developer_website: Optional[str] = None
    official_listing_url: Optional[str] = None
    verified: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class BrandResponse(BaseModel):
    id: UUID
    name: str
    official_website: str
    normalized_domain: str
    description: Optional[str] = None
    logo_url: Optional[str] = None
    is_active: bool
    aliases: List[BrandAliasResponse] = []
    official_assets: List[OfficialAssetResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
