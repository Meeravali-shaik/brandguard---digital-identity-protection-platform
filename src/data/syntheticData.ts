import { Brand, DatasetRecord } from '../types/brandguard';

export const INITIAL_DEMO_BRAND: Brand = {
  id: 'brand-novapay-001',
  name: 'NovaPay',
  official_website: 'https://www.novapay.io',
  normalized_domain: 'novapay.io',
  description: 'NovaPay is the secure, instant borderless digital wallet and global payment infrastructure empowering 10M+ businesses and individuals.',
  logo_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
  logo_hash: 'a1f03c89b2e47d10',
  is_active: true,
  aliases: [
    {
      id: 'alias-001',
      brand_id: 'brand-novapay-001',
      alias_name: 'Nova Pay',
      normalized_name: 'novapay',
      created_at: new Date().toISOString()
    },
    {
      id: 'alias-002',
      brand_id: 'brand-novapay-001',
      alias_name: 'NovaPay Wallet',
      normalized_name: 'novapaywallet',
      created_at: new Date().toISOString()
    }
  ],
  official_assets: [
    {
      id: 'oa-social-twitter-001',
      brand_id: 'brand-novapay-001',
      asset_kind: 'social_profile',
      platform: 'twitter',
      handle: 'novapay',
      normalized_handle: 'novapay',
      external_account_id: 'twitter_9824109823', // Official strict ID
      verified: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'oa-social-ig-002',
      brand_id: 'brand-novapay-001',
      asset_kind: 'social_profile',
      platform: 'instagram',
      handle: 'novapay_official',
      normalized_handle: 'novapay_official',
      external_account_id: 'ig_542019842',
      verified: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'oa-app-play-003',
      brand_id: 'brand-novapay-001',
      asset_kind: 'mobile_application',
      platform: 'play_store',
      package_or_bundle_id: 'com.novapay.wallet', // Official strict package ID
      developer_id: 'dev_novapay_corp',
      developer_name: 'NovaPay Inc.',
      developer_website: 'https://www.novapay.io',
      official_listing_url: 'https://play.google.com/store/apps/details?id=com.novapay.wallet',
      verified: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'oa-app-ios-004',
      brand_id: 'brand-novapay-001',
      asset_kind: 'mobile_application',
      platform: 'app_store',
      package_or_bundle_id: 'io.novapay.ios',
      developer_id: 'team_novapay_ios',
      developer_name: 'NovaPay Inc.',
      developer_website: 'https://www.novapay.io',
      official_listing_url: 'https://apps.apple.com/app/novapay/id154892019',
      verified: true,
      created_at: new Date().toISOString()
    }
  ],
  created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
  updated_at: new Date().toISOString()
};

export const INITIAL_DEMO_CANDIDATES: DatasetRecord[] = [
  // 1. Exact-name impersonator with DIFFERENT account ID (High Risk)
  {
    id: 'cand-01-exact-social',
    batch_id: 'batch-synthetic-01',
    target_brand_name: 'NovaPay',
    entity_type: 'social_profile',
    platform: 'twitter',
    display_name: 'NovaPay',
    handle: 'novapay_support_desk',
    external_id: 'twitter_scam_8849201', // Different ID
    description: 'Official 24/7 NovaPay customer care and instant transaction assistance. DM for wallet recovery.',
    avatar_or_icon_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    perceptual_hash: 'a1f03c89b2e47d10', // Exact logo clone
    ground_truth: {
      is_impersonation: true,
      is_official_asset: false,
      threat_technique: 'Exact Name & Logo Theft',
      notes: 'Exact brand display name, cloned logo, rogue external account ID asking for wallet credentials.'
    }
  },

  // 2. Cyrillic homoglyph lookalike (U+0430 Cyrillic small 'а') (High Risk)
  {
    id: 'cand-02-homoglyph-social',
    batch_id: 'batch-synthetic-01',
    target_brand_name: 'NovaPay',
    entity_type: 'social_profile',
    platform: 'twitter',
    display_name: 'NovаPay Rewards', // 'а' is Cyrillic U+0430
    handle: 'novapay_bonus',
    external_id: 'twitter_scam_7712903',
    description: 'Claim your $500 NovaPay early adopter bonus today by verifying your recovery seed phrase.',
    avatar_or_icon_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    perceptual_hash: 'a1f03c89b2e47d12', // 1 bit diff
    ground_truth: {
      is_impersonation: true,
      is_official_asset: false,
      threat_technique: 'Unicode Confusable',
      notes: 'Unicode Cyrillic homoglyph in display name, cloned logo, credential harvesting.'
    }
  },

  // 3. 1-character typo/substitution 'NovaPqy' (Medium Risk)
  {
    id: 'cand-03-typo-social',
    batch_id: 'batch-synthetic-01',
    target_brand_name: 'NovaPay',
    entity_type: 'social_profile',
    platform: 'instagram',
    display_name: 'NovaPqy Official',
    handle: 'novapqy_app',
    external_id: 'ig_scam_991244',
    description: 'NovaPqy digital wallet. Borderless instant finance app.',
    avatar_or_icon_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=150&auto=format&fit=crop&q=80',
    perceptual_hash: 'a1f03c89b2e47f20',
    ground_truth: {
      is_impersonation: true,
      is_official_asset: false,
      threat_technique: 'Typosquatting',
      notes: 'One character substitution q for a, similar description narrative.'
    }
  },

  // 4. Rogue app on Play Store with different package ID and deceptive publisher (High Risk)
  {
    id: 'cand-04-fake-app',
    batch_id: 'batch-synthetic-01',
    target_brand_name: 'NovaPay',
    entity_type: 'mobile_app',
    platform: 'play_store',
    display_name: 'NovaPay: Fast Mobile Wallet',
    package_or_bundle_id: 'com.secure.novapay.wallet.client', // Rogue package!
    developer_id: 'dev_shadow_payments_ltd', // Rogue publisher
    developer_name: 'NovaPay Global Apps',
    description: 'Download NovaPay to send money instantly across 40 countries with lowest transaction fees.',
    avatar_or_icon_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    perceptual_hash: 'a1f03c89b2e47d10',
    ground_truth: {
      is_impersonation: true,
      is_official_asset: false,
      threat_technique: 'Deceptive App Package',
      notes: 'Brand name, stolen icon, rogue developer and package id imitating NovaPay.'
    }
  },

  // 5. Legitimate official social account -> MUST BE EXCLUDED! (Correct Exclusion)
  {
    id: 'cand-05-official-social',
    batch_id: 'batch-synthetic-01',
    target_brand_name: 'NovaPay',
    entity_type: 'social_profile',
    platform: 'twitter',
    display_name: 'NovaPay',
    handle: 'novapay',
    external_id: 'twitter_9824109823', // Exact official ID match!
    description: 'Official Twitter for NovaPay. Secure borderless digital payments for everyone.',
    avatar_or_icon_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    perceptual_hash: 'a1f03c89b2e47d10',
    ground_truth: {
      is_impersonation: false,
      is_official_asset: true,
      threat_technique: 'Official Asset Verification',
      notes: 'Exact registered official Twitter external account ID.'
    }
  },

  // 6. Legitimate official mobile app -> MUST BE EXCLUDED! (Correct Exclusion)
  {
    id: 'cand-06-official-app',
    batch_id: 'batch-synthetic-01',
    target_brand_name: 'NovaPay',
    entity_type: 'mobile_app',
    platform: 'play_store',
    display_name: 'NovaPay Wallet',
    package_or_bundle_id: 'com.novapay.wallet', // Exact official package match!
    developer_id: 'dev_novapay_corp',
    developer_name: 'NovaPay Inc.',
    description: 'The official NovaPay wallet app for secure international transfers.',
    avatar_or_icon_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    perceptual_hash: 'a1f03c89b2e47d10',
    ground_truth: {
      is_impersonation: false,
      is_official_asset: true,
      threat_technique: 'Official Asset Verification',
      notes: 'Exact registered official Play Store package identifier.'
    }
  },

  // 7. Same publisher, DIFFERENT app package ID -> MUST NOT BE EXCLUDED! (Needs Review / Benign)
  {
    id: 'cand-07-same-publisher-diff-pkg',
    batch_id: 'batch-synthetic-01',
    target_brand_name: 'NovaPay',
    entity_type: 'mobile_app',
    platform: 'play_store',
    display_name: 'Nova Merchant Terminal',
    package_or_bundle_id: 'com.novapay.merchant.terminal', // Different package!
    developer_id: 'dev_novapay_corp', // Same developer ID
    developer_name: 'NovaPay Inc.',
    description: 'Merchant terminal for accepting in-store POS card transactions.',
    avatar_or_icon_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=150&auto=format&fit=crop&q=80',
    perceptual_hash: 'f83a21b490ce5128',
    ground_truth: {
      is_impersonation: false,
      is_official_asset: false,
      threat_technique: 'Same Publisher Different Product',
      notes: 'Shared developer alone does not make this the official consumer wallet app; legitimate product.'
    }
  },

  // 8. Benign similar-name account with unrelated description -> Low / Ignored
  {
    id: 'cand-08-benign-unrelated',
    batch_id: 'batch-synthetic-01',
    target_brand_name: 'NovaPay',
    entity_type: 'social_profile',
    platform: 'twitter',
    display_name: 'Nova Astronomics Society',
    handle: 'nova_sky_watch',
    external_id: 'twitter_benign_441029',
    description: 'Amateur stargazing society sharing telescope images and supernova observations.',
    avatar_or_icon_url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=150&auto=format&fit=crop&q=80',
    perceptual_hash: '334188bb00aa99ff',
    ground_truth: {
      is_impersonation: false,
      is_official_asset: false,
      threat_technique: 'Benign Coincidental Name',
      notes: 'Shares Nova prefix; zero financial impersonation intent.'
    }
  },

  // 9. Leetspeak substitution 'N0vaPay' (Medium Risk)
  {
    id: 'cand-09-leetspeak',
    batch_id: 'batch-synthetic-01',
    target_brand_name: 'NovaPay',
    entity_type: 'social_profile',
    platform: 'twitter',
    display_name: 'N0vaPay Finance',
    handle: 'n0vapay_live',
    external_id: 'twitter_scam_3810298',
    description: 'Borderless payments and zero fee transfers. Live chat support available now.',
    avatar_or_icon_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    perceptual_hash: 'a1f03c89b2e47d10',
    ground_truth: {
      is_impersonation: true,
      is_official_asset: false,
      threat_technique: 'Leetspeak Substitution',
      notes: '0 for O substitution, copied logo, financial services claim.'
    }
  },

  // 10. Fake app on App Store with distinct publisher imitating brand (High Risk)
  {
    id: 'cand-10-ios-fake-app',
    batch_id: 'batch-synthetic-01',
    target_brand_name: 'NovaPay',
    entity_type: 'mobile_app',
    platform: 'app_store',
    display_name: 'NovaPay: Global Send',
    package_or_bundle_id: 'com.unverified.novapay.ios',
    developer_id: 'team_unverified_dev',
    developer_name: 'Global Pay Solutions',
    description: 'Official NovaPay app for iPhone. Manage payments and digital card credentials.',
    avatar_or_icon_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    perceptual_hash: 'a1f03c89b2e47d10',
    ground_truth: {
      is_impersonation: true,
      is_official_asset: false,
      threat_technique: 'Deceptive App Package',
      notes: 'Deceptive iOS app bundle using official brand logo and name.'
    }
  }
];
