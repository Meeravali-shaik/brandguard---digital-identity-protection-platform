import React from 'react';
import { RiskBand, ReviewStatus } from '../types/brandguard';
import { ShieldAlert, AlertTriangle, HelpCircle, CheckCircle2, ShieldX, Smartphone, Share2 } from 'lucide-react';

interface RiskBadgeProps {
  band: RiskBand;
  score?: number;
  size?: 'sm' | 'md';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ band, score, size = 'sm' }) => {
  const pyClass = size === 'sm' ? 'py-0.5 px-2 text-[11px]' : 'py-1 px-2.5 text-xs';

  switch (band) {
    case 'high':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded border bg-rose-950/70 border-rose-700/60 text-rose-300 font-mono ${pyClass}`}
          role="status"
          aria-label={`High Risk threat, score ${score ?? 'unknown'}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
          <span className="font-sans font-semibold tracking-wide uppercase text-[10px]">High Risk</span>
          {score !== undefined && <span className="text-rose-200 font-bold ml-0.5">[{score}]</span>}
        </span>
      );
    case 'medium':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded border bg-amber-950/70 border-amber-700/60 text-amber-300 font-mono ${pyClass}`}
          role="status"
          aria-label={`Medium Risk threat, score ${score ?? 'unknown'}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span className="font-sans font-semibold tracking-wide uppercase text-[10px]">Medium</span>
          {score !== undefined && <span className="text-amber-200 font-bold ml-0.5">[{score}]</span>}
        </span>
      );
    case 'needs_review':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded border bg-sky-950/70 border-sky-700/60 text-sky-300 font-mono ${pyClass}`}
          role="status"
          aria-label={`Needs Review, score ${score ?? 'unknown'}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
          <span className="font-sans font-semibold tracking-wide uppercase text-[10px]">Needs Review</span>
          {score !== undefined && <span className="text-sky-200 font-bold ml-0.5">[{score}]</span>}
        </span>
      );
    case 'ignored':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded border bg-slate-900 border-slate-700 text-slate-400 font-mono ${pyClass}`}
          role="status"
          aria-label={`Low / Ignored, score ${score ?? 'unknown'}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
          <span className="font-sans font-medium text-[10px]">Low / Ignored</span>
          {score !== undefined && <span className="text-slate-500 ml-0.5">[{score}]</span>}
        </span>
      );
  }
};

interface ReviewStatusBadgeProps {
  status: ReviewStatus;
}

export const ReviewStatusBadge: React.FC<ReviewStatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'confirmed':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-red-950/80 border border-red-700/70 text-red-300">
          <ShieldAlert className="w-3 h-3 text-red-400 shrink-0" />
          <span>Confirmed Impersonator</span>
        </span>
      );
    case 'investigating':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-950/80 border border-amber-700/70 text-amber-300">
          <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
          <span>Under Investigation</span>
        </span>
      );
    case 'false_positive':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-950/80 border border-emerald-700/70 text-emerald-300">
          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
          <span>False Positive</span>
        </span>
      );
    case 'dismissed':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-900 border border-slate-700 text-slate-400">
          <ShieldX className="w-3 h-3 text-slate-400 shrink-0" />
          <span>Dismissed</span>
        </span>
      );
    case 'new':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800/80 border border-slate-700 text-slate-300">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
          <span>New Finding</span>
        </span>
      );
  }
};

interface CorroborationBadgeProps {
  met: boolean;
}

export const CorroborationBadge: React.FC<CorroborationBadgeProps> = ({ met }) => {
  if (met) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-950/60 border border-emerald-800/60 text-emerald-300" title="Meets multi-signal corroboration requirement for high risk">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        <span>Corroborated</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-800" title="Single uncorroborated signal (capped risk score)">
      <span>Single Signal (Capped)</span>
    </span>
  );
};

interface PlatformBadgeProps {
  platform: string;
  entityType?: 'social_profile' | 'mobile_app';
}

export const PlatformBadge: React.FC<PlatformBadgeProps> = ({ platform, entityType }) => {
  const isApp = entityType === 'mobile_app' || platform.includes('store') || platform.includes('play');
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-slate-900 border border-slate-800 text-slate-300">
      {isApp ? (
        <Smartphone className="w-3 h-3 text-cyan-400 shrink-0" />
      ) : (
        <Share2 className="w-3 h-3 text-indigo-400 shrink-0" />
      )}
      <span className="capitalize">{platform.replace(/_/g, ' ')}</span>
    </span>
  );
};
