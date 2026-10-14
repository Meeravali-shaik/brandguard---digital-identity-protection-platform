import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Server,
  Database,
  Terminal,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Info,
  Shield
} from 'lucide-react';
import { BackendStatus, apiClient } from '../services/apiClient';

interface SettingsPageProps {
  status: BackendStatus;
  onRefreshStatus: () => void;
  onResetDemo: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  status,
  onRefreshStatus,
  onResetDemo,
  theme,
  onToggleTheme
}) => {
  const [apiUrl, setApiUrl] = useState(apiClient.getApiUrl());
  const [forceClient, setForceClient] = useState(apiClient.isForceClientMode());
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    apiClient.setApiUrl(apiUrl);
    apiClient.setForceClientMode(forceClient);
    await onRefreshStatus();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-cyan-400" />
          <h1 className="text-xl font-bold text-white tracking-tight">System Settings & Architecture</h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Backend API connectivity, local Docker orchestration instructions, and detection engine weights
        </p>
      </div>

      {/* Backend API Connection & Runtime Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Server className="w-4 h-4 text-cyan-400" />
            <h2 className="font-bold text-sm text-white">Backend Connection Status</h2>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold font-mono ${
            status.isOnline
              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
              : 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/40'
          }`}>
            <span className={`w-2 h-2 rounded-full ${status.isOnline ? 'bg-emerald-400' : 'bg-cyan-400 animate-pulse'}`} />
            <span>{status.isOnline ? 'FastAPI 3.12 Connected' : 'In-Browser Client Engine Active'}</span>
          </span>
        </div>

        <form onSubmit={handleSaveConnection} className="space-y-3">
          <div>
            <label className="block text-slate-400 font-medium mb-1">
              Backend REST API Base URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={apiUrl}
                onChange={e => setApiUrl(e.target.value)}
                placeholder="http://localhost:8000/api/v1"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-white focus:outline-hidden focus:border-cyan-500"
              />
              <button
                type="submit"
                className="px-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold transition-colors cursor-pointer"
              >
                Apply & Test
              </button>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Checked at: <span className="font-mono text-slate-400">{new Date(status.checkedAt).toLocaleTimeString()}</span>
              {status.error && <span className="text-amber-400 ml-2">({status.error})</span>}
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={forceClient}
                onChange={e => setForceClient(e.target.checked)}
                className="rounded border-slate-700 text-cyan-500 focus:ring-0"
              />
              <span>Enforce In-Browser Client Demonstration Engine (Skip external network pings)</span>
            </label>
          </div>

          {saveSuccess && (
            <div className="p-2.5 bg-emerald-950/40 border border-emerald-800 text-emerald-300 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Connection parameters updated successfully!</span>
            </div>
          )}
        </form>
      </div>

      {/* Local Docker Compose Instructions */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 text-xs">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span>PostgreSQL 16 & FastAPI Local Deployment Guide</span>
        </div>
        <p className="text-slate-400 text-[11px] leading-relaxed">
          The production FastAPI backend, SQLAlchemy 2.0 models, Alembic migrations, and PostgreSQL 16 Docker Compose setup
          are authored inside the <code className="text-cyan-300 bg-slate-950 px-1 py-0.5 rounded font-mono">/backend</code> folder.
          To launch the external container backend on your workstation:
        </p>

        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-[11px] text-slate-200 space-y-1">
          <div className="text-slate-500"># 1. Navigate to backend directory</div>
          <div className="text-cyan-300 font-semibold">cd backend</div>
          <div className="text-slate-500 pt-1"># 2. Start PostgreSQL 16 and FastAPI with auto Alembic migrations</div>
          <div className="text-cyan-300 font-semibold">docker compose up --build</div>
          <div className="text-slate-500 pt-1"># 3. Backend will be live at http://localhost:8000/api/v1 (docs at /docs)</div>
        </div>
      </div>

      {/* Detection Engine Weights & Thresholds Configuration */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 text-xs">
        <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-slate-800 pb-3">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <span>Configured Deterministic Scoring Weights & Bands</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <span className="font-semibold text-slate-300 uppercase tracking-wider text-[10px]">
              Signal Normalized Weights
            </span>
            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between p-2 bg-slate-950 rounded border border-slate-850">
                <span className="text-slate-400">Name Similarity (Levenshtein / Homoglyph)</span>
                <span className="text-cyan-400 font-bold">40%</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-950 rounded border border-slate-850">
                <span className="text-slate-400">Logo / Icon Similarity (Perceptual dHash)</span>
                <span className="text-cyan-400 font-bold">25%</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-950 rounded border border-slate-850">
                <span className="text-slate-400">Identity Anchor Conflict (Account/Package)</span>
                <span className="text-cyan-400 font-bold">20%</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-950 rounded border border-slate-850">
                <span className="text-slate-400">Description Phrasing (TF-IDF Cosine)</span>
                <span className="text-cyan-400 font-bold">15%</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <span className="font-semibold text-slate-300 uppercase tracking-wider text-[10px]">
              Risk Score Classification Bands
            </span>
            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between p-2 bg-slate-950 rounded border border-slate-850">
                <span className="text-rose-400">High Risk (Strong Corroboration)</span>
                <span className="text-white">75.0 – 100.0</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-950 rounded border border-slate-850">
                <span className="text-amber-400">Medium Risk (Moderate Corroboration)</span>
                <span className="text-white">55.0 – 74.9</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-950 rounded border border-slate-850">
                <span className="text-sky-400">Needs Review (Single signal / Uncorroborated)</span>
                <span className="text-white">30.0 – 54.9</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-950 rounded border border-slate-850">
                <span className="text-slate-400">Low / Ignored</span>
                <span className="text-white">0.0 – 29.9</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
          <strong className="text-slate-300">Guardrail Rule:</strong> A name-only match is strictly capped at <span className="text-sky-400">Needs Review</span> and can never reach High Risk without independent corroborating evidence (e.g. cloned logo or rogue package ID).
        </div>
      </div>

      {/* Demo Reset Action */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between text-xs">
        <div>
          <h2 className="font-bold text-white text-sm">Synthetic Benchmark Reset</h2>
          <p className="text-slate-400 text-[11px] mt-0.5">
            Reset all scans, candidate profiles, and review decisions to pristine demo fixtures
          </p>
        </div>

        <button
          onClick={onResetDemo}
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-rose-400 border border-slate-700 rounded-lg font-semibold transition-colors cursor-pointer"
        >
          Reset Demo Fixture
        </button>
      </div>
    </div>
  );
};
