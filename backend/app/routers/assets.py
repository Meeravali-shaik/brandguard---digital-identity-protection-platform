from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.database import get_db
from app.models.brand import Brand, OfficialAsset
from app.schemas.asset import OfficialAssetCreate, OfficialAssetUpdate
from app.schemas.brand import OfficialAssetResponse

router = APIRouter(tags=["Official Assets"])


@router.get("/brands/{brand_id}/assets", response_model=List[OfficialAssetResponse])
def list_brand_assets(brand_id: UUID, db: Session = Depends(get_db)):
    """List all registered official social and mobile application assets for a brand."""
    brand = db.query(Brand).filter(Brand.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand not found.")
    return db.query(OfficialAsset).filter(OfficialAsset.brand_id == brand_id).all()


@router.post("/brands/{brand_id}/assets", response_model=OfficialAssetResponse, status_code=status.HTTP_201_CREATED)
def register_official_asset(brand_id: UUID, payload: OfficialAssetCreate, db: Session = Depends(get_db)):
    """Registers an official identity anchor (social profile or application)."""
    brand = db.query(Brand).filter(Brand.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand not found.")

    norm_handle = payload.handle.strip().lower().lstrip('@') if payload.handle else None
    norm_pkg = payload.package_or_bundle_id.strip().lower() if payload.package_or_bundle_id else None

    asset = OfficialAsset(
        brand_id=brand_id,
        asset_kind=payload.asset_kind,
        platform=payload.platform.lower().strip(),
        handle=payload.handle.strip() if payload.handle else None,
        normalized_handle=norm_handle,
        external_account_id=payload.external_account_id.strip() if payload.external_account_id else None,
        package_or_bundle_id=norm_pkg,
        developer_id=payload.developer_id.strip() if payload.developer_id else None,
        developer_name=payload.developer_name.strip() if payload.developer_name else None,
        developer_website=payload.developer_website,
        official_listing_url=payload.official_listing_url,
        verified=True
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset


@router.patch("/assets/{asset_id}", response_model=OfficialAssetResponse)
def update_official_asset(asset_id: UUID, payload: OfficialAssetUpdate, db: Session = Depends(get_db)):
    """Update official asset metadata."""
    asset = db.query(OfficialAsset).filter(OfficialAsset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found.")

    if payload.handle is not None:
        asset.handle = payload.handle
        asset.normalized_handle = payload.handle.strip().lower().lstrip('@')
    if payload.external_account_id is not None:
        asset.external_account_id = payload.external_account_id.strip()
    if payload.package_or_bundle_id is not None:
        asset.package_or_bundle_id = payload.package_or_bundle_id.strip().lower()
    if payload.developer_id is not None:
        asset.developer_id = payload.developer_id
    if payload.developer_name is not None:
        asset.developer_name = payload.developer_name
    if payload.verified is not None:
        asset.verified = payload.verified

    db.commit()
    db.refresh(asset)
    return asset


@router.delete("/assets/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_official_asset(asset_id: UUID, db: Session = Depends(get_db)):
    """Delete an official asset anchor."""
    asset = db.query(OfficialAsset).filter(OfficialAsset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found.")
    db.delete(asset)
    db.commit()
    return None
