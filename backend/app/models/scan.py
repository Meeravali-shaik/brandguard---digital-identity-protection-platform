import uuid
from sqlalchemy import Column, String, Text, Boolean, ForeignKey, Integer, Float, JSON, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import TimestampMixin
from app.engine.scoring import FindingRiskBand
import enum


class ScanStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    PARTIAL = "partial"


class ReviewStatus(str, enum.Enum):
    NEW = "new"
    INVESTIGATING = "investigating"
    CONFIRMED = "confirmed"
    FALSE_POSITIVE = "false_positive"
    DISMISSED = "dismissed"


class ScanRun(Base, TimestampMixin):
    __tablename__ = "scan_runs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    brand_id = Column(UUID(as_uuid=True), ForeignKey("brands.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), default=ScanStatus.PENDING.value, nullable=False)
    candidates_analyzed = Column(Integer, default=0, nullable=False)
    findings_created = Column(Integer, default=0, nullable=False)
    exclusions_applied = Column(Integer, default=0, nullable=False)
    error_message = Column(Text, nullable=True)

    brand = relationship("Brand", back_populates="scans")
    source_results = relationship("SourceResult", back_populates="scan", cascade="all, delete-orphan")
    findings = relationship("Finding", back_populates="scan", cascade="all, delete-orphan")
    exclusions = relationship("Exclusion", back_populates="scan", cascade="all, delete-orphan")


class SourceResult(Base, TimestampMixin):
    __tablename__ = "source_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scan_id = Column(UUID(as_uuid=True), ForeignKey("scan_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    source_name = Column(String(100), nullable=False)
    source_type = Column(String(50), nullable=False)  # "synthetic_demo", "imported_dataset", "live_api"
    candidates_found = Column(Integer, default=0, nullable=False)
    status = Column(String(50), nullable=False)  # "success", "failed", "empty"
    error_details = Column(Text, nullable=True)

    scan = relationship("ScanRun", back_populates="source_results")


class Exclusion(Base, TimestampMixin):
    __tablename__ = "exclusions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scan_id = Column(UUID(as_uuid=True), ForeignKey("scan_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    record_id = Column(UUID(as_uuid=True), ForeignKey("dataset_records.id", ondelete="CASCADE"), nullable=False)
    matched_official_asset_id = Column(UUID(as_uuid=True), ForeignKey("official_assets.id", ondelete="SET NULL"), nullable=True)
    exclusion_reason = Column(String(255), nullable=False)
    matched_criteria = Column(JSON, nullable=False)  # Raw compared values

    scan = relationship("ScanRun", back_populates="exclusions")


class Finding(Base, TimestampMixin):
    __tablename__ = "findings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scan_id = Column(UUID(as_uuid=True), ForeignKey("scan_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    brand_id = Column(UUID(as_uuid=True), ForeignKey("brands.id", ondelete="CASCADE"), nullable=False, index=True)
    record_id = Column(UUID(as_uuid=True), ForeignKey("dataset_records.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Risk calculation results
    risk_score = Column(Float, nullable=False)
    risk_band = Column(String(50), nullable=False) # FindingRiskBand
    corroboration_met = Column(Boolean, default=False, nullable=False)
    
    # Explainable synthesis
    explanation_summary = Column(Text, nullable=False)
    evidence_breakdown = Column(JSON, nullable=False)
    
    # Review workflow
    review_status = Column(String(50), default=ReviewStatus.NEW.value, nullable=False, index=True)
    analyst_notes = Column(Text, nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)

    scan = relationship("ScanRun", back_populates="findings")
    record = relationship("DatasetRecord")
    signals = relationship("FindingSignal", back_populates="finding", cascade="all, delete-orphan")
    review_events = relationship("ReviewEvent", back_populates="finding", cascade="all, delete-orphan")


class FindingSignal(Base, TimestampMixin):
    __tablename__ = "finding_signals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    finding_id = Column(UUID(as_uuid=True), ForeignKey("findings.id", ondelete="CASCADE"), nullable=False, index=True)
    signal_type = Column(String(100), nullable=False) # e.g. "name_similarity", "logo_similarity", "description_similarity", "identity_conflict"
    raw_score = Column(Float, nullable=False)
    weight = Column(Float, nullable=False)
    contribution = Column(Float, nullable=False)
    is_available = Column(Boolean, default=True, nullable=False)
    
    # Explainability details
    raw_candidate_value = Column(Text, nullable=True)
    raw_reference_value = Column(Text, nullable=True)
    normalized_candidate_value = Column(Text, nullable=True)
    normalized_reference_value = Column(Text, nullable=True)
    method_used = Column(String(100), nullable=False)
    explanation = Column(Text, nullable=False)

    finding = relationship("Finding", back_populates="signals")


class ReviewEvent(Base, TimestampMixin):
    __tablename__ = "review_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    finding_id = Column(UUID(as_uuid=True), ForeignKey("findings.id", ondelete="CASCADE"), nullable=False, index=True)
    previous_status = Column(String(50), nullable=False)
    new_status = Column(String(50), nullable=False)
    notes = Column(Text, nullable=True)
    reviewer_identity = Column(String(255), default="Security Analyst", nullable=False)

    finding = relationship("Finding", back_populates="review_events")
