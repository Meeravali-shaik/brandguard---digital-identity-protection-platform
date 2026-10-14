import React, { useState } from 'react';
import {
  ShieldCheck,
  Globe,
  Share2,
  Smartphone,
  Plus,
  Trash2,
  CheckCircle,
  ExternalLink,
  Layers,
  FileCheck,
  Info,
  ShieldAlert,
  Edit3,
  AlertTriangle
} from 'lucide-react';
import { Brand, OfficialAsset } from '../types/brandguard';
import { apiClient } from '../services/apiClient';

interface BrandsPageProps {
  brand: Brand | null;
  onOpenRegisterModal: () => void;
  onRefreshBrand: () => void;
  onUpdateBrand?: (brandId: string, updates: Partial<Brand>) => Promise<void>;
  onDeleteBrand?: (brandId: string) => Promise<void>;
}

export const BrandsPage: React.FC<BrandsPageProps> = ({
  brand,
  onOpenRegisterModal,
  onRefreshBrand,
  onUpdateBrand,
  onDeleteBrand
}) => {
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [showEditBrand, setShowEditBrand] = useState(false);
  const [editName, setEditName] = useState(brand?.name || '');
  const [editWebsite, setEditWebsite] = useState(brand?.official_website || '');
  const [editDescription, setEditDescription] = useState(brand?.description || '');
  const [editLogoUrl, setEditLogoUrl] = useState(brand?.logo_url || '');
  const [editAliasInput, setEditAliasInput] = useState('');
  const [editAliases, setEditAliases] = useState<string[]>([]);
  const [editError, setEditError] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [assetKind, setAssetKind] = useState<'social_profile' | 'mobile_application'>('social_profile');
  const [platform, setPlatform] = useState('twitter');
  const [handle, setHandle] = useState('');
  const [externalId, setExternalId] = useState('');
  const [packageId, setPackageId] = useState('');
  const [developerId, setDeveloperId] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [assetTab, setAssetTab] = useState<'all' | 'social' | 'apps'>('all');

  if (!brand) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl">
        <p className="text-slate-400 text-sm">No protected brand selected.</p>
        <button
          onClick={onOpenRegisterModal}
          className="mt-4 px-4 py-2 bg-cyan-600 text-white rounded-lg text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
        >
          Register New Brand
        </button>
      </div>
    );
  }

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      await apiClient.registerOfficialAsset(brand.id, {
        asset_kind: assetKind,
        platform,
        handle: handle.trim() || undefined,
        external_account_id: externalId.trim() || undefined,
        package_or_bundle_id: packageId.trim() || undefined,
        developer_id: developerId.trim() || undefined
      });
      setShowAddAsset(false);
      setHandle('');
      setExternalId('');
      setPackageId('');
      setDeveloperId('');
      onRefreshBrand();
    } finally {
      setIsAdding(false);
    }
  };

  const handleOpenEdit = () => {
    setEditName(brand.name);
    setEditWebsite(brand.official_website);
    setEditDescription(brand.description || '');
    setEditLogoUrl(brand.logo_url || '');
    setEditAliases((brand.aliases || []).map(a => a.alias_name));
    setEditAliasInput('');
    setEditError(null);
    setShowEditBrand(true);
  };

  const handleSaveBrandEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editWebsite.trim()) {
      setEditError('Brand name and official website are required.');
      return;
    }
    setIsSavingEdit(true);
    setEditError(null);
    try {
      const aliasObjects = editAliases.map((a, i) => ({
        id: `alias-${brand.id}-${i}`,
        brand_id: brand.id,
        alias_name: a,
        normalized_name: a.toLowerCase().replace(/[^a-z0-9]/g, ''),
        created_at: new Date().toISOString()
      }));

      const payload = {
        name: editName.trim(),
        official_website: editWebsite.trim(),
        description: editDescription.trim() || undefined,
        logo_url: editLogoUrl.trim() || undefined,
        aliases: aliasObjects
      };

      if (onUpdateBrand) {
        await onUpdateBrand(brand.id, payload);
      } else {
        await apiClient.updateBrand(brand.id, payload);
      }
      setShowEditBrand(false);
      onRefreshBrand();
    } catch (err: any) {
      setEditError(err?.message || 'Failed to update brand profile.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteCurrentBrand = async () => {
    if (confirm(`Are you sure you want to delete brand '${brand.name}'? Associated findings and scans will be removed.`)) {
      if (onDeleteBrand) {
        await onDeleteBrand(brand.id);
      } else {
        await apiClient.deleteBrand(brand.id);
      }
      onRefreshBrand();
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (confirm('Are you sure you want to remove this official anchor?')) {
      await apiClient.deleteOfficialAsset(brand.id, assetId);
      onRefreshBrand();
    }
  };

  const socials = (brand.official_assets || []).filter(a => a.asset_kind === 'social_profile');
  const apps = (brand.official_assets || []).filter(a => a.asset_kind === 'mobile_application');

  return (
    <div className="space-y-6">
      {/* Brand Profile Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {brand.logo_url ? (
              <img
                src={brand.logo_url}
                alt={brand.name}
                className="w-16 h-16 rounded-xl object-cover border border-slate-700 bg-slate-950 p-1 shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center text-cyan-400 font-bold text-xl shrink-0">
                {brand.name.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold text-white">{brand.name}</h1>
                <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium bg-emerald-950/50 border border-emerald-800/40 px-2 py-0.5 rounded">
                  <CheckCircle className="w-3 h-3" />
                  <span>Verified Corporate Identity</span>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-2">
                <a
                  href={brand.official_website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 focus-visible:outline-none focus-visible:underline"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{brand.official_website}</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
                <span className="text-slate-600">·</span>
                <span>
                  Normalized Domain: <code className="font-mono text-slate-300">{brand.normalized_domain}</code>
                </span>
                <span className="text-slate-600">·</span>
                <span>
                  Logo Hash: <code className="font-mono text-cyan-300">{brand.logo_hash || 'a1f03c89b2e47d10'}</code>
                </span>
              </div>

              {brand.description && (
                <p className="text-xs text-slate-300 mt-2 max-w-3xl leading-relaxed">
                  {brand.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowAddAsset(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Official Anchor</span>
            </button>
            <button
              onClick={handleOpenEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-400" />
              <span>Edit Brand</span>
            </button>
            <button
              onClick={onOpenRegisterModal}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
            >
              Register Another Brand
            </button>
            <button
              onClick={handleDeleteCurrentBrand}
              className="p-1.5 bg-slate-800 hover:bg-rose-950/50 hover:border-rose-800/60 text-slate-400 hover:text-rose-400 rounded-lg text-xs border border-slate-700 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
              title="Delete this brand"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Registered Brand Aliases */}
        {brand.aliases && brand.aliases.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-800 flex items-center gap-2 text-xs flex-wrap">
            <span className="text-slate-500 font-medium">Recognized Alternate Names / Aliases:</span>
            <div className="flex flex-wrap gap-1.5">
              {brand.aliases.map(a => (
                <span key={a.id} className="bg-slate-800/80 px-2.5 py-0.5 rounded text-slate-300 font-mono text-[11px]">
                  {a.alias_name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Exclusion Guard Guidance Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 flex items-start gap-3">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-white">Strict Official-Asset Exclusion Rules & Integrity Safeguards</div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Assets registered below serve as deterministic exclusion anchors. Social profiles matching your registered platform and <code className="text-slate-200">external_account_id</code> are automatically protected from false alarms. For mobile apps, the exact <code className="text-slate-200">package_or_bundle_id</code> is verified. Shared developer names are never used as a universal exclusion key.
          </p>
        </div>
      </div>

      {/* Edit Brand Form Modal */}
      {showEditBrand && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-xs shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-white text-sm">Edit Protected Brand Profile</h3>
            </div>
            <button onClick={() => setShowEditBrand(false)} className="text-slate-400 hover:text-white p-1">✕</button>
          </div>

          {editError && (
            <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 rounded-lg">
              {editError}
            </div>
          )}

          <form onSubmit={handleSaveBrandEdit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Brand Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white focus-visible:outline-none focus-visible:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Official Website URL *</label>
                <input
                  type="url"
                  required
                  value={editWebsite}
                  onChange={e => setEditWebsite(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white focus-visible:outline-none focus-visible:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Brand Description</label>
              <textarea
                rows={2}
                value={editDescription}
                onChange={e => setEditDescription(e.target.value)}
                placeholder="Official corporate description used for plagiarism & phrasing similarity comparisons"
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white focus-visible:outline-none focus-visible:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Logo URL (Optional)</label>
              <input
                type="text"
                value={editLogoUrl}
                onChange={e => setEditLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white focus-visible:outline-none focus-visible:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Recognized Aliases / Alternate Spellings</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={editAliasInput}
                  onChange={e => setEditAliasInput(e.target.value)}
                  placeholder="e.g. Apex Pay, Apex Wallet"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded p-2 text-white focus-visible:outline-none focus-visible:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (editAliasInput.trim() && !editAliases.includes(editAliasInput.trim())) {
                      setEditAliases([...editAliases, editAliasInput.trim()]);
                      setEditAliasInput('');
                    }
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium cursor-pointer"
                >
                  Add Alias
                </button>
              </div>
              {editAliases.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {editAliases.map((a, idx) => (
                    <span key={idx} className="bg-slate-800 px-2.5 py-1 rounded text-slate-200 font-mono text-[11px] flex items-center gap-1.5">
                      <span>{a}</span>
                      <button
                        type="button"
                        onClick={() => setEditAliases(editAliases.filter((_, i) => i !== idx))}
                        className="text-slate-500 hover:text-rose-400 cursor-pointer"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowEditBrand(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingEdit}
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold cursor-pointer"
              >
                {isSavingEdit ? 'Saving Changes...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Asset Drawer / Form Modal */}
      {showAddAsset && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-xs shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-sm">Add Strict Official Identity Anchor</h3>
            <button onClick={() => setShowAddAsset(false)} className="text-slate-400 hover:text-white p-1">✕</button>
          </div>

          <form onSubmit={handleAddAsset} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Asset Kind</label>
              <select
                value={assetKind}
                onChange={e => setAssetKind(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white focus-visible:outline-none focus-visible:border-cyan-500"
              >
                <option value="social_profile">Official Social Profile</option>
                <option value="mobile_application">Official Mobile Application</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Platform / Store</label>
              <select
                value={platform}
                onChange={e => setPlatform(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white focus-visible:outline-none focus-visible:border-cyan-500"
              >
                {assetKind === 'social_profile' ? (
                  <>
                    <option value="twitter">Twitter / X</option>
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                    <option value="youtube">YouTube</option>
                  </>
                ) : (
                  <>
                    <option value="play_store">Google Play Store</option>
                    <option value="app_store">Apple App Store</option>
                  </>
                )}
              </select>
            </div>

            {assetKind === 'social_profile' ? (
              <>
                <div>
                  <label className="block text-slate-400 mb-1">Official Handle</label>
                  <input
                    type="text"
                    placeholder="e.g. novapay"
                    value={handle}
                    onChange={e => setHandle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white focus-visible:outline-none focus-visible:border-cyan-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-slate-400 mb-1">
                    Strict External Account ID (Required for definitive exclusion)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. twitter_9824109823 (immutable platform user ID)"
                    value={externalId}
                    onChange={e => setExternalId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white focus-visible:outline-none focus-visible:border-cyan-500"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-slate-400 mb-1">
                    Exact Package or Bundle ID (Exclusion Key) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. com.novapay.wallet"
                    value={packageId}
                    onChange={e => setPackageId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white focus-visible:outline-none focus-visible:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Developer / Publisher ID</label>
                  <input
                    type="text"
                    placeholder="e.g. dev_novapay_corp"
                    value={developerId}
                    onChange={e => setDeveloperId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white focus-visible:outline-none focus-visible:border-cyan-500"
                  />
                </div>
              </>
            )}

            <div className="md:col-span-3 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddAsset(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isAdding}
                className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold cursor-pointer"
              >
                {isAdding ? 'Registering...' : 'Save Asset Anchor'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Official Assets Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Social Anchors Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-cyan-400" />
              <h2 className="font-bold text-sm text-white uppercase tracking-wider">Registered Social Anchors</h2>
            </div>
            <span className="text-[11px] font-mono text-slate-400">{socials.length} verified</span>
          </div>

          {socials.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No official social accounts registered yet.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-2.5 px-4">Platform</th>
                  <th className="py-2.5 px-4">Handle</th>
                  <th className="py-2.5 px-4">External Account ID</th>
                  <th className="py-2.5 px-4 text-right">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {socials.map(a => (
                  <tr key={a.id} className="hover:bg-slate-850/40">
                    <td className="py-3 px-4 font-mono uppercase text-slate-300">{a.platform}</td>
                    <td className="py-3 px-4 font-semibold text-white">@{a.handle || 'unassigned'}</td>
                    <td className="py-3 px-4 font-mono text-cyan-400 text-[11px]">
                      {a.external_account_id || <span className="text-amber-400 font-sans italic">None (Handle fallback only)</span>}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteAsset(a.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-500"
                        title="Delete asset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Mobile Applications Anchors Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-cyan-400" />
              <h2 className="font-bold text-sm text-white uppercase tracking-wider">Registered App Identifiers</h2>
            </div>
            <span className="text-[11px] font-mono text-slate-400">{apps.length} verified</span>
          </div>

          {apps.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No official mobile apps registered yet.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-2.5 px-4">Store</th>
                  <th className="py-2.5 px-4">Package/Bundle ID</th>
                  <th className="py-2.5 px-4">Publisher ID</th>
                  <th className="py-2.5 px-4 text-right">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {apps.map(a => (
                  <tr key={a.id} className="hover:bg-slate-850/40">
                    <td className="py-3 px-4 font-mono uppercase text-slate-300">{a.platform}</td>
                    <td className="py-3 px-4 font-mono text-cyan-400 font-semibold">{a.package_or_bundle_id}</td>
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                      {a.developer_id || 'Not registered'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteAsset(a.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-500"
                        title="Delete asset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
