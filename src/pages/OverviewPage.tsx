import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertOctagon,
  CheckCircle2,
  Share2,
  Smartphone,
  Play,
  ArrowRight,
  TrendingUp,
  Layers,
  FileCheck,
  Shield,
  Activity,
  Filter,
  ExternalLink,
  ShieldCheck,
  Lock
} from 'lucide-react';
import { Brand, Finding, ScanSummary, RiskBand } from '../types/brandguard';
import { RiskBadge, ReviewStatusBadge, PlatformBadge, CorroborationBadge } from '../components/StatusBadge';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from 'recharts';

interface OverviewPageProps {
  brand: Brand | null;
  findings: Finding[];
  scans: ScanSummary[];
  onOpenScanModal: () => void;
  onOpenEvidence: (finding: Finding) => void;
  onNavigateTab: (tab: any) => void;
  onLoadDemo: () => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  brand,
  findings,
  scans,
  onOpenScanModal,
  onOpenEvidence,
  onNavigateTab,
  onLoadDemo
}) => {
  const [tableFilter, setTableFilter] = useState<'all' | 'high' | 'medium' | 'needs_review'>('all');
  const latestScan = scans[0];

  // Derive metrics authoritatively from records
  const totalFindings = findings.length;
  const highRisk = findings.filter(f => f.risk_band === 'high').length;
  const medRisk = findings.filter(f => f.risk_band === 'medium').length;
  const needsReview = findings.filter(f => f.risk_band === 'needs_review').length;
  const lowIgnored = findings.filter(f => f.risk_band === 'ignored').length;
  const confirmedCount = findings.filter(f => f.review_status === 'confirmed').length;

  const socialCount = findings.filter(f => f.candidate.entity_type === 'social_profile').length;
  const appCount = findings.filter(f => f.candidate.entity_type === 'mobile_app').length;

  // Chart data
  const riskDistribution = [
    { name: 'High Risk', count: highRisk, color: '#f43f5e' },
    { name: 'Medium Risk', count: medRisk, color: '#f59e0b' },
    { name: 'Needs Review', count: needsReview, color: '#0ea5e9' },
    { name: 'Low / Ignored', count: lowIgnored, color: '#475569' },
  ];

  const filteredRecentFindings = findings
    .filter(f => tableFilter === 'all' || f.risk_band === tableFilter)
    .slice(0, 7);

  return (
    <div className="space-y-6">
      {/* Top SOC Identity Banner */}
      <section aria-labelledby="soc-overview-heading" className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h1 id="soc-overview-heading" className="text-xl font-bold text-white tracking-tight">Security Operations Dashboard</h1>
              <span className="text-slate-600">·</span>
              <span className="text-xs uppercase font-mono tracking-wider text-cyan-400 bg-cyan-950/60 border border-cyan-800/50 px-2 py-0.5 rounded font-semibold">
                {brand?.name || 'NovaPay'} Target
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1.5 flex flex-wrap items-center gap-2">
              <span>Primary Domain: <code className="font-mono text-cyan-300 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">{brand?.normalized_domain || 'novapay.io'}</code></span>
              <span className="text-slate-600">·</span>
              <span>Exclusion Anchors: <code className="font-mono text-emerald-300 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">{brand?.official_assets?.length || 0} registered assets</code></span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-500 font-mono text-[11px]">Engine: Deterministic Scorer v1.2</span>
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onLoadDemo}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
            >
              Reset Benchmark Fixtures
            </button>
            <button
              onClick={onOpenScanModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Launch Scan</span>
            </button>
          </div>
        </div>
      </section>

      {/* Primary KPI Metrics */}
      <section aria-label="Detection metrics" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Candidates Analyzed */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Candidates Ingested</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {latestScan?.candidates_analyzed || findings.length}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Across active feeds</div>
        </div>

        {/* High Risk Findings */}
        <div className="bg-slate-900 border border-rose-950/60 rounded-xl p-4 flex flex-col justify-between">
          <div className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider">High Risk Threats</div>
          <div className="text-2xl font-bold font-mono text-rose-400 mt-1 flex items-baseline gap-1.5">
            <span>{highRisk}</span>
            <span className="text-[11px] font-normal text-rose-400/70">
              {totalFindings > 0 ? `(${Math.round((highRisk / totalFindings) * 100)}%)` : ''}
            </span>
          </div>
          <div className="text-[10px] text-rose-400/80 mt-1">Multi-signal verified</div>
        </div>

        {/* Medium Risk */}
        <div className="bg-slate-900 border border-amber-950/60 rounded-xl p-4 flex flex-col justify-between">
          <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">Medium Risk</div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">{medRisk}</div>
          <div className="text-[10px] text-amber-400/80 mt-1">Typos & lookalikes</div>
        </div>

        {/* SOC Confirmed Impersonations */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Analyst Confirmed</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{confirmedCount}</div>
          <div className="text-[10px] text-slate-500 mt-1">Verified takedown targets</div>
        </div>

        {/* Social Entities */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Social Entities</div>
          <div className="text-2xl font-bold font-mono text-slate-200 mt-1">{socialCount}</div>
          <div className="text-[10px] text-slate-500 mt-1">Profiles correlated</div>
        </div>

        {/* Applications */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">App Candidates</div>
          <div className="text-2xl font-bold font-mono text-slate-200 mt-1">{appCount}</div>
          <div className="text-[10px] text-slate-500 mt-1">Store packages examined</div>
        </div>
      </section>

      {/* Main Grid: Risk Chart + Scan Execution Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Threat Severity Distribution</h2>
                <p className="text-xs text-slate-400 mt-0.5">Calculated using deterministic multi-signal scoring and corroboration requirements</p>
              </div>
              <button
                onClick={() => onNavigateTab('findings')}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium focus-visible:outline-none focus-visible:underline"
              >
                <span>View All Findings</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="h-48 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskDistribution} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
                  <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} axisLine={{ stroke: '#334155' }} />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={95} tickLine={false} axisLine={{ stroke: '#334155' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '6px', color: '#f1f5f9', fontSize: '11px' }}
                    cursor={{ fill: 'rgba(51, 65, 85, 0.2)' }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={16}>
                    {riskDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-800 text-[11px] text-center">
            <div className="text-slate-400">
              <span className="block font-semibold text-rose-400 font-mono">{highRisk}</span> High Risk
            </div>
            <div className="text-slate-400">
              <span className="block font-semibold text-amber-400 font-mono">{medRisk}</span> Medium Risk
            </div>
            <div className="text-slate-400">
              <span className="block font-semibold text-sky-400 font-mono">{needsReview}</span> Needs Review
            </div>
            <div className="text-slate-400">
              <span className="block font-semibold text-slate-400 font-mono">{lowIgnored}</span> Low / Clean
            </div>
          </div>
        </div>

        {/* Latest Scan Activity Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Detection Pipeline Audit</h2>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>
            <p className="text-xs text-slate-400 mb-4">Latest execution telemetry</p>

            {latestScan ? (
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Execution Status</span>
                  <span className="font-mono text-emerald-400 font-semibold uppercase">{latestScan.status}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Candidates Analyzed</span>
                  <span className="font-mono text-white font-semibold">{latestScan.candidates_analyzed}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Official Exclusions Applied</span>
                  <span className="font-mono text-cyan-400 font-semibold">{latestScan.exclusions_applied} verified</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Actionable Findings</span>
                  <span className="font-mono text-white font-semibold">{latestScan.findings_created}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Scan Timestamp</span>
                  <span className="font-mono text-slate-300 text-[11px]">
                    {new Date(latestScan.created_at).toLocaleTimeString()} UTC
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500 text-xs">
                No scans executed yet. Click "Launch Scan" to begin.
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigateTab('scans')}
            className="w-full mt-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-lg text-xs font-medium text-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
          >
            Review Scan History & Provenance
          </button>
        </div>
      </div>

      {/* Recent Findings Table with Filter Controls */}
      <section aria-labelledby="top-findings-heading" className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="top-findings-heading" className="text-sm font-bold text-white uppercase tracking-wider">Top Suspicious Entities</h2>
            <p className="text-xs text-slate-400 mt-0.5">Ranked by risk score, attack surface, and corroboration level</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
              <button
                onClick={() => setTableFilter('all')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  tableFilter === 'all' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setTableFilter('high')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  tableFilter === 'high' ? 'bg-rose-950/70 text-rose-300 shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                High Risk
              </button>
              <button
                onClick={() => setTableFilter('medium')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  tableFilter === 'medium' ? 'bg-amber-950/70 text-amber-300 shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Medium
              </button>
              <button
                onClick={() => setTableFilter('needs_review')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  tableFilter === 'needs_review' ? 'bg-sky-950/70 text-sky-300 shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Needs Review
              </button>
            </div>

            <button
              onClick={() => onNavigateTab('findings')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium ml-2 cursor-pointer focus-visible:outline-none focus-visible:underline"
            >
              Open Findings Explorer →
            </button>
          </div>
        </div>

        {filteredRecentFindings.length === 0 ? (
          <div className="p-10 text-center text-slate-500 text-xs">
            No findings match the selected filter. Click "All" or "Launch Scan".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                <tr>
                  <th className="py-3 px-4">Entity Identity</th>
                  <th className="py-3 px-4">Platform</th>
                  <th className="py-3 px-4">Threat Rating</th>
                  <th className="py-3 px-4">Corroboration</th>
                  <th className="py-3 px-4">Forensic Summary</th>
                  <th className="py-3 px-4">Review Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredRecentFindings.map(f => (
                  <tr key={f.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        {f.candidate.avatar_or_icon_url ? (
                          <img
                            src={f.candidate.avatar_or_icon_url}
                            alt=""
                            className="w-7 h-7 rounded-md object-cover bg-slate-800 shrink-0 border border-slate-700"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] text-slate-400 font-bold shrink-0">
                            {f.candidate.display_name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 max-w-[200px]">
                          <div className="font-semibold text-white truncate">{f.candidate.display_name}</div>
                          <div className="text-[11px] text-slate-400 font-mono truncate">
                            {f.candidate.handle ? `@${f.candidate.handle}` : f.candidate.package_or_bundle_id || 'ID unassigned'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <PlatformBadge platform={f.candidate.platform} entityType={f.candidate.entity_type} />
                    </td>

                    <td className="py-3 px-4">
                      <RiskBadge band={f.risk_band} score={f.risk_score} />
                    </td>

                    <td className="py-3 px-4">
                      <CorroborationBadge met={f.corroboration_met} />
                    </td>

                    <td className="py-3 px-4 max-w-xs truncate text-slate-300 text-[11px]">
                      {f.explanation_summary}
                    </td>

                    <td className="py-3 px-4">
                      <ReviewStatusBadge status={f.review_status} />
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onOpenEvidence(f)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-[11px] font-medium transition-colors cursor-pointer border border-slate-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500"
                      >
                        Inspect Evidence
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
