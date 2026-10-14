import React, { useState } from 'react';
import { X, Play, Radar, CheckSquare, Layers } from 'lucide-react';
import { Brand } from '../types/brandguard';

interface StartScanModalProps {
  brand: Brand | null;
  onClose: () => void;
  onStartScan: (brandId: string, sources: string[]) => Promise<void>;
}

export const StartScanModal: React.FC<StartScanModalProps> = ({
  brand,
  onClose,
  onStartScan
}) => {
  if (!brand) return null;

  const [selectedSources, setSelectedSources] = useState<string[]>(['synthetic_demo']);
  const [isScanning, setIsScanning] = useState(false);

  const activeSources = [
    {
      id: 'synthetic_demo',
      name: 'Synthetic Identity Benchmark Feed',
      type: 'Simulated Demo Source',
      status: 'operational',
      description: 'Controlled testing dataset of candidate profiles & apps covering homoglyphs, typos, and exclusions.'
    },
    {
      id: 'apple_itunes',
      name: 'Apple App Store Public Store Feed',
      type: 'Live API Integration',
      status: 'operational',
      description: 'Direct queries to Apple iTunes Search API for apps matching target brand name (CORS enabled, non-scraping).'
    }
  ];

  const unconfiguredProviders = [
    {
      id: 'twitter_api',
      name: 'Twitter / X Developer Stream',
      type: 'Live API Integration',
      status: 'not_configured',
      description: 'Requires TWITTER_BEARER_TOKEN configured in backend server environment.'
    },
    {
      id: 'meta_graph',
      name: 'Meta / Instagram Graph API',
      type: 'Live API Integration',
      status: 'not_configured',
      description: 'Requires META_APP_SECRET and App Review permissions configured in backend.'
    }
  ];

  const handleToggle = (id: string) => {
    if (selectedSources.includes(id)) {
      if (selectedSources.length > 1) {
        setSelectedSources(selectedSources.filter(s => s !== id));
      }
    } else {
      setSelectedSources([...selectedSources, id]);
    }
  };

  const handleRun = async () => {
    setIsScanning(true);
    try {
      await onStartScan(brand.id, selectedSources);
      onClose();
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full shadow-2xl text-slate-200">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Radar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Launch Identity Protection Scan</h3>
              <p className="text-xs text-slate-400">Targeting protected brand <span className="text-cyan-300 font-semibold">{brand.name}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between text-slate-300">
              <span>Brand Registry Target:</span>
              <span className="font-semibold text-white">{brand.name}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400 mt-1">
              <span>Official Domain:</span>
              <span className="font-mono text-cyan-400">{brand.normalized_domain}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400 mt-1">
              <span>Registered Exclusion Anchors:</span>
              <span className="font-mono text-slate-300">{brand.official_assets?.length || 0} assets</span>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-2">Available Ingestion Feeds</label>
            <div className="space-y-2">
              {activeSources.map(src => {
                const isSelected = selectedSources.includes(src.id);
                return (
                  <div
                    key={src.id}
                    onClick={() => handleToggle(src.id)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-850/80 border-cyan-500/50 shadow-xs'
                        : 'bg-slate-950 border-slate-800 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                        />
                        <span className="font-semibold text-white">{src.name}</span>
                      </div>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {src.type}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1.5 pl-5 leading-relaxed">{src.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1.5">Unconfigured Feeds (Not active in this environment)</label>
            <div className="space-y-1.5">
              {unconfiguredProviders.map(src => (
                <div
                  key={src.id}
                  className="p-2.5 rounded-lg border border-slate-800 bg-slate-950/40 opacity-55 text-slate-400"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-300">{src.name}</span>
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-950/40 text-amber-400 border border-amber-900/40">
                      Not Configured
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">{src.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 border-t border-slate-800 flex justify-end gap-2 bg-slate-950/60 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
          >
            Cancel
          </button>
          <button
            onClick={handleRun}
            disabled={isScanning}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow-sm cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{isScanning ? 'Executing Detection Engine...' : 'Run Deterministic Scan'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
