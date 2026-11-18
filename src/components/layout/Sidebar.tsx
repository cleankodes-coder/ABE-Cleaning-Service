import React from 'react';
import {
  LayoutDashboard,
  Inbox,
  Kanban,
  FileSpreadsheet,
  MapPin,
  CalendarDays,
  BellRing,
  Sparkles,
  Settings,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { NavigationSection } from '../../types/operations';
import { useOperations } from '../../context/OperationsContext';
import { getTodayISODate } from '../../utils/formatters';
import { BrandLogo } from '../common/BrandLogo';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  mobileOpen,
  onCloseMobile,
  collapsed,
  onToggleCollapse,
}) => {
  const { state, activeSection, navigateTo } = useOperations();
  const today = getTodayISODate();

  const newEnquiryCount = state.enquiries.filter((e) => e.status === 'New').length;
  const dueFollowUpsCount = state.followUps.filter(
    (f) => f.status === 'Pending' && f.dueDate <= today
  ).length;
  const pendingQuotesCount = state.quotations.filter(
    (q) => q.status === 'Draft' || q.status === 'Ready for Review' || q.status === 'Sent (Demo)'
  ).length;

  const navItems: {
    id: NavigationSection;
    label: string;
    icon: React.ReactNode;
    count?: number;
  }[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <LayoutDashboard className="h-[18px] w-[18px]" />,
    },
    {
      id: 'enquiries',
      label: 'Enquiries',
      icon: <Inbox className="h-[18px] w-[18px]" />,
      count: newEnquiryCount > 0 ? newEnquiryCount : undefined,
    },
    {
      id: 'pipeline',
      label: 'Commercial Pipeline',
      icon: <Kanban className="h-[18px] w-[18px]" />,
    },
    {
      id: 'quotations',
      label: 'Quotations',
      icon: <FileSpreadsheet className="h-[18px] w-[18px]" />,
      count: pendingQuotesCount > 0 ? pendingQuotesCount : undefined,
    },
    {
      id: 'visits',
      label: 'Site Visits',
      icon: <MapPin className="h-[18px] w-[18px]" />,
    },
    {
      id: 'jobs',
      label: 'Jobs & Scheduling',
      icon: <CalendarDays className="h-[18px] w-[18px]" />,
    },
    {
      id: 'followups',
      label: 'Follow-up Centre',
      icon: <BellRing className="h-[18px] w-[18px]" />,
      count: dueFollowUpsCount > 0 ? dueFollowUpsCount : undefined,
    },
    {
      id: 'assistant',
      label: 'AI Assistant',
      icon: <Sparkles className="h-[18px] w-[18px]" />,
    },
    {
      id: 'settings',
      label: 'Settings & Demo Guide',
      icon: <Settings className="h-[18px] w-[18px]" />,
    },
  ];

  const handleSelect = (id: NavigationSection) => {
    navigateTo(id);
    onCloseMobile();
  };

  const renderNavContent = (isCollapsed: boolean, isMobile = false) => (
    <div className="flex h-full flex-col bg-[#0F1B3D] text-white border-r border-[#1C2B54]">
      {/* Official Wordmark Plate (White surface for exact #0F1B3D + #8A6A2C fidelity) */}
      <div
        className={`flex h-16 items-center border-b border-[#E8EAF0] bg-white ${
          isCollapsed ? 'justify-center px-2' : 'justify-between px-5'
        }`}
      >
        <BrandLogo compact={isCollapsed} />

        {isMobile ? (
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation"
            className="rounded-lg p-1.5 text-[#647087] hover:bg-[#F7F8FA] hover:text-[#0F1B3D] cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        ) : (
          !isCollapsed && (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
              className="hidden lg:inline-flex rounded-lg p-1.5 text-[#647087] hover:bg-[#F7F8FA] hover:text-[#0F1B3D] transition-colors cursor-pointer"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          )
        )}
      </div>

      {/* Sub-header below official logo */}
      {isCollapsed ? (
        <div className="flex justify-center pt-3 pb-1">
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Expand sidebar"
            title="Expand sidebar"
            className="rounded-lg p-1.5 text-white/75 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="px-5 pt-4 pb-2 border-b border-white/10">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-[#DEC896]">
            OPERATIONS HUB
          </p>
          <p className="mt-0.5 text-[11px] text-white/65">Interactive Concept Demo</p>
        </div>
      )}

      {/* Navigation Items */}
      <nav
        className={`flex-1 overflow-y-auto py-3 space-y-1 ${isCollapsed ? 'px-2' : 'px-3'}`}
        aria-label="Main navigation"
      >
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              title={isCollapsed ? item.label : undefined}
              onClick={() => handleSelect(item.id)}
              className={`group flex w-full items-center rounded-lg py-2.5 text-left text-[13px] font-medium transition-colors cursor-pointer ${
                isCollapsed ? 'justify-center px-2' : 'justify-between px-3'
              } ${
                isActive
                  ? 'bg-white/12 text-white border border-[#8A6A2C] font-semibold'
                  : 'text-white/80 border border-transparent hover:bg-white/8 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-3 min-w-0">
                <span
                  className={`shrink-0 transition-colors ${
                    isActive
                      ? 'text-[#E3C685]'
                      : 'text-white/65 group-hover:text-[#E3C685]'
                  }`}
                >
                  {item.icon}
                </span>
                {!isCollapsed && <span className="truncate whitespace-nowrap">{item.label}</span>}
              </span>
              {!isCollapsed && item.count !== undefined && (
                <span
                  className={`ml-2 shrink-0 rounded px-1.5 py-0.5 text-[11px] font-mono-tabular tabular-nums ${
                    isActive
                      ? 'bg-[#8A6A2C] text-white font-semibold'
                      : 'bg-white/10 text-white/85'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Operating Coverage Card */}
      {!isCollapsed && (
        <div className="border-t border-white/10 px-4 py-4">
          <div className="rounded-lg bg-white/8 p-3 border border-white/12">
            <p className="text-[11.5px] font-semibold text-[#DEC896]">Operating Coverage</p>
            <p className="mt-1 text-[11px] leading-relaxed text-white/75">
              Islington · King&apos;s Cross · Euston · Willesden · Harrow · Watford · St Albans
            </p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop collapsible sidebar */}
      <aside
        className={`hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:block transition-all duration-200 ${
          collapsed ? 'lg:w-20' : 'lg:w-64'
        }`}
      >
        {renderNavContent(collapsed, false)}
      </aside>

      {/* Mobile slide-over */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-[#0F1B3D]/50 backdrop-blur-[1px]"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] shadow-xl">
            {renderNavContent(false, true)}
          </aside>
        </div>
      )}
    </>
  );
};
