import React from 'react';
import {
  LayoutDashboard,
  ShieldCheck,
  Share2,
  Smartphone,
  AlertOctagon,
  Radar,
  BarChart3,
  Settings,
  X
} from 'lucide-react';

export type NavTab = 'overview' | 'brands' | 'social' | 'apps' | 'findings' | 'scans' | 'evaluation' | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  findingsCount: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  findingsCount,
  isOpenMobile = false,
  onCloseMobile
}) => {
  const items: Array<{
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
    badgeVariant?: 'rose' | 'slate';
  }> = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'brands', label: 'Brand Registry', icon: ShieldCheck },
    { id: 'social', label: 'Social Monitoring', icon: Share2 },
    { id: 'apps', label: 'App Monitoring', icon: Smartphone },
    { id: 'findings', label: 'Findings Explorer', icon: AlertOctagon, count: findingsCount, badgeVariant: 'rose' },
    { id: 'scans', label: 'Scans & Sources', icon: Radar },
    { id: 'evaluation', label: 'Benchmark Evaluation', icon: BarChart3 },
    { id: 'settings', label: 'Settings & Runtime', icon: Settings },
  ];

  const content = (
    <div className="flex flex-col justify-between h-full select-none">
      <div className="p-3 space-y-1">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
            Security Operations
          </span>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1 text-slate-400 hover:text-white rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {items.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id);
                if (onCloseMobile) onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                isActive
                  ? 'bg-slate-900 text-cyan-400 font-semibold shadow-xs border border-slate-800/80'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.count !== undefined && item.count > 0 && (
                <span
                  className={`text-[11px] font-mono px-1.5 py-0.2 rounded ${
                    item.badgeVariant === 'rose'
                      ? 'bg-rose-950/60 text-rose-300 border border-rose-900/40'
                      : 'text-slate-400'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Operational Assurance Card in Sidebar */}
      <div className="p-3 m-3 rounded-lg bg-slate-900/70 border border-slate-800/80 text-[11px] space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Engine Rulebook</span>
          <span className="font-mono text-[10px] text-cyan-400 font-semibold">v1.2-det</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Exclusion Guard</span>
          <span className="font-mono text-[10px] text-emerald-400 font-semibold">Enforced</span>
        </div>
        <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
          Zero-hallucination deterministic analysis
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-64 bg-slate-950/90 border-r border-slate-800/80 flex-col shrink-0 h-full overflow-y-auto">
        {content}
      </aside>

      {/* Mobile Drawer Backdrop and Overlay */}
      {isOpenMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="Navigation drawer">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative w-64 max-w-[80vw] bg-slate-950 border-r border-slate-800 flex flex-col z-10 shadow-2xl h-full overflow-y-auto">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
