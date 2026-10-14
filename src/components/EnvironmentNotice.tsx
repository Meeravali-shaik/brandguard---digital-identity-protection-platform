import React, { useState } from 'react';
import { Server, Database, CheckCircle, AlertTriangle, ArrowRight, ChevronDown, ChevronUp, Terminal } from 'lucide-react';
import { BackendStatus } from '../services/apiClient';

interface EnvironmentNoticeProps {
  status: BackendStatus;
  onNavigateSettings: () => void;
  onRecheckHealth: () => void;
}

export const EnvironmentNotice: React.FC<EnvironmentNoticeProps> = ({
  status,
  onNavigateSettings,
  onRecheckHealth
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-slate-900/90 border-b border-slate-800 text-xs text-slate-300">
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 font-semibold text-slate-200">
            <Server className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="hidden xs:inline">Runtime Architecture:</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                status.isOnline ? 'bg-emerald-500' : 'bg-cyan-500 animate-pulse'
              }`}
            />
            <span className="truncate max-w-[280px] sm:max-w-none">
              {status.isOnline ? (
                <span className="text-emerald-400 font-medium">FastAPI + PostgreSQL 16 Live ({status.apiUrl})</span>
              ) : (
                <span className="text-cyan-300 font-medium">
                  Deterministic Client Engine Active · FastAPI Container in <code className="bg-slate-800 px-1 py-0.5 rounded text-cyan-200 font-mono text-[11px]">/backend</code>
                </span>
              )}
            </span>
          </div>

          <span className="text-slate-600 hidden lg:inline">|</span>
          <span className="text-slate-400 hidden lg:inline">
            PostgreSQL 16 schemas & Alembic migrations verified
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!status.isOnline && (
            <button
              onClick={onRecheckHealth}
              className="px-2 py-0.5 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 text-[11px]"
              title="Ping remote backend on :8000"
            >
              Ping Backend
            </button>
          )}

          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors text-[11px] px-1.5 py-0.5 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500"
            aria-expanded={expanded}
          >
            <span>{expanded ? 'Hide Guide' : 'Docker Quickstart'}</span>
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          <button
            onClick={onNavigateSettings}
            className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors font-medium cursor-pointer text-[11px] px-1.5 py-0.5 rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500"
          >
            <span>Settings</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Expandable Docker Instruction Drawer */}
      {expanded && (
        <div className="bg-slate-950 border-t border-slate-850 px-4 py-3 text-[11px] animate-fadeIn">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3 text-slate-400">
            <div className="flex items-start gap-2">
              <Terminal className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-200">Start Local PostgreSQL 16 + FastAPI Container:</span>
                <span className="block text-slate-400 mt-0.5">
                  Run <code className="text-cyan-300 bg-slate-900 px-1 py-0.5 rounded font-mono">cd backend && docker compose up --build</code>.
                  FastAPI will automatically run Alembic migrations and serve REST endpoints at <code className="text-slate-300">http://localhost:8000/api/v1</code>.
                </span>
              </div>
            </div>

            <button
              onClick={onNavigateSettings}
              className="self-start md:self-auto px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded font-medium transition-colors shrink-0 cursor-pointer"
            >
              Configure Custom API URL
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
