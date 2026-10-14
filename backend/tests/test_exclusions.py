from app.engine.exclusions import evaluate_official_exclusion


def test_official_social_exclusion_with_external_id_match():
    official_assets = [
        {
            "id": "asset-1",
            "asset_kind": "social_profile",
            "platform": "twitter",
            "handle": "novapay",
            "external_account_id": "twitter_9824109823"
        }
    ]
    is_excl, reason, _ = evaluate_official_exclusion(
        candidate_entity_type="social_profile",
        candidate_platform="twitter",
        candidate_handle="novapay",
        candidate_external_id="twitter_9824109823",
        candidate_package_id=None,
        candidate_developer_id=None,
        official_assets=official_assets
    )
    assert is_excl is True
    assert "Exact platform and external account ID match" in reason


def test_social_candidate_not_excluded_if_external_id_differs():
    """
    CRITICAL REQUIREMENT:
    If an external ID was registered for the official profile, but candidate ID is missing
    or different, do NOT automatically exclude candidate through handle equality!
    """
    official_assets = [
        {
            "id": "asset-1",
            "asset_kind": "social_profile",
            "platform": "twitter",
            "handle": "novapay",
            "external_account_id": "twitter_9824109823"
        }
    ]
    is_excl, reason, _ = evaluate_official_exclusion(
        candidate_entity_type="social_profile",
        candidate_platform="twitter",
        candidate_handle="novapay",              # SAME handle!
        candidate_external_id="twitter_scam_999", # DIFFERENT ID!
        candidate_package_id=None,
        candidate_developer_id=None,
        official_assets=official_assets
    )
    assert is_excl is False


def test_social_fallback_to_handle_when_no_external_id_registered():
    official_assets = [
        {
            "id": "asset-2",
            "asset_kind": "social_profile",
            "platform": "twitter",
            "handle": "novapay",
            "external_account_id": None  # No external ID registered
        }
    ]
    is_excl, reason, _ = evaluate_official_exclusion(
        candidate_entity_type="social_profile",
        candidate_platform="twitter",
        candidate_handle="@novapay",
        candidate_external_id="any_or_missing",
        candidate_package_id=None,
        candidate_developer_id=None,
        official_assets=official_assets
    )
    assert is_excl is True
    assert "Normalized handle match" in reason


def test_official_app_exclusion_by_package_id():
    official_assets = [
        {
            "id": "app-1",
            "asset_kind": "mobile_application",
            "platform": "play_store",
            "package_or_bundle_id": "com.novapay.wallet",
            "developer_id": "dev_novapay_corp"
        }
    ]
    is_excl, reason, _ = evaluate_official_exclusion(
        candidate_entity_type="mobile_app",
        candidate_platform="play_store",
        candidate_handle=None,
        candidate_external_id=None,
        candidate_package_id="com.novapay.wallet",
        candidate_developer_id="dev_novapay_corp",
        official_assets=official_assets
    )
    assert is_excl is True
    assert "Exact platform and package/bundle ID match" in reason


def test_same_developer_different_package_never_excluded():
    """
    CRITICAL REQUIREMENT:
    Do not exclude an application just because it shares a publisher with an official app!
    """
    official_assets = [
        {
            "id": "app-1",
            "asset_kind": "mobile_application",
            "platform": "play_store",
            "package_or_bundle_id": "com.novapay.wallet",
            "developer_id": "dev_novapay_corp"
        }
    ]
    is_excl, reason, _ = evaluate_official_exclusion(
        candidate_entity_type="mobile_app",
        candidate_platform="play_store",
        candidate_handle=None,
        candidate_external_id=None,
        candidate_package_id="com.novapay.merchant.terminal", # Different package ID!
        candidate_developer_id="dev_novapay_corp",            # Same developer ID!
        official_assets=official_assets
    )
    assert is_excl is False
