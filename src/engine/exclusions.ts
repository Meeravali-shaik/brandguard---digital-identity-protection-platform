import { OfficialAsset } from '../types/brandguard';

export interface ExclusionResult {
  isExcluded: boolean;
  exclusionReason?: string | null;
  matchedCriteria?: Record<string, any> | null;
}

export function evaluateOfficialExclusion(
  candidateEntityType: 'social_profile' | 'mobile_app',
  candidatePlatform: string,
  candidateHandle?: string | null,
  candidateExternalId?: string | null,
  candidatePackageId?: string | null,
  candidateDeveloperId?: string | null,
  officialAssets: OfficialAsset[] = []
): ExclusionResult {
  const candPlat = (candidatePlatform || '').trim().toLowerCase();

  for (const asset of officialAssets) {
    const assetPlat = (asset.platform || '').trim().toLowerCase();
    if (candPlat !== assetPlat) continue;

    if (candidateEntityType === 'social_profile' && asset.asset_kind === 'social_profile') {
      const offExtId = asset.external_account_id;
      const offHandle = (asset.handle || '').trim().toLowerCase().replace(/^@/, '');
      const candHandle = (candidateHandle || '').trim().toLowerCase().replace(/^@/, '');
      const candExtId = (candidateExternalId || '').trim();

      // Rule 1: Official asset has registered external_account_id
      if (offExtId) {
        if (candExtId && candExtId === offExtId.trim()) {
          return {
            isExcluded: true,
            exclusionReason: 'Exact platform and external account ID match with registered official profile.',
            matchedCriteria: {
              matchedAssetId: asset.id,
              platform: candPlat,
              matchedExternalId: candExtId,
              exclusionType: 'official_social_account_id'
            }
          };
        }
        // If offExtId is set but candidate lacks it or has different ID, DO NOT exclude!
        continue;
      }

      // Rule 2: Official asset lacks external_account_id -> Fall back to normalized handle
      if (!offExtId && offHandle && candHandle && offHandle === candHandle) {
        return {
          isExcluded: true,
          exclusionReason: 'Normalized handle match with registered official profile (no external ID registered).',
          matchedCriteria: {
            matchedAssetId: asset.id,
            platform: candPlat,
            matchedHandle: candHandle,
            exclusionType: 'official_social_handle_fallback'
          }
        };
      }
    } else if (candidateEntityType === 'mobile_app' && asset.asset_kind === 'mobile_application') {
      const offPkg = (asset.package_or_bundle_id || '').trim().toLowerCase();
      const candPkg = (candidatePackageId || '').trim().toLowerCase();

      // Rule: Exact platform and package or bundle ID match
      if (offPkg && candPkg && offPkg === candPkg) {
        return {
          isExcluded: true,
          exclusionReason: 'Exact platform and package/bundle ID match with registered official application.',
          matchedCriteria: {
            matchedAssetId: asset.id,
            platform: candPlat,
            matchedPackageId: candPkg,
            exclusionType: 'official_app_package_id'
          }
        };
      }
      // Note: Shared developer_id is NOT an exclusion key! Never exclude just because publisher matches.
    }
  }

  return { isExcluded: false };
}
