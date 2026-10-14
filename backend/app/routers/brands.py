from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
import urllib.parse
from app.database import get_db
from app.models.brand import Brand, BrandAlias, OfficialAsset
from app.schemas.brand import BrandCreate, BrandUpdate, BrandResponse, BrandAliasCreate, BrandAliasResponse

router = APIRouter(prefix="/brands", tags=["Brands"])


def normalize_domain_from_url(url: str) -> str:
    parsed = urllib.parse.urlparse(url if "://" in url else f"https://{url}")
    domain = parsed.netloc or parsed.path
    domain = domain.split(":")[0].lower()
    if domain.startswith("www."):
        domain = domain[4:]
    return domain


@router.get("", response_model=List[BrandResponse])
def list_brands(db: Session = Depends(get_db)):
    """Retrieve all registered protected brands."""
    return db.query(Brand).filter(Brand.is_active == True).all()


@router.post("", response_model=BrandResponse, status_code=status.HTTP_201_CREATED)
def create_brand(payload: BrandCreate, db: Session = Depends(get_db)):
    """Registers a new brand and its official domain."""
    existing = db.query(Brand).filter(Brand.name == payload.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Brand with name '{payload.name}' is already registered."
        )

    norm_domain = normalize_domain_from_url(payload.official_website)

    brand = Brand(
        name=payload.name,
        official_website=payload.official_website,
        normalized_domain=norm_domain,
        description=payload.description,
        logo_url=payload.logo_url
    )
    db.add(brand)
    db.flush()

    # Add aliases if supplied
    if payload.aliases:
        for alias in payload.aliases:
            if alias.strip():
                db.add(BrandAlias(
                    brand_id=brand.id,
                    alias_name=alias.strip(),
                    normalized_name=alias.strip().lower()
                ))

    db.commit()
    db.refresh(brand)
    return brand


@router.get("/{brand_id}", response_model=BrandResponse)
def get_brand(brand_id: UUID, db: Session = Depends(get_db)):
    """Retrieve specific brand details by ID."""
    brand = db.query(Brand).filter(Brand.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand not found.")
    return brand


@router.patch("/{brand_id}", response_model=BrandResponse)
def update_brand(brand_id: UUID, payload: BrandUpdate, db: Session = Depends(get_db)):
    """Updates brand configuration or archives it."""
    brand = db.query(Brand).filter(Brand.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand not found.")

    if payload.name is not None:
        brand.name = payload.name
    if payload.official_website is not None:
        brand.official_website = payload.official_website
        brand.normalized_domain = normalize_domain_from_url(payload.official_website)
    if payload.description is not None:
        brand.description = payload.description
    if payload.logo_url is not None:
        brand.logo_url = payload.logo_url
    if payload.is_active is not None:
        brand.is_active = payload.is_active

    db.commit()
    db.refresh(brand)
    return brand


@router.post("/{brand_id}/aliases", response_model=BrandAliasResponse, status_code=status.HTTP_201_CREATED)
def add_brand_alias(brand_id: UUID, payload: BrandAliasCreate, db: Session = Depends(get_db)):
    """Adds a new recognized alternate spelling or abbreviation for the brand."""
    brand = db.query(Brand).filter(Brand.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand not found.")

    norm = payload.alias_name.strip().lower()
    existing = db.query(BrandAlias).filter(
        BrandAlias.brand_id == brand_id,
        BrandAlias.normalized_name == norm
    ).first()
    if existing:
        return existing

    alias = BrandAlias(
        brand_id=brand_id,
        alias_name=payload.alias_name.strip(),
        normalized_name=norm
    )
    db.add(alias)
    db.commit()
    db.refresh(alias)
    return alias
