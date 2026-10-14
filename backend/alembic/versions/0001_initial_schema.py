"""Initial schema migration

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-10-12
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '0001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Brands
    op.create_table(
        'brands',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False, unique=True),
        sa.Column('official_website', sa.String(512), nullable=False),
        sa.Column('normalized_domain', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('logo_url', sa.String(1024), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('idx_brand_name', 'brands', ['name'])
    op.create_index('idx_brand_domain', 'brands', ['normalized_domain'])

    # 2. Brand Aliases
    op.create_table(
        'brand_aliases',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('brand_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('brands.id', ondelete='CASCADE'), nullable=False),
        sa.Column('alias_name', sa.String(255), nullable=False),
        sa.Column('normalized_name', sa.String(255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('idx_brand_alias_unique', 'brand_aliases', ['brand_id', 'normalized_name'], unique=True)

    # 3. Official Assets
    op.create_table(
        'official_assets',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('brand_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('brands.id', ondelete='CASCADE'), nullable=False),
        sa.Column('asset_kind', sa.String(50), nullable=False),
        sa.Column('platform', sa.String(50), nullable=False),
        sa.Column('handle', sa.String(255), nullable=True),
        sa.Column('normalized_handle', sa.String(255), nullable=True),
        sa.Column('external_account_id', sa.String(255), nullable=True),
        sa.Column('package_or_bundle_id', sa.String(255), nullable=True),
        sa.Column('developer_id', sa.String(255), nullable=True),
        sa.Column('developer_name', sa.String(255), nullable=True),
        sa.Column('developer_website', sa.String(512), nullable=True),
        sa.Column('official_listing_url', sa.String(1024), nullable=True),
        sa.Column('verified', sa.Boolean(), default=True, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )

    # 4. Image Assets
    op.create_table(
        'image_assets',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('brand_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('brands.id', ondelete='CASCADE'), nullable=False),
        sa.Column('asset_type', sa.String(50), nullable=False),
        sa.Column('file_name', sa.String(255), nullable=False),
        sa.Column('mime_type', sa.String(100), nullable=False),
        sa.Column('file_size_bytes', sa.LargeBinary(), nullable=True),
        sa.Column('image_bytes', sa.LargeBinary(), nullable=True),
        sa.Column('perceptual_hash', sa.String(64), nullable=True),
        sa.Column('difference_hash', sa.String(64), nullable=True),
        sa.Column('verified', sa.Boolean(), default=True, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )

    # 5. Dataset Batches & Records
    op.create_table(
        'dataset_batches',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('source_type', sa.String(50), nullable=False),
        sa.Column('record_count', sa.Integer(), default=0, nullable=False),
        sa.Column('is_active', sa.Boolean(), default=True, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        'dataset_records',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('batch_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('dataset_batches.id', ondelete='CASCADE'), nullable=False),
        sa.Column('target_brand_name', sa.String(255), nullable=False),
        sa.Column('entity_type', sa.String(50), nullable=False),
        sa.Column('platform', sa.String(50), nullable=False),
        sa.Column('display_name', sa.String(255), nullable=False),
        sa.Column('handle', sa.String(255), nullable=True),
        sa.Column('external_id', sa.String(255), nullable=True),
        sa.Column('package_or_bundle_id', sa.String(255), nullable=True),
        sa.Column('developer_id', sa.String(255), nullable=True),
        sa.Column('developer_name', sa.String(255), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('avatar_or_icon_url', sa.String(1024), nullable=True),
        sa.Column('profile_or_store_url', sa.String(1024), nullable=True),
        sa.Column('perceptual_hash', sa.String(64), nullable=True),
        sa.Column('raw_metadata', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        'evaluation_labels',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('record_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('dataset_records.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('is_impersonation', sa.Boolean(), nullable=False),
        sa.Column('is_official_asset', sa.Boolean(), default=False, nullable=False),
        sa.Column('primary_threat_technique', sa.String(100), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )

    # 6. Scans, Results, Exclusions, Findings, Signals, Reviews
    op.create_table(
        'scan_runs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('brand_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('brands.id', ondelete='CASCADE'), nullable=False),
        sa.Column('status', sa.String(50), nullable=False),
        sa.Column('candidates_analyzed', sa.Integer(), default=0, nullable=False),
        sa.Column('findings_created', sa.Integer(), default=0, nullable=False),
        sa.Column('exclusions_applied', sa.Integer(), default=0, nullable=False),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        'source_results',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('scan_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('scan_runs.id', ondelete='CASCADE'), nullable=False),
        sa.Column('source_name', sa.String(100), nullable=False),
        sa.Column('source_type', sa.String(50), nullable=False),
        sa.Column('candidates_found', sa.Integer(), default=0, nullable=False),
        sa.Column('status', sa.String(50), nullable=False),
        sa.Column('error_details', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        'exclusions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('scan_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('scan_runs.id', ondelete='CASCADE'), nullable=False),
        sa.Column('record_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('dataset_records.id', ondelete='CASCADE'), nullable=False),
        sa.Column('matched_official_asset_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('official_assets.id', ondelete='SET NULL'), nullable=True),
        sa.Column('exclusion_reason', sa.String(255), nullable=False),
        sa.Column('matched_criteria', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        'findings',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('scan_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('scan_runs.id', ondelete='CASCADE'), nullable=False),
        sa.Column('brand_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('brands.id', ondelete='CASCADE'), nullable=False),
        sa.Column('record_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('dataset_records.id', ondelete='CASCADE'), nullable=False),
        sa.Column('risk_score', sa.Float(), nullable=False),
        sa.Column('risk_band', sa.String(50), nullable=False),
        sa.Column('corroboration_met', sa.Boolean(), default=False, nullable=False),
        sa.Column('explanation_summary', sa.Text(), nullable=False),
        sa.Column('evidence_breakdown', sa.JSON(), nullable=False),
        sa.Column('review_status', sa.String(50), default='new', nullable=False),
        sa.Column('analyst_notes', sa.Text(), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        'finding_signals',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('finding_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('findings.id', ondelete='CASCADE'), nullable=False),
        sa.Column('signal_type', sa.String(100), nullable=False),
        sa.Column('raw_score', sa.Float(), nullable=False),
        sa.Column('weight', sa.Float(), nullable=False),
        sa.Column('contribution', sa.Float(), nullable=False),
        sa.Column('is_available', sa.Boolean(), default=True, nullable=False),
        sa.Column('raw_candidate_value', sa.Text(), nullable=True),
        sa.Column('raw_reference_value', sa.Text(), nullable=True),
        sa.Column('normalized_candidate_value', sa.Text(), nullable=True),
        sa.Column('normalized_reference_value', sa.Text(), nullable=True),
        sa.Column('method_used', sa.String(100), nullable=False),
        sa.Column('explanation', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        'review_events',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('finding_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('findings.id', ondelete='CASCADE'), nullable=False),
        sa.Column('previous_status', sa.String(50), nullable=False),
        sa.Column('new_status', sa.String(50), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('reviewer_identity', sa.String(255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    op.drop_table('review_events')
    op.drop_table('finding_signals')
    op.drop_table('findings')
    op.drop_table('exclusions')
    op.drop_table('source_results')
    op.drop_table('scan_runs')
    op.drop_table('evaluation_labels')
    op.drop_table('dataset_records')
    op.drop_table('dataset_batches')
    op.drop_table('image_assets')
    op.drop_table('official_assets')
    op.drop_table('brand_aliases')
    op.drop_table('brands')
