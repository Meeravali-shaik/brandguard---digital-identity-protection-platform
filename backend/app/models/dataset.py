import uuid
from sqlalchemy import Column, String, Text, Boolean, ForeignKey, Integer, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import TimestampMixin


class DatasetBatch(Base, TimestampMixin):
    __tablename__ = "dataset_batches"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    source_type = Column(String(50), nullable=False)  # "synthetic_demo", "imported_csv", "imported_json", "live_api"
    record_count = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    records = relationship("DatasetRecord", back_populates="batch", cascade="all, delete-orphan")


class DatasetRecord(Base, TimestampMixin):
    __tablename__ = "dataset_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    batch_id = Column(UUID(as_uuid=True), ForeignKey("dataset_batches.id", ondelete="CASCADE"), nullable=False, index=True)
    target_brand_name = Column(String(255), nullable=False, index=True)
    entity_type = Column(String(50), nullable=False)  # "social_profile" or "mobile_app"
    platform = Column(String(50), nullable=False)
    
    # Candidate attributes
    display_name = Column(String(255), nullable=False)
    handle = Column(String(255), nullable=True)
    external_id = Column(String(255), nullable=True, index=True)
    package_or_bundle_id = Column(String(255), nullable=True, index=True)
    developer_id = Column(String(255), nullable=True)
    developer_name = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    avatar_or_icon_url = Column(String(1024), nullable=True)
    profile_or_store_url = Column(String(1024), nullable=True)
    perceptual_hash = Column(String(64), nullable=True)
    
    raw_metadata = Column(JSON, nullable=True)

    batch = relationship("DatasetBatch", back_populates="records")
    evaluation_label = relationship("EvaluationLabel", back_populates="record", uselist=False, cascade="all, delete-orphan")


class EvaluationLabel(Base, TimestampMixin):
    """
    STRICT SEPARATION: Ground-truth labels are stored separately from detection inputs.
    The detection engine never accesses this table during scan execution.
    """
    __tablename__ = "evaluation_labels"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    record_id = Column(UUID(as_uuid=True), ForeignKey("dataset_records.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    is_impersonation = Column(Boolean, nullable=False)
    is_official_asset = Column(Boolean, default=False, nullable=False)
    primary_threat_technique = Column(String(100), nullable=True) # e.g. "exact_name_impersonator", "unicode_confusable", "typosquatting", "logo_theft", "different_publisher"
    notes = Column(Text, nullable=True)

    record = relationship("DatasetRecord", back_populates="evaluation_label")
