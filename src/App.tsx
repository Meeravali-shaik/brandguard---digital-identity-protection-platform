import React, { useState, useEffect } from 'react';
import { Brand, Finding, ScanSummary, ReviewStatus } from './types/brandguard';
import { apiClient, BackendStatus } from './services/apiClient';
import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { EnvironmentNotice } from './components/EnvironmentNotice';
import { EvidenceModal } from './components/EvidenceModal';
import { TakedownReportModal } from './components/TakedownReportModal';
import { RegisterBrandModal } from './components/RegisterBrandModal';
import { StartScanModal } from './components/StartScanModal';

import { OverviewPage } from './pages/OverviewPage';
import { BrandsPage } from './pages/BrandsPage';
import { SocialMonitoringPage } from './pages/SocialMonitoringPage';
import { AppMonitoringPage } from './pages/AppMonitoringPage';
import { FindingsPage } from './pages/FindingsPage';
import { ScansSourcesPage } from './pages/ScansSourcesPage';
import { EvaluationPage } from './pages/EvaluationPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [brands, setBrands] = useState<Brand[]>([]);
  const [activeBrandId, setActiveBrandId] = useState<string>('');
  const [findings, setFindings] = useState<Finding[]>([]);
  const [scans, setScans] = useState<ScanSummary[]>([]);
  const [backendStatus, setBackendStatus] = useState<BackendStatus>(apiClient.getStatus());

  // Modals state
  const [evidenceFinding, setEvidenceFinding] = useState<Finding | null>(null);
  const [reportFinding, setReportFinding] = useState<Finding | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Load Initial Data
  const reloadData = async (brandIdToUse?: string) => {
    const fetchedBrands = await apiClient.getBrands();
    setBrands(fetchedBrands);

    const storedActive = apiClient.getActiveBrandId();
    const bId = brandIdToUse || activeBrandId || storedActive || fetchedBrands[0]?.id || '';
    setActiveBrandId(bId);
    apiClient.setActiveBrandId(bId);

    if (bId) {
      await apiClient.ensureInitialScan(bId);
      const [fList, sList] = await Promise.all([
        apiClient.getFindings({ brandId: bId }),
        apiClient.getScans(bId)
      ]);
      setFindings(fList);
      setScans(sList);
    }

    const stat = await apiClient.checkHealth();
    setBackendStatus(stat);
  };

  useEffect(() => {
    reloadData();
  }, []);

  const activeBrand = brands.find(b => b.id === activeBrandId) || brands[0] || null;

  const handleSelectBrand = async (brandId: string) => {
    setActiveBrandId(brandId);
    apiClient.setActiveBrandId(brandId);
    await reloadData(brandId);
  };

  const handleStartScan = async (brandId: string, sources?: string[]) => {
    setIsScanning(true);
    try {
      await apiClient.triggerScan(brandId, { selectedSources: sources });
      const [fList, sList] = await Promise.all([
        apiClient.getFindings({ brandId }),
        apiClient.getScans(brandId)
      ]);
      setFindings(fList);
      setScans(sList);
    } finally {
      setIsScanning(false);
    }
  };

  const handleUpdateStatus = async (findingId: string, status: ReviewStatus, notes?: string) => {
    const updated = await apiClient.updateFindingReview(findingId, status, notes);
    if (updated) {
      setFindings(prev => prev.map(f => f.id === findingId ? updated : f));
      if (evidenceFinding && evidenceFinding.id === findingId) {
        setEvidenceFinding(updated);
      }
    }
  };

  const handleLoadDemo = async () => {
    await apiClient.resetDemoData();
    await reloadData();
  };

  const handleBrandCreated = (newBrand: Brand) => {
    setBrands(prev => [...prev, newBrand]);
    setActiveBrandId(newBrand.id);
    apiClient.setActiveBrandId(newBrand.id);
    reloadData(newBrand.id);
  };

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans ${theme}`}>
      {/* Top Navbar */}
      <Navbar
        brands={brands}
        activeBrand={activeBrand}
        onSelectBrand={handleSelectBrand}
        onOpenRegisterModal={() => setShowRegisterModal(true)}
        onOpenScanModal={() => setShowScanModal(true)}
        onLoadDemo={handleLoadDemo}
        backendStatus={backendStatus}
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        isScanning={isScanning}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
      />

      {/* Architecture Environment Notice */}
      <EnvironmentNotice
        status={backendStatus}
        onNavigateSettings={() => setCurrentTab('settings')}
        onRecheckHealth={async () => {
          const s = await apiClient.checkHealth();
          setBackendStatus(s);
        }}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Responsive Desktop & Mobile Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          findingsCount={findings.length}
          isOpenMobile={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto pb-12">
            {currentTab === 'overview' && (
              <OverviewPage
                brand={activeBrand}
                findings={findings}
                scans={scans}
                onOpenScanModal={() => setShowScanModal(true)}
                onOpenEvidence={setEvidenceFinding}
                onNavigateTab={setCurrentTab}
                onLoadDemo={handleLoadDemo}
              />
            )}

            {currentTab === 'brands' && (
              <BrandsPage
                brand={activeBrand}
                onOpenRegisterModal={() => setShowRegisterModal(true)}
                onRefreshBrand={() => reloadData()}
                onUpdateBrand={async (brandId, updates) => {
                  await apiClient.updateBrand(brandId, updates);
                  await reloadData();
                }}
                onDeleteBrand={async (brandId) => {
                  await apiClient.deleteBrand(brandId);
                  await reloadData();
                }}
              />
            )}

            {currentTab === 'social' && (
              <SocialMonitoringPage
                findings={findings}
                onOpenEvidence={setEvidenceFinding}
              />
            )}

            {currentTab === 'apps' && (
              <AppMonitoringPage
                findings={findings}
                onOpenEvidence={setEvidenceFinding}
              />
            )}

            {currentTab === 'findings' && (
              <FindingsPage
                findings={findings}
                onOpenEvidence={setEvidenceFinding}
                onOpenReport={setReportFinding}
                onQuickUpdateStatus={async (id, st) => handleUpdateStatus(id, st)}
              />
            )}

            {currentTab === 'scans' && (
              <ScansSourcesPage
                scans={scans}
                brand={activeBrand}
                onOpenScanModal={() => setShowScanModal(true)}
              />
            )}

            {currentTab === 'evaluation' && (
              <EvaluationPage />
            )}

            {currentTab === 'settings' && (
              <SettingsPage
                status={backendStatus}
                onRefreshStatus={async () => {
                  const s = await apiClient.checkHealth();
                  setBackendStatus(s);
                }}
                onResetDemo={handleLoadDemo}
                theme={theme}
                onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              />
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      <EvidenceModal
        finding={evidenceFinding}
        onClose={() => setEvidenceFinding(null)}
        onUpdateStatus={handleUpdateStatus}
        onOpenReport={f => {
          setEvidenceFinding(null);
          setReportFinding(f);
        }}
      />

      <TakedownReportModal
        finding={reportFinding}
        onClose={() => setReportFinding(null)}
      />

      {showRegisterModal && (
        <RegisterBrandModal
          onClose={() => setShowRegisterModal(false)}
          onBrandCreated={handleBrandCreated}
        />
      )}

      {showScanModal && (
        <StartScanModal
          brand={activeBrand}
          onClose={() => setShowScanModal(false)}
          onStartScan={handleStartScan}
        />
      )}
    </div>
  );
}
