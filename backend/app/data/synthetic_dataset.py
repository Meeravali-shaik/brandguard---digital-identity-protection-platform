from typing import Dict, Any, List

# Official brand definition
DEMO_BRAND = {
    "name": "NovaPay",
    "official_website": "https://www.novapay.io",
    "normalized_domain": "novapay.io",
    "description": "NovaPay is the secure, instant borderless digital wallet and global payment infrastructure empowering 10M+ businesses and individuals.",
    "logo_url": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
    "logo_hash": "a1f03c89b2e47d10",  # Reference 64-bit perceptual hash
    "aliases": ["Nova Pay", "NovaPay Global", "NovaPay Wallet"],
    "official_assets": [
        {
            "asset_kind": "social_profile",
            "platform": "twitter",
            "handle": "novapay",
            "external_account_id": "twitter_9824109823",  # Official anchor ID
            "verified": True
        },
        {
            "asset_kind": "social_profile",
            "platform": "instagram",
            "handle": "novapay_official",
            "external_account_id": "ig_542019842",
            "verified": True
        },
        {
            "asset_kind": "mobile_application",
            "platform": "play_store",
            "package_or_bundle_id": "com.novapay.wallet",  # Official anchor package
            "developer_id": "dev_novapay_corp",
            "developer_name": "NovaPay Inc.",
            "developer_website": "https://www.novapay.io",
            "official_listing_url": "https://play.google.com/store/apps/details?id=com.novapay.wallet",
            "verified": True
        },
        {
            "asset_kind": "mobile_application",
            "platform": "app_store",
            "package_or_bundle_id": "io.novapay.ios",
            "developer_id": "team_novapay_ios",
            "developer_name": "NovaPay Inc.",
            "developer_website": "https://www.novapay.io",
            "official_listing_url": "https://apps.apple.com/app/novapay/id154892019",
            "verified": True
        }
    ]
}

# Synthetic candidate profiles and applications representing all edge cases and ground truth
DEMO_CANDIDATES: List[Dict[str, Any]] = [
    # 1. Exact-name impersonator with DIFFERENT account ID (High Risk)
    {
        "id": "cand_01_exact_social",
        "entity_type": "social_profile",
        "platform": "twitter",
        "display_name": "NovaPay",
        "handle": "novapay_support_desk",
        "external_id": "twitter_scam_8849201",  # Different ID!
        "description": "Official 24/7 NovaPay customer care and instant transaction assistance. DM for wallet recovery.",
        "avatar_or_icon_url": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
        "perceptual_hash": "a1f03c89b2e47d10",  # Exact logo clone!
        "ground_truth": {
            "is_impersonation": True,
            "is_official_asset": False,
            "threat_technique": "exact_name_logo_theft",
            "notes": "Exact brand display name, cloned logo, rogue external account ID asking for wallet credentials."
        }
    },

    # 2. Cyrillic homoglyph lookalike (U+0430 Cyrillic small 'а') (High Risk)
    {
        "id": "cand_02_homoglyph_social",
        "entity_type": "social_profile",
        "platform": "twitter",
        "display_name": "NovаPay Rewards",  # 'а' is Cyrillic U+0430
        "handle": "novapay_bonus",
        "external_id": "twitter_scam_7712903",
        "description": "Claim your $500 NovaPay early adopter bonus today by verifying your recovery seed phrase.",
        "avatar_or_icon_url": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
        "perceptual_hash": "a1f03c89b2e47d12",  # 1 bit difference (Hamming dist 1)
        "ground_truth": {
            "is_impersonation": True,
            "is_official_asset": False,
            "threat_technique": "unicode_confusable",
            "notes": "Unicode Cyrillic homoglyph in display name, cloned logo, credential harvesting."
        }
    },

    # 3. 1-character typo/substitution 'NovaPqy' (Medium Risk)
    {
        "id": "cand_03_typo_social",
        "entity_type": "social_profile",
        "platform": "instagram",
        "display_name": "NovaPqy Official",
        "handle": "novapqy_app",
        "external_id": "ig_scam_991244",
        "description": "NovaPqy digital wallet. Borderless instant finance app.",
        "avatar_or_icon_url": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=150&auto=format&fit=crop&q=80",
        "perceptual_hash": "a1f03c89b2e47f20",  # Moderate logo similarity
        "ground_truth": {
            "is_impersonation": True,
            "is_official_asset": False,
            "threat_technique": "typosquatting",
            "notes": "One character substitution 'q' for 'a', similar description narrative."
        }
    },

    # 4. Rogue app on Play Store with different package ID and deceptive publisher (High Risk)
    {
        "id": "cand_04_fake_app",
        "entity_type": "mobile_app",
        "platform": "play_store",
        "display_name": "NovaPay: Fast Mobile Wallet",
        "package_or_bundle_id": "com.secure.novapay.wallet.client",  # Rogue package!
        "developer_id": "dev_shadow_payments_ltd",                  # Rogue publisher
        "developer_name": "NovaPay Global Apps",
        "description": "Download NovaPay to send money instantly across 40 countries with lowest transaction fees.",
        "avatar_or_icon_url": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
        "perceptual_hash": "a1f03c89b2e47d10",  # Cloned icon
        "ground_truth": {
            "is_impersonation": True,
            "is_official_asset": False,
            "threat_technique": "deceptive_app_package",
            "notes": "Brand name, stolen icon, rogue developer and package id imitating NovaPay."
        }
    },

    # 5. Legitimate official social account -> MUST BE EXCLUDED! (Correct Exclusion)
    {
        "id": "cand_05_official_social",
        "entity_type": "social_profile",
        "platform": "twitter",
        "display_name": "NovaPay",
        "handle": "novapay",
        "external_id": "twitter_9824109823",  # Exact official ID match!
        "description": "Official Twitter for NovaPay. Secure borderless digital payments for everyone.",
        "avatar_or_icon_url": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
        "perceptual_hash": "a1f03c89b2e47d10",
        "ground_truth": {
            "is_impersonation": False,
            "is_official_asset": True,
            "threat_technique": "none_official_exclusion",
            "notes": "Exact registered official Twitter external account ID."
        }
    },

    # 6. Legitimate official mobile app -> MUST BE EXCLUDED! (Correct Exclusion)
    {
        "id": "cand_06_official_app",
        "entity_type": "mobile_app",
        "platform": "play_store",
        "display_name": "NovaPay Wallet",
        "package_or_bundle_id": "com.novapay.wallet",  # Exact official package ID match!
        "developer_id": "dev_novapay_corp",
        "developer_name": "NovaPay Inc.",
        "description": "The official NovaPay wallet app for secure international transfers.",
        "avatar_or_icon_url": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
        "perceptual_hash": "a1f03c89b2e47d10",
        "ground_truth": {
            "is_impersonation": False,
            "is_official_asset": True,
            "threat_technique": "none_official_exclusion",
            "notes": "Exact registered official Play Store package identifier."
        }
    },

    # 7. Same publisher, DIFFERENT app package ID -> MUST NOT BE EXCLUDED! (Needs Review / Benign)
    {
        "id": "cand_07_same_publisher_diff_pkg",
        "entity_type": "mobile_app",
        "platform": "play_store",
        "display_name": "Nova Merchant Portal",
        "package_or_bundle_id": "com.novapay.merchant.terminal",  # Different package!
        "developer_id": "dev_novapay_corp",                      # Same publisher ID
        "developer_name": "NovaPay Inc.",
        "description": "Merchant terminal for accepting instore POS payments.",
        "avatar_or_icon_url": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=150&auto=format&fit=crop&q=80",
        "perceptual_hash": "f83a21b490ce5128",  # Different icon
        "ground_truth": {
            "is_impersonation": False,
            "is_official_asset": False,
            "threat_technique": "same_publisher_different_product",
            "notes": "Shared developer alone does not make this the official consumer wallet app, but it is legitimate enterprise software."
        }
    },

    # 8. Benign similar-name account with unrelated description -> Low / Ignored
    {
        "id": "cand_08_benign_unrelated",
        "entity_type": "social_profile",
        "platform": "twitter",
        "display_name": "Nova Astronomics",
        "handle": "nova_sky_watch",
        "external_id": "twitter_benign_441029",
        "description": "Amateur stargazing society sharing telescope images and supernova observations.",
        "avatar_or_icon_url": "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=150&auto=format&fit=crop&q=80",
        "perceptual_hash": "334188bb00aa99ff",  # Completely unrelated image
        "ground_truth": {
            "is_impersonation": False,
            "is_official_asset": False,
            "threat_technique": "benign_coincidental_name",
            "notes": "Share 'Nova' substring, zero financial impersonation indicators."
        }
    },

    # 9. Leetspeak substitution 'N0vaPay' (Medium Risk)
    {
        "id": "cand_09_leetspeak",
        "entity_type": "social_profile",
        "platform": "twitter",
        "display_name": "N0vaPay Finance",
        "handle": "n0vapay_live",
        "external_id": "twitter_scam_3810298",
        "description": "Borderless payments and zero fee transfers. Support online now.",
        "avatar_or_icon_url": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
        "perceptual_hash": "a1f03c89b2e47d10",
        "ground_truth": {
            "is_impersonation": True,
            "is_official_asset": False,
            "threat_technique": "leetspeak_substitution",
            "notes": "0 for O substitution, copied logo, financial services claim."
        }
    },

    # 10. Fake app on App Store with distinct publisher imitating brand (High Risk)
    {
        "id": "cand_10_ios_fake_app",
        "entity_type": "mobile_app",
        "platform": "app_store",
        "display_name": "NovaPay: Global Send",
        "package_or_bundle_id": "com.unverified.novapay.ios",
        "developer_id": "team_unverified_dev",
        "developer_name": "Global Pay Solutions",
        "description": "Official NovaPay app for iPhone. Manage payments and digital card credentials.",
        "avatar_or_icon_url": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
        "perceptual_hash": "a1f03c89b2e47d10",
        "ground_truth": {
            "is_impersonation": True,
            "is_official_asset": False,
            "threat_technique": "deceptive_app_package",
            "notes": "Deceptive iOS app bundle using official brand logo and name."
        }
    }
]
