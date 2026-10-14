import React, { useState, useEffect, useRef } from 'react';
import { Shield, ChevronDown, Plus, Play, RefreshCw, Sun, Moon, Menu, X, Check } from 'lucide-react';
import { Brand } from '../types/brandguard';
import { BackendStatus } from '../services/apiClient';

interface NavbarProps {
  brands: Brand[];
  activeBrand: Brand | null;
  onSelectBrand: (brandId: string) => void;
  onOpenRegisterModal: () => void;
  onOpenScanModal: () => void;
  onLoadDemo: () => void;
  backendStatus: BackendStatus;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  isScanning: boolean;
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  brands,
  activeBrand,
  onSelectBrand,
  onOpenRegisterModal,
  onOpenScanModal,
  onLoadDemo,
  backendStatus,
  theme,
  onToggleTheme,
  isScanning,
  mobileMenuOpen,
  onToggleMobileMenu
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-14 bg-slate-950/95 border-b border-slate-800/80 sticky top-0 z-40 flex items-center justify-between px-3 sm:px-6 backdrop-blur-md">
      {/* Left: Mobile Menu Toggle & Brand Identity */}
      <div className="flex items-center gap-3 sm:gap-6">
        {/* Mobile menu button */}
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 transition-colors"
          aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Brand Logo & Name */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-900 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 shadow-xs">
            <Shield className="w-4 h-4" />
          </div>
          <div className="hidden xs:block">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-white">BrandGuard</span>
              <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400 bg-cyan-950/70 border border-cyan-800/60 px-1.5 py-0.5 rounded">
                SOC · DRP
              </span>
            </div>
            <div className="text-[10px] text-slate-400 leading-none mt-0.5 hidden sm:block">Digital Identity Protection Platform</div>
          </div>
        </div>

        {/* Vertical Divider */}
        <div className="h-5 w-px bg-slate-800 hidden md:block" />

        {/* Active Protected Brand Switcher */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 bg-slate-900/90 hover:bg-slate-850 border border-slate-800 rounded-lg text-xs font-medium text-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 cursor-pointer"
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span className="text-slate-400 hidden sm:inline">Target:</span>
            <span className="text-white font-semibold max-w-[110px] sm:max-w-[160px] truncate">
              {activeBrand?.name || 'Select Brand'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>

          {dropdownOpen && (
            <div
              className="absolute left-0 mt-1.5 w-64 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl py-1 z-50 text-xs"
              role="menu"
            >
              <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Protected Brand Registry
              </div>
              {brands.map(b => (
                <button
                  key={b.id}
                  onClick={() => {
                    onSelectBrand(b.id);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:bg-slate-800 ${
                    activeBrand?.id === b.id ? 'bg-slate-800/60 text-cyan-400 font-semibold' : 'text-slate-300'
                  }`}
                  role="menuitem"
                >
                  <div className="truncate pr-2">
                    <div className="font-medium text-slate-100">{b.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono truncate">{b.normalized_domain}</div>
                  </div>
                  {activeBrand?.id === b.id && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                </button>
              ))}
              <div className="border-t border-slate-800 mt-1 pt-1">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onOpenRegisterModal();
                  }}
                  className="w-full text-left px-3 py-2 flex items-center gap-2 text-cyan-400 hover:bg-slate-800 transition-colors font-medium focus-visible:outline-none focus-visible:bg-slate-800 cursor-pointer"
                  role="menuitem"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Register New Brand</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Demo Reset / Benchmark Load */}
        <button
          onClick={onLoadDemo}
          title="Reload synthetic benchmark dataset"
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs text-slate-300 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
        >
          <RefreshCw className="w-3 h-3 text-slate-400" />
          <span>Reload Benchmark</span>
        </button>

        {/* Start Scan Button */}
        <button
          onClick={onOpenScanModal}
          disabled={isScanning || !activeBrand}
          className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium rounded-lg text-xs shadow-sm shadow-cyan-950 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          {isScanning ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-200" />
              <span className="hidden sm:inline">Analyzing Feeds...</span>
              <span className="sm:hidden">Scanning...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Scan</span>
            </>
          )}
        </button>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
