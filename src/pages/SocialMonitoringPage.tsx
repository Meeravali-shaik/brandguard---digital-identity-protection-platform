import React, { useState } from 'react';
import { Share2, Search, Filter, ShieldAlert, Eye, UserCheck } from 'lucide-react';
import { Finding } from '../types/brandguard';
import { RiskBadge, ReviewStatusBadge, CorroborationBadge } from '../components/StatusBadge';

interface SocialMonitoringPageProps {
  findings: Finding[];
  onOpenEvidence: (finding: Finding) => void;
}

export const SocialMonitoringPage: React.FC<SocialMonitoringPageProps> = ({
  findings,
  onOpenEvidence
}) => {
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const socialFindings = findings.filter(f => f.candidate.entity_type === 'social_profile');

  const filtered = socialFindings.filter(f => {
    const cand = f.candidate;
    if (platformFilter !== 'all' && cand.platform.toLowerCase() !== platformFilter.toLowerCase()) {
      return false;
    }
    if (riskFilter !== 'all' && f.risk_band !== riskFilter) {
      return false;
    }
    if (statusFilter !== 'all' && f.review_status !== statusFilter) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = cand.display_name.toLowerCase().includes(q);
      const matchHandle = cand.handle && cand.handle.toLowerCase().includes(q);
      const matchDesc = cand.description && cand.description.toLowerCase().includes(q);
      if (!matchName && !matchHandle && !matchDesc) return false;
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Page Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">Social Profile Monitoring</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Analyzing social accounts imitating protected brand identity and executive personas
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          Showing <span className="text-white font-semibold">{filtered.length}</span> of {socialFindings.length} candidate profiles
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative min-w-64 flex-1">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by profile name, handle, or bio..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={platformFilter}
            onChange={e => setPlatformFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-hidden"
          >
            <option value="all">All Platforms</option>
            <option value="twitter">Twitter / X</option>
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
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

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-hidden"
          >
            <option value="all">All Review States</option>
            <option value="new">New</option>
            <option value="investigating">Investigating</option>
            <option value="confirmed">Confirmed</option>
            <option value="false_positive">False Positive</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>
      </div>

      {/* Profiles Cards / Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No social profile candidates match the active filters.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filtered.map(f => {
              const cand = f.candidate;
              return (
                <div key={f.id} className="p-4 sm:p-5 hover:bg-slate-850/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                  {/* Left: Avatar & Identity Details */}
                  <div className="flex items-start gap-3.5 max-w-xl">
                    {cand.avatar_or_icon_url ? (
                      <img
                        src={cand.avatar_or_icon_url}
                        alt=""
                        className="w-11 h-11 rounded-lg object-cover border border-slate-700 bg-slate-950 shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 font-bold shrink-0">
                        {cand.display_name.substring(0, 2)}
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-white">{cand.display_name}</span>
                        {cand.handle && (
                          <span className="text-slate-400 font-mono">@{cand.handle}</span>
                        )}
                        <span className="text-slate-600">·</span>
                        <span className="font-mono uppercase text-[11px] text-cyan-400 font-semibold">{cand.platform}</span>
                      </div>

                      <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                        <span>Account ID: <code className="font-mono text-slate-300">{cand.external_id || 'Not verified'}</code></span>
                        {cand.perceptual_hash && (
                          <>
                            <span className="text-slate-600">·</span>
                            <span>Logo Hash: <code className="font-mono text-cyan-300">{cand.perceptual_hash}</code></span>
                          </>
                        )}
                      </div>

                      {cand.description && (
                        <p className="text-slate-300 text-[11px] italic line-clamp-2 pt-0.5">
                          "{cand.description}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Middle: Forensic Explanation */}
                  <div className="max-w-xs md:text-left space-y-1">
                    <div className="text-[10px] uppercase font-semibold text-slate-500">Forensic Corroboration</div>
                    <p className="text-slate-300 text-[11px] line-clamp-2 leading-relaxed">
                      {f.explanation_summary}
                    </p>
                  </div>

                  {/* Right: Risk, Status & Action */}
                  <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                    <div className="text-right space-y-1">
                      <div className="flex items-center justify-end gap-1.5">
                        <CorroborationBadge met={f.corroboration_met} />
                        <RiskBadge band={f.risk_band} score={f.risk_score} />
                      </div>
                      <div>
                        <ReviewStatusBadge status={f.review_status} />
                      </div>
                    </div>

                    <button
                      onClick={() => onOpenEvidence(f)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-slate-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500"
                    >
                      Inspect Evidence
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
