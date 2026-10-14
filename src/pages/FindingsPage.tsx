import React, { useState } from 'react';
import {
  AlertOctagon,
  Search,
  Filter,
  ShieldAlert,
  FileText,
  CheckCircle2,
  ArrowUpDown,
  UserCheck,
  Check,
  X,
  Clock,
  RotateCcw,
  Eye,
  SlidersHorizontal,
  Download
} from 'lucide-react';
import { Finding, ReviewStatus, RiskBand } from '../types/brandguard';
import { RiskBadge, ReviewStatusBadge, PlatformBadge, CorroborationBadge } from '../components/StatusBadge';

interface FindingsPageProps {
  findings: Finding[];
  onOpenEvidence: (finding: Finding) => void;
  onOpenReport: (finding: Finding) => void;
  onQuickUpdateStatus: (findingId: string, status: ReviewStatus) => Promise<void>;
}

export const FindingsPage: React.FC<FindingsPageProps> = ({
  findings,
  onOpenEvidence,
  onOpenReport,
  onQuickUpdateStatus
}) => {
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'risk_desc' | 'risk_asc' | 'date_desc'>('risk_desc');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const resetFilters = () => {
    setSearch('');
    setRiskFilter('all');
    setStatusFilter('all');
    setEntityTypeFilter('all');
    setSortBy('risk_desc');
  };

  const handleExportCSV = () => {
    if (sorted.length === 0) return;
    const headers = ['Finding ID', 'Candidate Name', 'Platform', 'Entity Type', 'Identifier', 'Risk Score', 'Risk Band', 'Corroboration Met', 'Review Status', 'Forensic Summary', 'Created At'];
    const rows = sorted.map(f => [
      f.id,
      `"${f.candidate.display_name.replace(/"/g, '""')}"`,
      f.candidate.platform,
      f.candidate.entity_type,
      `"${(f.candidate.handle || f.candidate.package_or_bundle_id || f.candidate.external_id || '').replace(/"/g, '""')}"`,
      f.risk_score,
      f.risk_band,
      f.corroboration_met ? 'YES' : 'NO',
      f.review_status,
      `"${(f.explanation_summary || '').replace(/"/g, '""')}"`,
      f.created_at
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brandguard_findings_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filtered = findings.filter(f => {
    if (riskFilter !== 'all' && f.risk_band !== riskFilter) return false;
    if (statusFilter !== 'all' && f.review_status !== statusFilter) return false;
    if (entityTypeFilter !== 'all' && f.candidate.entity_type !== entityTypeFilter) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = f.candidate.display_name.toLowerCase().includes(q);
      const matchHandle = f.candidate.handle && f.candidate.handle.toLowerCase().includes(q);
      const matchPkg = f.candidate.package_or_bundle_id && f.candidate.package_or_bundle_id.toLowerCase().includes(q);
      const matchSummary = f.explanation_summary && f.explanation_summary.toLowerCase().includes(q);
      if (!matchName && !matchHandle && !matchPkg && !matchSummary) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'risk_desc') return b.risk_score - a.risk_score;
    if (sortBy === 'risk_asc') return a.risk_score - b.risk_score;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const handleStatusChange = async (findingId: string, newStatus: ReviewStatus) => {
    setUpdatingId(findingId);
    try {
      await onQuickUpdateStatus(findingId, newStatus);
    } finally {
      setUpdatingId(null);
    }
  };

  const hasActiveFilters = search.trim() !== '' || riskFilter !== 'all' || statusFilter !== 'all' || entityTypeFilter !== 'all';

  return (
    <div className="space-y-5">
      {/* Page Title & Forensic Queue Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">Security Findings Explorer</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Forensic queue of detected impersonation candidates with deterministic explainable signals
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            disabled={sorted.length === 0}
            className="text-xs text-slate-300 hover:text-white flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500"
            title="Export filtered findings as forensic CSV report"
          >
            <Download className="w-3 h-3 text-cyan-400" />
            <span>Export CSV</span>
          </button>

          <div className="text-xs font-mono text-slate-300 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-xs">
            <span className="text-slate-500">Filtered:</span>
            <span className="text-cyan-400 font-bold">{sorted.length}</span>
            <span className="text-slate-500">/</span>
            <span>{findings.length} findings</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
        <div className="relative min-w-64 flex-1">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by candidate name, handle, package ID, or attack signals..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-500 focus-visible:ring-1 focus-visible:ring-cyan-500"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={entityTypeFilter}
            onChange={e => setEntityTypeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-hidden focus-visible:ring-1 focus-visible:ring-cyan-500 cursor-pointer"
            aria-label="Filter by Entity Type"
          >
            <option value="all">All Entity Types</option>
            <option value="social_profile">Social Profiles</option>
            <option value="mobile_app">Mobile Applications</option>
          </select>

          <select
            value={riskFilter}
            onChange={e => setRiskFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-hidden focus-visible:ring-1 focus-visible:ring-cyan-500 cursor-pointer"
            aria-label="Filter by Risk Band"
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
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-hidden focus-visible:ring-1 focus-visible:ring-cyan-500 cursor-pointer"
            aria-label="Filter by Review Status"
          >
            <option value="all">All Review States</option>
            <option value="new">New (Unreviewed)</option>
            <option value="investigating">Under Investigation</option>
            <option value="confirmed">Confirmed Impersonator</option>
            <option value="false_positive">False Positive</option>
            <option value="dismissed">Dismissed</option>
          </select>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-hidden focus-visible:ring-1 focus-visible:ring-cyan-500 cursor-pointer"
            aria-label="Sort findings"
          >
            <option value="risk_desc">Sort: Highest Risk</option>
            <option value="risk_asc">Sort: Lowest Risk</option>
            <option value="date_desc">Sort: Newest Ingestion</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        {sorted.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-xs space-y-3">
            <AlertOctagon className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="font-semibold text-slate-300">No security findings match the active criteria</div>
            <p className="text-slate-500 max-w-sm mx-auto">
              Try adjusting your search terms or risk filters to view other suspicious entity candidates.
            </p>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="mt-2 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg text-xs font-medium cursor-pointer border border-slate-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                <tr>
                  <th className="py-3 px-4">Candidate Entity</th>
                  <th className="py-3 px-4">Platform</th>
                  <th className="py-3 px-4">Threat Rating</th>
                  <th className="py-3 px-4">Corroboration</th>
                  <th className="py-3 px-4">Forensic Summary</th>
                  <th className="py-3 px-4">Analyst Decision</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {sorted.map(f => {
                  const cand = f.candidate;
                  return (
                    <tr key={f.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {cand.avatar_or_icon_url ? (
                            <img
                              src={cand.avatar_or_icon_url}
                              alt=""
                              className="w-8 h-8 rounded-lg object-cover bg-slate-950 shrink-0 border border-slate-800"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 font-bold shrink-0">
                              {cand.display_name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0 max-w-[190px]">
                            <div className="font-semibold text-white text-xs truncate" title={cand.display_name}>
                              {cand.display_name}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono truncate" title={cand.handle ? `@${cand.handle}` : cand.package_or_bundle_id || ''}>
                              {cand.handle ? `@${cand.handle}` : cand.package_or_bundle_id || 'ID unassigned'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <PlatformBadge platform={cand.platform} entityType={cand.entity_type} />
                      </td>

                      <td className="py-3.5 px-4">
                        <RiskBadge band={f.risk_band} score={f.risk_score} />
                      </td>

                      <td className="py-3.5 px-4">
                        <CorroborationBadge met={f.corroboration_met} />
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-slate-300 text-[11px] line-clamp-2 leading-relaxed">
                          {f.explanation_summary}
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-1.5">
                          <select
                            value={f.review_status}
                            disabled={updatingId === f.id}
                            onChange={e => handleStatusChange(f.id, e.target.value as ReviewStatus)}
                            className="bg-slate-950 border border-slate-800 text-slate-200 text-[11px] rounded px-2 py-1 font-medium focus-visible:outline-none focus-visible:border-cyan-500 cursor-pointer block"
                            aria-label={`Change triage status for ${cand.display_name}`}
                          >
                            <option value="new">New (Unreviewed)</option>
                            <option value="investigating">Investigating</option>
                            <option value="confirmed">Confirmed Impersonator</option>
                            <option value="false_positive">False Positive</option>
                            <option value="dismissed">Dismissed</option>
                          </select>
                          {f.analyst_notes && (
                            <div className="text-[10px] text-slate-400 italic line-clamp-1 max-w-[180px]" title={f.analyst_notes}>
                              Note: {f.analyst_notes}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenEvidence(f)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-[11px] font-medium transition-colors cursor-pointer border border-slate-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 flex items-center gap-1"
                            title="Inspect full forensic evidence and side-by-side comparison"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Inspect</span>
                          </button>
                          <button
                            onClick={() => onOpenReport(f)}
                            title="Generate Takedown Notice forensic draft"
                            className="p-1 bg-rose-950/50 hover:bg-rose-900/70 text-rose-300 border border-rose-800/60 rounded transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-500"
                            aria-label="Generate Takedown Notice"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
