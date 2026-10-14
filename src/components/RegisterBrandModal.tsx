import React, { useState } from 'react';
import { X, ShieldPlus, Plus, Trash2 } from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { Brand } from '../types/brandguard';

interface RegisterBrandModalProps {
  onClose: () => void;
  onBrandCreated: (newBrand: Brand) => void;
}

export const RegisterBrandModal: React.FC<RegisterBrandModalProps> = ({
  onClose,
  onBrandCreated
}) => {
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [aliasInput, setAliasInput] = useState('');
  const [aliases, setAliases] = useState<string[]>([]);
  
  // Official social handles
  const [socials, setSocials] = useState<Array<{ platform: string; handle: string; externalId: string }>>([
    { platform: 'twitter', handle: '', externalId: '' }
  ]);

  // Official apps
  const [apps, setApps] = useState<Array<{ platform: string; packageId: string; developerId: string }>>([
    { platform: 'play_store', packageId: '', developerId: '' }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddAlias = () => {
    if (aliasInput.trim() && !aliases.includes(aliasInput.trim())) {
      setAliases([...aliases, aliasInput.trim()]);
      setAliasInput('');
    }
  };

  const handleRemoveAlias = (idx: number) => {
    setAliases(aliases.filter((_, i) => i !== idx));
  };

  const handleAddSocial = () => {
    setSocials([...socials, { platform: 'twitter', handle: '', externalId: '' }]);
  };

  const handleRemoveSocial = (idx: number) => {
    setSocials(socials.filter((_, i) => i !== idx));
  };

  const handleAddApp = () => {
    setApps([...apps, { platform: 'play_store', packageId: '', developerId: '' }]);
  };

  const handleRemoveApp = (idx: number) => {
    setApps(apps.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !website.trim()) {
      setError('Brand name and official website are required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const created = await apiClient.createBrand({
        name: name.trim(),
        official_website: website.trim(),
        description: description.trim() || undefined,
        logo_url: logoUrl.trim() || undefined,
        aliases
      });

      // Register official socials
      for (const s of socials) {
        if (s.handle.trim() || s.externalId.trim()) {
          await apiClient.registerOfficialAsset(created.id, {
            asset_kind: 'social_profile',
            platform: s.platform,
            handle: s.handle.trim() || undefined,
            external_account_id: s.externalId.trim() || undefined
          });
        }
      }

      // Register official apps
      for (const a of apps) {
        if (a.packageId.trim()) {
          await apiClient.registerOfficialAsset(created.id, {
            asset_kind: 'mobile_application',
            platform: a.platform,
            package_or_bundle_id: a.packageId.trim(),
            developer_id: a.developerId.trim() || undefined
          });
        }
      }

      const refreshed = await apiClient.getBrand(created.id);
      onBrandCreated(refreshed || created);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to register brand.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl text-slate-200">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <ShieldPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Register Brand Identity</h3>
              <p className="text-xs text-slate-400">Add official corporate domain, accounts, and application anchors</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-950/30 border border-rose-800 text-rose-300 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Brand Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. ApexCloud"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-hidden focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Official Website *</label>
              <input
                type="url"
                required
                placeholder="https://www.apexcloud.io"
                value={website}
                onChange={e => setWebsite(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-hidden focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Corporate Description</label>
            <textarea
              rows={2}
              placeholder="Enterprise cloud security and serverless orchestration platform."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-hidden focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Brand Logo Image URL</label>
            <input
              type="url"
              placeholder="https://example.com/logo.png"
              value={logoUrl}
              onChange={e => setLogoUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-hidden focus:border-cyan-500"
            />
          </div>

          {/* Alternate Names & Aliases */}
          <div>
            <label className="block text-slate-400 font-medium mb-1">Recognized Aliases / Abbreviations</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Apex Cloud Global"
                value={aliasInput}
                onChange={e => setAliasInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddAlias(); } }}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-hidden focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={handleAddAlias}
                className="px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg"
              >
                Add
              </button>
            </div>
            {aliases.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {aliases.map((a, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded text-slate-300">
                    <span>{a}</span>
                    <button type="button" onClick={() => handleRemoveAlias(i)} className="text-slate-500 hover:text-rose-400">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Official Social Profiles */}
          <div className="pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-300">Official Social Accounts (Strict Exclusion Anchors)</span>
              <button
                type="button"
                onClick={handleAddSocial}
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
              >
                <Plus className="w-3 h-3" /> Add Account
              </button>
            </div>
            <div className="space-y-2">
              {socials.map((s, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <select
                    value={s.platform}
                    onChange={e => {
                      const updated = [...socials];
                      updated[idx].platform = e.target.value;
                      setSocials(updated);
                    }}
                    className="w-28 bg-slate-950 border border-slate-800 rounded p-1.5 text-white"
                  >
                    <option value="twitter">Twitter / X</option>
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                    <option value="youtube">YouTube</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Handle (@apexcloud)"
                    value={s.handle}
                    onChange={e => {
                      const updated = [...socials];
                      updated[idx].handle = e.target.value;
                      setSocials(updated);
                    }}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded p-1.5 text-white"
                  />
                  <input
                    type="text"
                    placeholder="External Account ID (e.g. tw_91823)"
                    value={s.externalId}
                    onChange={e => {
                      const updated = [...socials];
                      updated[idx].externalId = e.target.value;
                      setSocials(updated);
                    }}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded p-1.5 text-white"
                  />
                  {socials.length > 1 && (
                    <button type="button" onClick={() => handleRemoveSocial(idx)} className="text-slate-500 hover:text-rose-400 p-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Official Apps */}
          <div className="pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-300">Official Mobile Applications (Strict Exclusion Anchors)</span>
              <button
                type="button"
                onClick={handleAddApp}
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
              >
                <Plus className="w-3 h-3" /> Add App
              </button>
            </div>
            <div className="space-y-2">
              {apps.map((a, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <select
                    value={a.platform}
                    onChange={e => {
                      const updated = [...apps];
                      updated[idx].platform = e.target.value;
                      setApps(updated);
                    }}
                    className="w-28 bg-slate-950 border border-slate-800 rounded p-1.5 text-white"
                  >
                    <option value="play_store">Google Play</option>
                    <option value="app_store">Apple App Store</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Package ID (com.apex.app)"
                    value={a.packageId}
                    onChange={e => {
                      const updated = [...apps];
                      updated[idx].packageId = e.target.value;
                      setApps(updated);
                    }}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded p-1.5 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Developer ID (dev_apex_cloud)"
                    value={a.developerId}
                    onChange={e => {
                      const updated = [...apps];
                      updated[idx].developerId = e.target.value;
                      setApps(updated);
                    }}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded p-1.5 text-white"
                  />
                  {apps.length > 1 && (
                    <button type="button" onClick={() => handleRemoveApp(idx)} className="text-slate-500 hover:text-rose-400 p-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow-sm"
            >
              {isSubmitting ? 'Registering...' : 'Register Brand & Anchors'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
