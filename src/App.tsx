import React, { useState } from 'react';
import { OperationsProvider, useOperations } from './context/OperationsContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopHeader } from './components/layout/TopHeader';
import { OverviewDashboard } from './components/views/OverviewDashboard';
import { EnquiriesView } from './components/views/EnquiriesView';
import { CommercialPipelineView } from './components/views/CommercialPipelineView';
import { QuotationsView } from './components/views/QuotationsView';
import { SiteVisitsView } from './components/views/SiteVisitsView';
import { JobsSchedulingView } from './components/views/JobsSchedulingView';
import { FollowUpCentreView } from './components/views/FollowUpCentreView';
import { AssistantView } from './components/views/AssistantView';
import { SettingsGuideView } from './components/views/SettingsGuideView';
import { ConfirmDialog } from './components/common/ConfirmDialog';
import { ToastContainer } from './components/common/ToastContainer';

const OperationsWorkspace: React.FC = () => {
  const { activeSection, navigateTo } = useOperations();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return <OverviewDashboard />;
      case 'enquiries':
        return <EnquiriesView />;
      case 'pipeline':
        return <CommercialPipelineView />;
      case 'quotations':
        return <QuotationsView />;
      case 'visits':
        return <SiteVisitsView />;
      case 'jobs':
        return <JobsSchedulingView />;
      case 'followups':
        return <FollowUpCentreView />;
      case 'assistant':
        return <AssistantView />;
      case 'settings':
        return <SettingsGuideView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#0F1B3D]">
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
      />

      <div
        className={`flex min-h-screen flex-col transition-all duration-200 ${
          sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <TopHeader onOpenMobileMenu={() => setMobileMenuOpen(true)} />

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 max-w-[1440px] w-full mx-auto">
          <div key={activeSection}>{renderSection()}</div>
        </main>

        <footer className="border-t border-[#E8EAF0] bg-white/80 px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between text-xs text-[#647087]">
            <p>Concept prepared by Zayvo AI Studio</p>
            <div className="flex items-center gap-3">
              <span>Interactive Concept Demo · Fictional UK Sample Data</span>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => navigateTo('settings')}
                className="font-medium text-[#8A6A2C] hover:text-[#0F1B3D] hover:underline cursor-pointer"
              >
                Workflow Guide &amp; Reset
              </button>
            </div>
          </div>
        </footer>
      </div>

      <ConfirmDialog />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <OperationsProvider>
      <OperationsWorkspace />
    </OperationsProvider>
  );
}
