import React, { useState } from 'react';
import { Smartphone, Search, AlertTriangle, ShieldAlert, CheckCircle, ExternalLink } from 'lucide-react';
import { Finding } from '../types/brandguard';
import { RiskBadge, ReviewStatusBadge, CorroborationBadge } from '../components/StatusBadge';

interface AppMonitoringPageProps {
  findings: Finding[];
  onOpenEvidence: (finding: Finding) => void;
}

export const AppMonitoringPage: React.FC<AppMonitoringPageProps> = ({
  findings,
  onOpenEvidence
}) => {
  const [search, setSearch] = useState('');
  const [storeFilter, setStoreFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');

  const appFindings = findings.filter(f => f.candidate.entity_type === 'mobile_app');

  const filtered = appFindings.filter(f => {
    const cand = f.candidate;
    if (storeFilter !== 'all' && cand.platform.toLowerCase() !== storeFilter.toLowerCase()) {
      return false;
    }
    if (riskFilter !== 'all' && f.risk_band !== riskFilter) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = cand.display_name.toLowerCase().includes(q);
      const matchPkg = cand.package_or_bundle_id && cand.package_or_bundle_id.toLowerCase().includes(q);
      const matchDev = cand.developer_name && cand.developer_name.toLowerCase().includes(q);
      if (!matchName && !matchPkg && !matchDev) return false;
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">Mobile Application Monitoring</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Detecting deceptive store listings, rogue bundle IDs, and publisher brand confusion
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          Showing <span className="text-white font-semibold">{filtered.length}</span> of {appFindings.length} candidate applications
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative min-w-64 flex-1">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by app title, package ID (e.g. com.novapay), or publisher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={storeFilter}
            onChange={e => setStoreFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-hidden"
          >
            <option value="all">All Stores</option>
            <option value="play_store">Google Play</option>
            <option value="app_store">Apple App Store</option>
          </select>

          <select
            value={riskFilter}
            onChange={e => setRiskFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-hidden"
          >
            <option value="all">All Risk Bands</option>
            <option value="high">High Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="needs_review">Needs Review</option>
            <option value="ignored">Low / Ignored</option>
          </select>
        </div>
      </div>

      {/* Application Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="md:col-span-2 p-12 text-center text-slate-500 text-xs bg-slate-900 border border-slate-800 rounded-xl">
            No application candidates match the active filters.
          </div>
        ) : (
          filtered.map(f => {
            const cand = f.candidate;
            const descSig = f.signals.find(s => s.signal_type === 'description_similarity');
            const logoSig = f.signals.find(s => s.signal_type === 'logo_similarity');

            return (
              <div
                key={f.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-750 transition-all flex flex-col justify-between text-xs space-y-4"
              >
                <div>
                  {/* Top App Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {cand.avatar_or_icon_url ? (
                        <img
                          src={cand.avatar_or_icon_url}
                          alt=""
                          className="w-12 h-12 rounded-xl object-cover border border-slate-700 bg-slate-950 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 font-bold shrink-0">
                          {cand.display_name.substring(0, 2)}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-sm text-white">{cand.display_name}</div>
                        <div className="font-mono text-[11px] text-cyan-400 font-semibold mt-0.5">
                          {cand.package_or_bundle_id || 'unassigned.package'}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Store: <span className="uppercase font-mono text-slate-300">{cand.platform}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="flex items-center justify-end gap-1.5">
                        <CorroborationBadge met={f.corroboration_met} />
                        <RiskBadge band={f.risk_band} score={f.risk_score} />
                      </div>
                      <div>
                        <ReviewStatusBadge status={f.review_status} />
                      </div>
                    </div>
                  </div>

                  {/* Architecture Identity Details */}
                  <div className="mt-4 bg-slate-950/60 p-3 rounded-lg border border-slate-850 space-y-2">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Developer Identity:</span>
                      <span className="font-semibold text-slate-200">
                        {cand.developer_name || cand.developer_id || 'Unverified Publisher'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Package Identity Anchor:</span>
                      <span className="font-mono text-rose-300 text-[10px]">
                        {cand.package_or_bundle_id}
                      </span>
                    </div>

                    {logoSig?.is_available && (
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">Icon Hash Similarity:</span>
                        <span className="font-mono text-cyan-400">{logoSig.raw_score}%</span>
                      </div>
                    )}

                    {descSig?.is_available && (
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">Store Description Overlap:</span>
                        <span className="font-mono text-cyan-400">{descSig.raw_score}%</span>
                      </div>
                    )}
                  </div>

                  {cand.description && (
                    <p className="text-slate-400 text-[11px] mt-3 italic line-clamp-2">
                      "{cand.description}"
                    </p>
                  )}
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-mono">
                    Package ≠ Publisher verification
                  </span>
                  <button
                    onClick={() => onOpenEvidence(f)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg font-semibold transition-colors cursor-pointer"
                  >
                    Inspect Full Evidence
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
