from typing import Optional, Dict, Any, List, Tuple


def evaluate_official_exclusion(
    candidate_entity_type: str,     # "social_profile" or "mobile_app"
    candidate_platform: str,
    candidate_handle: Optional[str],
    candidate_external_id: Optional[str],
    candidate_package_id: Optional[str],
    candidate_developer_id: Optional[str],
    official_assets: List[Dict[str, Any]]
) -> Tuple[bool, Optional[str], Optional[Dict[str, Any]]]:
    """
    STRICT OFFICIAL-ASSET EXCLUSION EVALUATOR

    Rules:
    For Social Profiles:
    1. If the official asset has an external_account_id registered:
       - STRICT MATCH REQUIRED: candidate platform AND candidate external_id must match.
       - If candidate external_id is missing or different, DO NOT exclude by handle equality alone.
    2. If the official asset does NOT have an external_account_id registered:
       - Fall back to normalized handle match on the same platform.

    For Mobile Applications:
    1. Platform AND package_or_bundle_id MUST match exactly.
    2. Shared developer_id is NOT an exclusion key! Never exclude just because developer_id matches.
    """
    cand_plat = (candidate_platform or "").strip().lower()

    for asset in official_assets:
        asset_kind = asset.get("asset_kind")
        asset_plat = (asset.get("platform") or "").strip().lower()

        if cand_plat != asset_plat:
            continue

        if candidate_entity_type == "social_profile" and asset_kind == "social_profile":
            off_ext_id = asset.get("external_account_id")
            off_handle = (asset.get("handle") or "").strip().lower().lstrip('@')
            cand_handle = (candidate_handle or "").strip().lower().lstrip('@')
            cand_ext_id = (candidate_external_id or "").strip()

            # Rule 1: Registered official asset has external_account_id
            if off_ext_id:
                if cand_ext_id and cand_ext_id == off_ext_id.strip():
                    return True, "Exact platform and external account ID match with registered official profile.", {
                        "matched_asset_id": str(asset.get("id")),
                        "platform": cand_plat,
                        "matched_external_id": cand_ext_id,
                        "exclusion_type": "official_social_account_id"
                    }
                # If off_ext_id is set but candidate lacks it or has different id, do NOT exclude!
                continue

            # Rule 2: Registered official asset does NOT have external_account_id -> handle fallback
            if not off_ext_id and off_handle and cand_handle and off_handle == cand_handle:
                return True, "Normalized handle match with registered official profile (no external ID registered).", {
                    "matched_asset_id": str(asset.get("id")),
                    "platform": cand_plat,
                    "matched_handle": cand_handle,
                    "exclusion_type": "official_social_handle_fallback"
                }

        elif candidate_entity_type == "mobile_app" and asset_kind == "mobile_application":
            off_pkg = (asset.get("package_or_bundle_id") or "").strip().lower()
            cand_pkg = (candidate_package_id or "").strip().lower()

            # Rule: Exact package or bundle ID match
            if off_pkg and cand_pkg and off_pkg == cand_pkg:
                return True, "Exact platform and package/bundle ID match with registered official application.", {
                    "matched_asset_id": str(asset.get("id")),
                    "platform": cand_plat,
                    "matched_package_id": cand_pkg,
                    "exclusion_type": "official_app_package_id"
                }
            # Note: Do NOT exclude on developer_id! Shared developer is only supporting evidence.

    return False, None, None
