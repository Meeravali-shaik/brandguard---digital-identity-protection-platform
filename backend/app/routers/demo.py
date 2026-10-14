from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.brand import Brand, BrandAlias, OfficialAsset, ImageAsset
from app.models.dataset import DatasetBatch, DatasetRecord, EvaluationLabel
from app.models.scan import ScanRun, Finding, FindingSignal, Exclusion, ReviewEvent
from app.schemas.demo import DemoLoadRequest, DemoLoadResponse
from app.data.synthetic_dataset import DEMO_BRAND, DEMO_CANDIDATES
import uuid

router = APIRouter(prefix="/demo", tags=["Demo Data Management"])


@router.post("/load", response_model=DemoLoadResponse)
def load_demo_data(payload: DemoLoadRequest = None, db: Session = Depends(get_db)):
    """
    Seeds database with the official 'NovaPay' benchmark and synthetic candidate datasets.
    Isolates ground truth labels into `evaluation_labels`.
    """
    # 1. Check or create protected brand
    brand = db.query(Brand).filter(Brand.name == DEMO_BRAND["name"]).first()
    if not brand:
        brand = Brand(
            name=DEMO_BRAND["name"],
            official_website=DEMO_BRAND["official_website"],
            normalized_domain=DEMO_BRAND["normalized_domain"],
            description=DEMO_BRAND["description"],
            logo_url=DEMO_BRAND["logo_url"]
        )
        db.add(brand)
        db.flush()

        # Add Aliases
        for alias in DEMO_BRAND["aliases"]:
            db.add(BrandAlias(
                brand_id=brand.id,
                alias_name=alias,
                normalized_name=alias.lower().replace(" ", "")
            ))

        # Add Official Assets (Anchors for Exclusion)
        for oa in DEMO_BRAND["official_assets"]:
            db.add(OfficialAsset(
                brand_id=brand.id,
                asset_kind=oa["asset_kind"],
                platform=oa["platform"],
                handle=oa.get("handle"),
                normalized_handle=oa.get("handle", "").lower() if oa.get("handle") else None,
                external_account_id=oa.get("external_account_id"),
                package_or_bundle_id=oa.get("package_or_bundle_id"),
                developer_id=oa.get("developer_id"),
                developer_name=oa.get("developer_name"),
                developer_website=oa.get("developer_website"),
                official_listing_url=oa.get("official_listing_url"),
                verified=True
            ))

        # Add Reference Logo Asset with known hash
        db.add(ImageAsset(
            brand_id=brand.id,
            asset_type="primary_logo",
            file_name="novapay_official_logo.png",
            mime_type="image/png",
            perceptual_hash=DEMO_BRAND["logo_hash"],
            verified=True
        ))

    # 2. Create or reload Dataset Batch
    batch = db.query(DatasetBatch).filter(DatasetBatch.name == "NovaPay Synthetic Benchmark Suite v1").first()
    if not batch:
        batch = DatasetBatch(
            name="NovaPay Synthetic Benchmark Suite v1",
            description="Labelled synthetic dataset containing exact impersonators, homoglyphs, deceptive apps, and official accounts.",
            source_type="synthetic_demo",
            record_count=len(DEMO_CANDIDATES),
            is_active=True
        )
        db.add(batch)
        db.flush()

        for cand in DEMO_CANDIDATES:
            rec = DatasetRecord(
                batch_id=batch.id,
                target_brand_name=DEMO_BRAND["name"],
                entity_type=cand["entity_type"],
                platform=cand["platform"],
                display_name=cand["display_name"],
                handle=cand.get("handle"),
                external_id=cand.get("external_id"),
                package_or_bundle_id=cand.get("package_or_bundle_id"),
                developer_id=cand.get("developer_id"),
                developer_name=cand.get("developer_name"),
                description=cand.get("description"),
                avatar_or_icon_url=cand.get("avatar_or_icon_url"),
                perceptual_hash=cand.get("perceptual_hash"),
                raw_metadata=cand
            )
            db.add(rec)
            db.flush()

            # STRICT: Store ground truth label separately
            gt = cand.get("ground_truth", {})
            db.add(EvaluationLabel(
                record_id=rec.id,
                is_impersonation=gt.get("is_impersonation", False),
                is_official_asset=gt.get("is_official_asset", False),
                primary_threat_technique=gt.get("threat_technique"),
                notes=gt.get("notes")
            ))

    db.commit()
    db.refresh(brand)

    return DemoLoadResponse(
        success=True,
        brand_id=brand.id,
        brand_name=brand.name,
        official_assets_count=len(brand.official_assets),
        candidate_records_count=len(DEMO_CANDIDATES),
        message="NovaPay benchmark data loaded successfully with ground truth isolation."
    )


@router.post("/reset", response_model=DemoLoadResponse)
def reset_demo_data(db: Session = Depends(get_db)):
    """Resets scans, findings, and demo records back to pristine initial state."""
    # Delete scans, findings, exclusions
    db.query(ReviewEvent).delete()
    db.query(FindingSignal).delete()
    db.query(Finding).delete()
    db.query(Exclusion).delete()
    db.query(ScanRun).delete()
    db.commit()

    return load_demo_data(None, db)
