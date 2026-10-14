import React from 'react';
import { Radar, Layers, CheckCircle2, AlertCircle, Clock, Database, Globe, Play } from 'lucide-react';
import { ScanSummary, Brand } from '../types/brandguard';

interface ScansSourcesPageProps {
  scans: ScanSummary[];
  brand: Brand | null;
  onOpenScanModal: () => void;
}

export const ScansSourcesPage: React.FC<ScansSourcesPageProps> = ({
  scans,
  brand,
  onOpenScanModal
}) => {
  const sources = [
    {
      id: 'src-1',
      name: 'Synthetic Identity Benchmark Feed',
      type: 'Simulated Demo Source',
      origin: 'Local Forensic Test Fixture (10 Candidates)',
      status: 'operational',
      candidateCount: 10,
      isLiveExternal: false,
      notes: 'Controlled fictional benchmark containing homoglyphs, exact clones, different publishers, and official assets.'
    },
    {
      id: 'src-2',
      name: 'Apple App Store Public Store Feed',
      type: 'Live API Integration',
      origin: 'https://itunes.apple.com/search (Public Search API)',
      status: 'operational',
      candidateCount: 'Dynamic',
      isLiveExternal: true,
      notes: 'Live Apple iTunes Search API querying brand keywords in real-time (CORS enabled, non-scraping).'
    },
    {
      id: 'src-3',
      name: 'Enterprise Threat Intel CSV Ingestion',
      type: 'Imported Dataset',
      origin: 'SOC Upload Queue (/api/v1/imports)',
      status: 'ready',
      candidateCount: 0,
      isLiveExternal: false,
      notes: 'Accepts external intelligence dumps in CSV/JSON format.'
    },
    {
      id: 'src-4',
      name: 'Twitter / X Developer Stream',
      type: 'Live API Integration',
      origin: 'api.twitter.com/2/tweets/search/stream',
      status: 'not_configured',
      candidateCount: 0,
      isLiveExternal: true,
      notes: 'Requires TWITTER_BEARER_TOKEN in server environment. Feed disabled to prevent mock fabrication.'
    },
    {
      id: 'src-5',
      name: 'Meta / Instagram Graph API',
      type: 'Live API Integration',
      origin: 'graph.facebook.com/v19.0',
      status: 'not_configured',
      candidateCount: 0,
      isLiveExternal: true,
      notes: 'Requires META_APP_SECRET and App Review in server environment. Feed disabled to prevent mock fabrication.'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Radar className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">Scans & Data Source Provenance</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Audit history of detection executions and transparent provenance of all candidate ingestion feeds
          </p>
        </div>

        <button
          onClick={onOpenScanModal}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
        >
          <Play className="w-3.5 h-3.5" />
          <span>Launch New Scan</span>
        </button>
      </div>

      {/* Sources Health & Provenance */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-800">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Configured Ingestion Channels</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Transparently classified as Imported Dataset, Simulated Demo Source, or Live API
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-4">Source Name</th>
                <th className="py-3 px-4">Integration Type</th>
                <th className="py-3 px-4">Data Origin</th>
                <th className="py-3 px-4">Status & Health</th>
                <th className="py-3 px-4">Record Ingestion</th>
                <th className="py-3 px-4">Audit Scope & Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {sources.map(s => (
                <tr key={s.id} className="hover:bg-slate-850/40">
                  <td className="py-3.5 px-4 font-semibold text-white">
                    {s.name}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                      s.isLiveExternal
                        ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/50'
                        : s.type === 'Simulated Demo Source'
                        ? 'bg-cyan-950/50 text-cyan-300 border-cyan-800/50'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}>
                      {s.type}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                    {s.origin}
                  </td>
                  <td className="py-3.5 px-4">
                    {s.status === 'operational' && (
                      <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Operational</span>
                      </span>
                    )}
                    {s.status === 'ready' && (
                      <span className="inline-flex items-center gap-1.5 text-cyan-400 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                        <span>Ready</span>
                      </span>
                    )}
                    {s.status === 'not_configured' && (
                      <span className="inline-flex items-center gap-1.5 text-amber-400 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span>Not Configured</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-200">
                    {typeof s.candidateCount === 'number' ? `${s.candidateCount} candidates` : s.candidateCount}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 text-[11px] max-w-xs leading-relaxed">
                    {s.notes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historical Scan Pipeline Executions */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Scan Run History</h2>
            <p className="text-xs text-slate-400 mt-0.5">Immutable audit trail of detection runs and candidate yields</p>
          </div>
          <span className="text-xs font-mono text-slate-400">{scans.length} runs executed</span>
        </div>

        {scans.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No scans have been launched yet. Click "Launch New Scan" above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3 px-4">Scan Execution ID</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Candidates Analyzed</th>
                  <th className="py-3 px-4">Official Exclusions</th>
                  <th className="py-3 px-4">Findings Created</th>
                  <th className="py-3 px-4">Risk Breakdown</th>
                  <th className="py-3 px-4 text-right">Execution Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {scans.map(s => (
                  <tr key={s.id} className="hover:bg-slate-850/40">
                    <td className="py-3.5 px-4 font-mono text-cyan-400 font-semibold text-[11px]">
                      {s.id}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 font-mono uppercase text-emerald-400 text-[11px] font-semibold">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{s.status}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-white">
                      {s.candidates_analyzed}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-cyan-400 font-semibold">
                      {s.exclusions_applied} verified
                    </td>

                    <td className="py-3.5 px-4 font-mono text-white">
                      {s.findings_created}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2 text-[11px] font-mono">
                        <span className="text-rose-400 font-semibold">{s.high_risk_count} High</span>
                        <span className="text-slate-600">/</span>
                        <span className="text-amber-400">{s.medium_risk_count} Med</span>
                        <span className="text-slate-600">/</span>
                        <span className="text-sky-400">{s.needs_review_count} Rev</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-slate-400 text-[11px]">
                      {new Date(s.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
