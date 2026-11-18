import React from 'react';
import {
  RotateCcw,
  Building2,
  Globe,
  Clock,
  PoundSterling,
  ArrowRight,
  Info,
  Users,
} from 'lucide-react';
import { useOperations } from '../../context/OperationsContext';
import { OPERATING_AREAS, SERVICE_CATEGORIES } from '../../utils/formatters';

const WORKFLOW_GUIDE_STEPS = [
  {
    step: '01',
    title: 'How enquiries enter the system',
    description:
      'Domestic booking requests and commercial quote forms from abecleaner.com—alongside phone or email leads—are logged into the Enquiries workspace with service type, area, and priority.',
    target: 'enquiries' as const,
    cta: 'Open Enquiries',
  },
  {
    step: '02',
    title: 'How staff review an enquiry',
    description:
      'Coordinators open the enquiry drawer to assign a team member, log internal notes, and progress commercial requests across the Kanban Commercial Pipeline.',
    target: 'pipeline' as const,
    cta: 'Open Pipeline',
  },
  {
    step: '03',
    title: 'How site visits are arranged',
    description:
      'For offices, clinics, or specialist jobs requiring inspection, staff schedule an assessor in the Site Visits calendar and record hours, access codes, and equipment notes.',
    target: 'visits' as const,
    cta: 'Open Site Visits',
  },
  {
    step: '04',
    title: 'How quotations are created',
    description:
      'Completed site visits pre-fill the Quotation builder with estimated hours and scope. Staff adjust illustrative GBP rates, add optional extras, apply VAT, and export a formatted PDF.',
    target: 'quotations' as const,
    cta: 'Open Quotations',
  },
  {
    step: '05',
    title: 'How follow-ups are generated',
    description:
      'Marking a quotation "Sent (Demo)" offers a 2-day follow-up reminder automatically. Overdue tasks surface in the Follow-up Centre and Executive Overview.',
    target: 'followups' as const,
    cta: 'Open Follow-ups',
  },
  {
    step: '06',
    title: 'How accepted quotes become scheduled jobs',
    description:
      'Once a quote is marked Accepted, a single click opens Jobs & Scheduling pre-populated with customer details, hours, and recurrence so a cleaning squad can be assigned.',
    target: 'jobs' as const,
    cta: 'Open Scheduling',
  },
];

export const SettingsGuideView: React.FC = () => {
  const { state, updateSettings, resetDemoData, requestConfirm, navigateTo } = useOperations();

  const handleReset = () => {
    requestConfirm({
      title: 'Reset all demo data?',
      description:
        'This restores the original fictional sample enquiries, commercial opportunities, quotations, site visits, jobs, and follow-ups.',
      confirmLabel: 'Restore Seed Data',
      variant: 'danger',
      onConfirm: () => resetDemoData(),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Disclosure */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-[#0F1B3D]">
            Settings & Demo Guide
          </h1>
          <p className="text-sm text-[#647087]">
            Concept configuration, operational workflow walkthrough, and sample data management.
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-4 py-2 text-xs font-semibold text-[#B91C1C] hover:bg-[#FEE2E2] transition-colors whitespace-nowrap self-start cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset Demo Data</span>
        </button>
      </div>

      {/* Explicit Concept Disclosure */}
      <div className="flex items-start gap-3 rounded-xl border border-[#DECFA8] bg-[#F7F2E7] p-4 text-sm text-[#0F1B3D]">
        <Info className="h-5 w-5 text-[#8A6A2C] shrink-0 mt-0.5" />
        <div>
          <p className="font-display font-bold">
            This is an interactive concept prototype with fictional data. It is not connected to
            ABE Cleaning&apos;s live systems.
          </p>
          <p className="mt-1 text-xs text-[#2C3752] leading-relaxed">
            Prepared by Zayvo AI Studio to demonstrate how ABE Cleaning Services could organise
            enquiries, commercial quotes, site visits, job scheduling, and follow-up communication in
            one unified workspace alongside their existing website booking system.
          </p>
        </div>
      </div>

      {/* 6-Step Operations Guide */}
      <section className="rounded-xl border border-[#E8EAF0] bg-white p-5">
        <h2 className="font-display text-base font-bold text-[#0F1B3D]">
          End-to-End Operations Workflow Guide
        </h2>
        <p className="mt-0.5 text-xs text-[#647087]">
          Follow the connected lifecycle across the prototype using the quick links below.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-3">
          {WORKFLOW_GUIDE_STEPS.map((item) => (
            <div
              key={item.step}
              className="flex flex-col justify-between rounded-xl border border-[#E8EAF0] bg-[#F7F8FA] p-4"
            >
              <div>
                <span className="font-mono-tabular text-xs font-bold text-[#8A6A2C]">
                  Step {item.step}
                </span>
                <h3 className="mt-1 font-display text-sm font-bold text-[#0F1B3D]">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-[#2C3752]">
                  {item.description}
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigateTo(item.target)}
                className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#8A6A2C] hover:text-[#0F1B3D] cursor-pointer"
              >
                <span>{item.cta}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Business Profile + Demo Preferences Grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Business Profile */}
        <section className="rounded-xl border border-[#E8EAF0] bg-white p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-[#EEF0F5] pb-3">
            <Building2 className="h-4 w-4 text-[#8A6A2C]" />
            <h2 className="font-display text-base font-bold text-[#0F1B3D]">
              Company Reference Profile
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[#647087]">Business Name</span>
              <p className="mt-0.5 font-semibold text-[#0F1B3D]">{state.settings.businessName}</p>
            </div>
            <div>
              <span className="text-[#647087]">Website Reference</span>
              <p className="mt-0.5 font-medium text-[#8A6A2C] flex items-center gap-1">
                <Globe className="h-3.5 w-3.5" />
                {state.settings.websiteUrl}
              </p>
            </div>
            <div>
              <span className="text-[#647087]">Currency</span>
              <p className="mt-0.5 font-semibold text-[#0F1B3D] flex items-center gap-1">
                <PoundSterling className="h-3.5 w-3.5 text-[#647087]" />
                {state.settings.currency}
              </p>
            </div>
            <div>
              <span className="text-[#647087]">Timezone</span>
              <p className="mt-0.5 font-semibold text-[#0F1B3D] flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-[#647087]" />
                {state.settings.timezone}
              </p>
            </div>
          </div>

          <div className="border-t border-[#EEF0F5] pt-3 text-xs space-y-2">
            <p className="font-semibold text-[#0F1B3D]">Service Categories</p>
            <p className="text-[#2C3752] leading-relaxed">{SERVICE_CATEGORIES.join(' · ')}</p>
            <p className="font-semibold text-[#0F1B3D] pt-1">Operating Areas</p>
            <p className="text-[#2C3752] leading-relaxed">{OPERATING_AREAS.join(' · ')}</p>
          </div>
        </section>

        {/* Workflow & Notification Rules (Demo) */}
        <section className="rounded-xl border border-[#E8EAF0] bg-white p-5 space-y-4">
          <h2 className="font-display text-base font-bold text-[#0F1B3D] border-b border-[#EEF0F5] pb-3">
            Workflow & Notification Preferences (Demo)
          </h2>

          <div className="space-y-3 text-xs">
            <label className="flex items-start justify-between gap-3 cursor-pointer">
              <div>
                <p className="font-semibold text-[#0F1B3D]">
                  Suggest 2-day follow-up when quote is marked Sent (Demo)
                </p>
                <p className="text-[#647087]">
                  Prompts coordinator to schedule a follow-up task automatically.
                </p>
              </div>
              <input
                type="checkbox"
                checked={state.settings.autoSuggestQuoteFollowUp}
                onChange={(e) =>
                  updateSettings({ autoSuggestQuoteFollowUp: e.target.checked })
                }
                className="mt-1 h-4 w-4 accent-[#0F1B3D]"
              />
            </label>

            <label className="flex items-start justify-between gap-3 cursor-pointer border-t border-[#EEF0F5] pt-3">
              <div>
                <p className="font-semibold text-[#0F1B3D]">
                  Auto-draft site visit confirmation messages
                </p>
                <p className="text-[#647087]">
                  Provides ready-to-copy client confirmation text upon scheduling.
                </p>
              </div>
              <input
                type="checkbox"
                checked={state.settings.autoDraftVisitConfirmation}
                onChange={(e) =>
                  updateSettings({ autoDraftVisitConfirmation: e.target.checked })
                }
                className="mt-1 h-4 w-4 accent-[#0F1B3D]"
              />
            </label>

            <label className="flex items-start justify-between gap-3 cursor-pointer border-t border-[#EEF0F5] pt-3">
              <div>
                <p className="font-semibold text-[#0F1B3D]">
                  Highlight overdue follow-ups on Executive Overview
                </p>
                <p className="text-[#647087]">
                  Dynamically flags pending tasks past their due date.
                </p>
              </div>
              <input
                type="checkbox"
                checked={state.settings.highlightOverdueTasks}
                onChange={(e) =>
                  updateSettings({ highlightOverdueTasks: e.target.checked })
                }
                className="mt-1 h-4 w-4 accent-[#0F1B3D]"
              />
            </label>

            <div className="flex items-center justify-between gap-3 border-t border-[#EEF0F5] pt-3">
              <div>
                <p className="font-semibold text-[#0F1B3D]">Default UK VAT Rate (%)</p>
                <p className="text-[#647087]">Applied when VAT is enabled on new quotes.</p>
              </div>
              <input
                type="number"
                min="0"
                max="30"
                value={state.settings.defaultVatRate}
                onChange={(e) =>
                  updateSettings({ defaultVatRate: parseFloat(e.target.value) || 0 })
                }
                className="w-20 rounded-lg border border-[#E8EAF0] px-2.5 py-1.5 font-mono-tabular text-xs text-right focus:border-[#8A6A2C] focus:outline-none"
              />
            </div>
          </div>
        </section>
      </div>

      {/* Sample Team Directory */}
      <section className="rounded-xl border border-[#E8EAF0] bg-white p-5">
        <div className="flex items-center gap-2 border-b border-[#EEF0F5] pb-3 mb-4">
          <Users className="h-4 w-4 text-[#8A6A2C]" />
          <h2 className="font-display text-base font-bold text-[#0F1B3D]">
            Fictional Operations Team (Sample Data)
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {state.teamMembers.map((member) => (
            <div
              key={member.id}
              className="rounded-lg border border-[#E8EAF0] bg-[#F7F8FA] p-3.5 text-xs"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0F1B3D] font-display text-xs font-bold text-white">
                  {member.initials}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-[#0F1B3D] truncate">{member.name}</p>
                  <p className="text-[11px] text-[#8A6A2C] truncate">{member.role}</p>
                </div>
              </div>
              <p className="mt-2.5 text-[11px] text-[#647087]">Area: {member.areaFocus}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
