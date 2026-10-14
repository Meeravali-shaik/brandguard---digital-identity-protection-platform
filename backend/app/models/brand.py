import uuid
from sqlalchemy import Column, String, Text, Boolean, ForeignKey, LargeBinary, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import TimestampMixin


class Brand(Base, TimestampMixin):
    __tablename__ = "brands"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, unique=True, index=True)
    official_website = Column(String(512), nullable=False)
    normalized_domain = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    logo_url = Column(String(1024), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    aliases = relationship("BrandAlias", back_populates="brand", cascade="all, delete-orphan")
    official_assets = relationship("OfficialAsset", back_populates="brand", cascade="all, delete-orphan")
    image_assets = relationship("ImageAsset", back_populates="brand", cascade="all, delete-orphan")
    scans = relationship("ScanRun", back_populates="brand", cascade="all, delete-orphan")


class BrandAlias(Base, TimestampMixin):
    __tablename__ = "brand_aliases"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    brand_id = Column(UUID(as_uuid=True), ForeignKey("brands.id", ondelete="CASCADE"), nullable=False, index=True)
    alias_name = Column(String(255), nullable=False)
    normalized_name = Column(String(255), nullable=False, index=True)

    brand = relationship("Brand", back_populates="aliases")

    __table_args__ = (
        Index("idx_brand_alias_unique", "brand_id", "normalized_name", unique=True),
    )


class ImageAsset(Base, TimestampMixin):
    __tablename__ = "image_assets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    brand_id = Column(UUID(as_uuid=True), ForeignKey("brands.id", ondelete="CASCADE"), nullable=False, index=True)
    asset_type = Column(String(50), nullable=False)  # "primary_logo", "icon", "banner"
    file_name = Column(String(255), nullable=False)
    mime_type = Column(String(100), nullable=False)
    file_size_bytes = Column(LargeBinary, nullable=True)  # Storage for validated image binary
    image_bytes = Column(LargeBinary, nullable=True)
    perceptual_hash = Column(String(64), nullable=True, index=True)
    difference_hash = Column(String(64), nullable=True)
    verified = Column(Boolean, default=True, nullable=False)

    brand = relationship("Brand", back_populates="image_assets")


class OfficialAsset(Base, TimestampMixin):
    __tablename__ = "official_assets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    brand_id = Column(UUID(as_uuid=True), ForeignKey("brands.id", ondelete="CASCADE"), nullable=False, index=True)
    asset_kind = Column(String(50), nullable=False)  # "social_profile" or "mobile_application"
    platform = Column(String(50), nullable=False)    # "twitter", "instagram", "facebook", "play_store", "app_store"
    
    # Social attributes
    handle = Column(String(255), nullable=True)
    normalized_handle = Column(String(255), nullable=True, index=True)
    external_account_id = Column(String(255), nullable=True, index=True)  # STRICT exclusion anchor
    
    # App attributes
    package_or_bundle_id = Column(String(255), nullable=True, index=True) # STRICT exclusion anchor
    developer_id = Column(String(255), nullable=True)
    developer_name = Column(String(255), nullable=True)
    developer_website = Column(String(512), nullable=True)
    official_listing_url = Column(String(1024), nullable=True)
    
    verified = Column(Boolean, default=True, nullable=False)

    brand = relationship("Brand", back_populates="official_assets")

    __table_args__ = (
        Index("idx_official_social_unique", "brand_id", "platform", "normalized_handle"),
        Index("idx_official_app_unique", "brand_id", "platform", "package_or_bundle_id"),
    )
