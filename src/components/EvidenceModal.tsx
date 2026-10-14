import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Eye,
  ArrowRight,
  UserCheck,
  Check,
  Ban,
  Clock,
  History,
  GitCompare,
  Hash
} from 'lucide-react';
import { Finding, ReviewStatus } from '../types/brandguard';
import { RiskBadge, ReviewStatusBadge } from './StatusBadge';

interface EvidenceModalProps {
  finding: Finding | null;
  onClose: () => void;
  onUpdateStatus: (findingId: string, status: ReviewStatus, notes?: string) => Promise<void>;
  onOpenReport: (finding: Finding) => void;
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({
  finding,
  onClose,
  onUpdateStatus,
  onOpenReport
}) => {
  if (!finding) return null;

  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>(finding.review_status);
  const [analystNotes, setAnalystNotes] = useState(finding.analyst_notes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'evidence' | 'signals' | 'audit'>('evidence');

  const handleSaveReview = async () => {
    setIsSaving(true);
    try {
      await onUpdateStatus(finding.id, reviewStatus, analystNotes);
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickDecision = async (status: ReviewStatus, defaultNote: string) => {
    setReviewStatus(status);
    setAnalystNotes(defaultNote);
    setIsSaving(true);
    try {
      await onUpdateStatus(finding.id, status, defaultNote);
    } finally {
      setIsSaving(false);
    }
  };

  const cand = finding.candidate;
  const nameSignal = finding.signals.find(s => s.signal_type === 'name_similarity');
  const logoSignal = finding.signals.find(s => s.signal_type === 'logo_similarity');
  const conflictSignal = finding.signals.find(s => s.signal_type === 'identity_conflict');
  const descSignal = finding.signals.find(s => s.signal_type === 'description_similarity');
  const brandReferenceHash = logoSignal?.raw_reference_value || 'a1f03c89b2e47d10';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl text-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-start justify-between bg-slate-950/70 rounded-t-xl shrink-0">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 mt-0.5 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="font-bold text-base text-white">{cand.display_name}</h3>
                <span className="text-slate-600">·</span>
                <span className="text-xs text-slate-400 font-mono uppercase">{cand.platform}</span>
                <span className="text-slate-600">·</span>
                <RiskBadge band={finding.risk_band} score={finding.risk_score} />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Finding ID: <span className="font-mono text-slate-300">{finding.id}</span>
                <span className="text-slate-600 mx-2">·</span>
                Corroboration: <span className={finding.corroboration_met ? 'text-emerald-400 font-medium' : 'text-amber-400'}>
                  {finding.corroboration_met ? 'Verified (Multi-Signal)' : 'Single Signal / Capped'}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Navigation Tabs */}
        <div className="flex items-center px-5 border-b border-slate-800 bg-slate-950/40 text-xs">
          <button
            onClick={() => setActiveTab('evidence')}
            className={`py-2.5 px-3 font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'evidence'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>Forensic Evidence & Identity Diff</span>
          </button>
          <button
            onClick={() => setActiveTab('signals')}
            className={`py-2.5 px-3 font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'signals'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Hash className="w-3.5 h-3.5" />
            <span>Individual Signal Metrics ({finding.signals.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`py-2.5 px-3 font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'audit'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Review Audit History ({finding.review_events?.length || 0})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {/* Explainable Synthesis Callout */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Forensic Synthesis & Explanation
            </div>
            <p className="text-slate-200 text-sm leading-relaxed">
              {finding.explanation_summary}
            </p>
          </div>

          {activeTab === 'evidence' && (
            <div className="space-y-4">
              {/* Direct Side-by-Side Comparison Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Official Brand Anchor Card */}
                <div className="bg-slate-950 border border-emerald-900/40 rounded-xl p-4 space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="font-semibold text-xs text-white uppercase tracking-wider">Official Protected Anchor</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 font-semibold">
                      Ground Truth
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-cyan-400 font-bold text-base shrink-0 p-1">
                      {nameSignal?.raw_reference_value?.substring(0, 2).toUpperCase() || 'NP'}
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">
                        {nameSignal?.raw_reference_value || 'NovaPay'}
                      </div>
                      <div className="text-[11px] text-emerald-400 font-mono">
                        Official Domain: novapay.io
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Protected Corporate Identity
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-850 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Official Description Anchor:</span>
                      <p className="text-[11px] text-slate-300 mt-0.5 italic leading-relaxed">
                        "NovaPay is the secure, unified payments and financial platform for businesses worldwide."
                      </p>
                    </div>
                    {brandReferenceHash && (
                      <div className="flex justify-between items-center text-[11px] font-mono pt-1">
                        <span className="text-slate-500">Official Logo Hash:</span>
                        <span className="text-emerald-400">{brandReferenceHash}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Candidate Impersonator Card */}
                <div className="bg-slate-950 border border-rose-900/40 rounded-xl p-4 space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                      <span className="font-semibold text-xs text-white uppercase tracking-wider">Candidate Under Investigation</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/40 font-semibold">
                      Suspect Entity
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    {cand.avatar_or_icon_url ? (
                      <img
                        src={cand.avatar_or_icon_url}
                        alt={cand.display_name}
                        className="w-12 h-12 rounded-lg object-cover border border-rose-900/50 bg-slate-900 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-400 font-bold text-base shrink-0">
                        {cand.display_name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-bold text-white text-sm truncate">
                        {cand.display_name}
                      </div>
                      <div className="text-[11px] text-rose-400 font-mono truncate">
                        {cand.handle ? `@${cand.handle}` : cand.package_or_bundle_id || 'ID unassigned'}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 uppercase font-mono">
                        Platform: {cand.platform}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-850 text-xs">
                    {cand.description && (
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-semibold block">Candidate Bio / Description:</span>
                        <p className="text-[11px] text-slate-300 mt-0.5 italic leading-relaxed">
                          "{cand.description}"
                        </p>
                      </div>
                    )}
                    {cand.developer_name && (
                      <div className="flex justify-between items-center text-[11px] font-mono pt-1">
                        <span className="text-slate-500">Claimed Publisher:</span>
                        <span className="text-amber-300">{cand.developer_name}</span>
                      </div>
                    )}
                    {cand.perceptual_hash && (
                      <div className="flex justify-between items-center text-[11px] font-mono pt-1">
                        <span className="text-slate-500">Candidate Logo Hash:</span>
                        <span className="text-cyan-400">{cand.perceptual_hash}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Homoglyph / Confusable Spotlight when applicable */}
              {nameSignal && nameSignal.raw_score >= 80 && (
                <div className="bg-slate-950 border border-cyan-900/40 p-4 rounded-xl space-y-2">
                  <div className="font-semibold text-slate-200 text-xs flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span>Identity String Comparison & Confusable Analysis</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                    <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase block mb-1">Official Name</span>
                      <span className="text-emerald-400 font-semibold text-sm">
                        {nameSignal.raw_reference_value || 'NovaPay'}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase block mb-1">Candidate Observed String</span>
                      <span className="text-rose-400 font-semibold text-sm">
                        {nameSignal.raw_candidate_value || cand.display_name}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Detection Method: <code className="text-cyan-300 font-mono">{nameSignal.method_used}</code> · {nameSignal.explanation}
                  </p>
                </div>
              )}

              {/* Scoring Guardrail & Corroboration Summary */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-semibold text-slate-200 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-cyan-400" />
                    <span>Scoring Corroboration Guardrail</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xl">
                    High Risk (&gt;=80) strictly requires corroborated multi-signal evidence. Single uncorroborated signals are automatically capped at Medium Risk to eliminate false alarms.
                  </p>
                </div>
                <div className="shrink-0">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-medium ${
                    finding.corroboration_met
                      ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                      : 'bg-amber-950/60 border-amber-800 text-amber-300'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${finding.corroboration_met ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    <span>{finding.corroboration_met ? 'Corroboration Verified' : 'Single Signal Capped'}</span>
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'signals' && (
            <div className="space-y-3">
              <div className="text-[11px] text-slate-400">
                Individual signals evaluated by the deterministic detection engine:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {finding.signals.map(sig => (
                  <div key={sig.id} className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs uppercase tracking-wide">
                        {sig.signal_type.replace('_', ' ')}
                      </span>
                      <span className="font-mono text-cyan-400 font-bold text-sm">{sig.raw_score}%</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">
                      Algorithm: <code className="text-slate-400">{sig.method_used}</code>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-snug">{sig.explanation}</p>
                    <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-850">
                      Contribution to score: <span className="font-mono text-slate-300">{sig.contribution} pts</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-3">
              <div className="text-[11px] text-slate-400">
                Immutable SOC triage and decision audit trail:
              </div>
              {finding.review_events && finding.review_events.length > 0 ? (
                <div className="space-y-2">
                  {finding.review_events.map(ev => (
                    <div key={ev.id} className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{ev.reviewer_identity}</span>
                          <span className="text-slate-600">·</span>
                          <span className="text-slate-400">Changed to</span>
                          <span className="font-mono uppercase font-semibold text-cyan-400">{ev.new_status}</span>
                        </div>
                        {ev.notes && (
                          <p className="text-slate-300 text-[11px] italic mt-1">"{ev.notes}"</p>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 shrink-0">
                        {new Date(ev.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500 bg-slate-950 rounded-lg border border-slate-800">
                  No review state changes recorded yet. Finding is in initial state.
                </div>
              )}
            </div>
          )}

          {/* Analyst Review Section with 1-Click Quick Actions */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-cyan-400" />
                <span className="font-semibold text-slate-200">Security Analyst Review Workflow</span>
              </div>
              <ReviewStatusBadge status={reviewStatus} />
            </div>

            {/* Quick 1-Click Triage Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[10px] text-slate-500 uppercase font-semibold mr-1">Quick Decision:</span>
              <button
                type="button"
                onClick={() => handleQuickDecision('confirmed', 'Confirmed impersonator targeting consumer credentials; takedown warranted.')}
                className="px-2.5 py-1 bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 rounded text-[11px] font-medium transition-colors cursor-pointer"
              >
                Mark Confirmed Impersonator
              </button>
              <button
                type="button"
                onClick={() => handleQuickDecision('investigating', 'Assigned to SOC threat triage queue for manual account audit.')}
                className="px-2.5 py-1 bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-800/40 rounded text-[11px] font-medium transition-colors cursor-pointer"
              >
                Start Investigation
              </button>
              <button
                type="button"
                onClick={() => handleQuickDecision('false_positive', 'Verified benign unaffiliated organization; no trademark collision.')}
                className="px-2.5 py-1 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/40 rounded text-[11px] font-medium transition-colors cursor-pointer"
              >
                Mark False Positive
              </button>
              <button
                type="button"
                onClick={() => handleQuickDecision('dismissed', 'Low risk entity dismissed.')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-medium transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Status Selection</label>
                <select
                  value={reviewStatus}
                  onChange={e => setReviewStatus(e.target.value as ReviewStatus)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-cyan-500"
                >
                  <option value="new">New (Unreviewed)</option>
                  <option value="investigating">Investigating (In SOC Triage)</option>
                  <option value="confirmed">Confirmed Impersonation (Enforce Action)</option>
                  <option value="false_positive">False Positive (Benign Entity)</option>
                  <option value="dismissed">Dismissed (Accepted Risk)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Analyst Forensic Notes</label>
                <input
                  type="text"
                  placeholder="e.g., Confirmed unauthorized phishing domain in bio; initiating takedown draft."
                  value={analystNotes}
                  onChange={e => setAnalystNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={handleSaveReview}
                disabled={isSaving}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500"
              >
                {isSaving ? 'Saving...' : 'Save Custom Decision'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 flex items-center justify-between bg-slate-950/70 rounded-b-xl shrink-0">
          <div className="text-[11px] text-slate-500 hidden sm:block">
            Evidence preserved immutably across triage decisions
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenReport(finding)}
              className="flex items-center gap-2 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
            >
              <FileText className="w-4 h-4" />
              <span>Generate Takedown Notice Draft</span>
            </button>
            <button
              onClick={onClose}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
