import React, { useState, useRef, useEffect } from 'react';
import { Menu, Search, Plus, X, ArrowRight } from 'lucide-react';
import { NavigationSection } from '../../types/operations';
import { useOperations } from '../../context/OperationsContext';

interface TopHeaderProps {
  onOpenMobileMenu: () => void;
}

const SECTION_LABELS: Record<NavigationSection, string> = {
  overview: 'Executive Overview',
  enquiries: 'Enquiries',
  pipeline: 'Commercial Pipeline',
  quotations: 'Quotations',
  visits: 'Site Visits & Assessments',
  jobs: 'Jobs & Scheduling',
  followups: 'Follow-up Centre',
  assistant: 'ABE Smart Assistant',
  settings: 'Settings & Demo Guide',
};

export const TopHeader: React.FC<TopHeaderProps> = ({ onOpenMobileMenu }) => {
  const { state, activeSection, navigateTo } = useOperations();
  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const trimmed = query.trim().toLowerCase();

  const matchingEnquiries = trimmed
    ? state.enquiries
        .filter(
          (e) =>
            e.customerName.toLowerCase().includes(trimmed) ||
            (e.companyName && e.companyName.toLowerCase().includes(trimmed)) ||
            e.reference.toLowerCase().includes(trimmed) ||
            e.location.toLowerCase().includes(trimmed) ||
            e.postcode.toLowerCase().includes(trimmed) ||
            e.service.toLowerCase().includes(trimmed)
        )
        .slice(0, 4)
    : [];

  const matchingQuotes = trimmed
    ? state.quotations
        .filter(
          (q) =>
            q.reference.toLowerCase().includes(trimmed) ||
            q.customerName.toLowerCase().includes(trimmed) ||
            (q.companyName && q.companyName.toLowerCase().includes(trimmed)) ||
            q.location.toLowerCase().includes(trimmed)
        )
        .slice(0, 3)
    : [];

  const matchingVisits = trimmed
    ? state.siteVisits
        .filter(
          (v) =>
            v.reference.toLowerCase().includes(trimmed) ||
            v.customerName.toLowerCase().includes(trimmed) ||
            (v.companyName && v.companyName.toLowerCase().includes(trimmed)) ||
            v.location.toLowerCase().includes(trimmed)
        )
        .slice(0, 3)
    : [];

  const hasResults =
    matchingEnquiries.length > 0 || matchingQuotes.length > 0 || matchingVisits.length > 0;

  const getPrimaryAction = () => {
    switch (activeSection) {
      case 'quotations':
        return {
          label: 'New Quote',
          onClick: () =>
            navigateTo('quotations', {
              openCreateQuoteForEnquiryId: state.enquiries[0]?.id,
            }),
        };
      case 'visits':
        return {
          label: 'Schedule Visit',
          onClick: () =>
            navigateTo('visits', {
              openCreateVisitForEnquiryId: state.enquiries[0]?.id,
            }),
        };
      case 'jobs':
        return {
          label: 'Schedule Job',
          onClick: () => navigateTo('jobs', { openCreateJobFromQuoteId: 'new' }),
        };
      case 'followups':
        return {
          label: 'Add Follow-up',
          onClick: () =>
            navigateTo('followups', {
              openCreateFollowUpForEnquiryId: state.enquiries[0]?.id,
            }),
        };
      default:
        return {
          label: 'New Enquiry',
          onClick: () => navigateTo('enquiries', { openCreateEnquiry: true }),
        };
    }
  };

  const primaryAction = getPrimaryAction();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-[#E8EAF0] bg-white/95 px-4 sm:px-6 backdrop-blur-xs">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#E8EAF0] text-[#0F1B3D] hover:bg-[#F7F8FA] lg:hidden shrink-0 cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm text-[#647087] whitespace-nowrap">
            <span className="hidden sm:inline">Operations Hub</span>
            <span className="hidden sm:inline text-[#8A6A2C]" aria-hidden="true">
              /
            </span>
            <span className="font-display font-semibold text-[#0F1B3D] truncate">
              {SECTION_LABELS[activeSection]}
            </span>
          </div>
        </div>
      </div>

      {/* Global Search */}
      <div ref={searchRef} className="relative flex-1 max-w-md hidden md:block">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#647087]" />
          <input
            type="search"
            value={query}
            onFocus={() => setSearchFocused(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setSearchFocused(true);
            }}
            placeholder="Search client, postcode, quote or reference..."
            aria-label="Search operations hub"
            className="w-full rounded-lg border border-[#E8EAF0] bg-[#F7F8FA] py-2 pl-9 pr-8 text-sm text-[#0F1B3D] placeholder-[#647087] focus:border-[#0F1B3D] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F1B3D]/12 transition-colors"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#647087] hover:text-[#0F1B3D]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {searchFocused && trimmed.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1.5 rounded-xl border border-[#E8EAF0] bg-white p-2 shadow-lg z-40 max-h-96 overflow-y-auto">
            {!hasResults ? (
              <p className="px-3 py-4 text-center text-xs text-[#647087]">
                No matching records found for &ldquo;{query}&rdquo;.
              </p>
            ) : (
              <div className="space-y-2">
                {matchingEnquiries.length > 0 && (
                  <div>
                    <p className="px-2.5 py-1 text-[11px] font-semibold text-[#8A6A2C]">
                      Enquiries
                    </p>
                    {matchingEnquiries.map((e) => (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => {
                          navigateTo('enquiries', { selectedEnquiryId: e.id });
                          setSearchFocused(false);
                          setQuery('');
                        }}
                        className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs hover:bg-[#F7F8FA] transition-colors cursor-pointer"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-[#0F1B3D] truncate">
                            {e.companyName ? `${e.companyName} (${e.customerName})` : e.customerName}
                          </p>
                          <p className="text-[#647087] truncate">
                            <span className="font-mono-tabular">{e.reference}</span> · {e.service} ·{' '}
                            {e.location}
                          </p>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-[#8A6A2C] shrink-0 ml-2" />
                      </button>
                    ))}
                  </div>
                )}

                {matchingQuotes.length > 0 && (
                  <div className="border-t border-[#E8EAF0] pt-1.5">
                    <p className="px-2.5 py-1 text-[11px] font-semibold text-[#8A6A2C]">
                      Quotations
                    </p>
                    {matchingQuotes.map((q) => (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => {
                          navigateTo('quotations', { selectedQuoteId: q.id });
                          setSearchFocused(false);
                          setQuery('');
                        }}
                        className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs hover:bg-[#F7F8FA] transition-colors cursor-pointer"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-[#0F1B3D] truncate">
                            {q.companyName || q.customerName}
                          </p>
                          <p className="text-[#647087] truncate">
                            <span className="font-mono-tabular">{q.reference}</span> · {q.status}
                          </p>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-[#8A6A2C] shrink-0 ml-2" />
                      </button>
                    ))}
                  </div>
                )}

                {matchingVisits.length > 0 && (
                  <div className="border-t border-[#E8EAF0] pt-1.5">
                    <p className="px-2.5 py-1 text-[11px] font-semibold text-[#8A6A2C]">
                      Site Visits
                    </p>
                    {matchingVisits.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          navigateTo('visits', { selectedVisitId: v.id });
                          setSearchFocused(false);
                          setQuery('');
                        }}
                        className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs hover:bg-[#F7F8FA] transition-colors cursor-pointer"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-[#0F1B3D] truncate">
                            {v.companyName || v.customerName}
                          </p>
                          <p className="text-[#647087] truncate">
                            <span className="font-mono-tabular">{v.reference}</span> · {v.date} at{' '}
                            {v.time}
                          </p>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-[#8A6A2C] shrink-0 ml-2" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Contextual Primary Action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={primaryAction.onClick}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F1B3D] px-4 py-2 text-xs sm:text-sm font-medium text-white hover:bg-[#1A2B5C] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="h-4 w-4 text-[#DEC896] shrink-0" />
          <span>{primaryAction.label}</span>
        </button>
      </div>
    </header>
  );
};
