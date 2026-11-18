import React, { useState, useMemo } from 'react';
import {
  Building2,
  MapPin,
  Calendar,
  FileSpreadsheet,
  BellRing,
  X,
  CheckCircle2,
  XCircle,
  GripVertical,
} from 'lucide-react';
import { CommercialOpportunity, CommercialStage } from '../../types/operations';
import { useOperations } from '../../context/OperationsContext';
import { formatGBP, formatGBPCompact } from '../../utils/formatters';
import { PriorityLabel, StatusBadge } from '../common/StatusBadge';

const PIPELINE_COLUMNS: {
  id: string;
  label: string;
  stages: CommercialStage[];
  targetDropStage: CommercialStage;
}[] = [
  { id: 'col-1', label: 'New Request', stages: ['New Request'], targetDropStage: 'New Request' },
  {
    id: 'col-2',
    label: 'Requirements Review',
    stages: ['Requirements Review'],
    targetDropStage: 'Requirements Review',
  },
  {
    id: 'col-3',
    label: 'Site Visit Needed',
    stages: ['Site Visit Needed'],
    targetDropStage: 'Site Visit Needed',
  },
  {
    id: 'col-4',
    label: 'Quotation Preparation',
    stages: ['Quotation Preparation'],
    targetDropStage: 'Quotation Preparation',
  },
  { id: 'col-5', label: 'Quote Sent', stages: ['Quote Sent'], targetDropStage: 'Quote Sent' },
  {
    id: 'col-6',
    label: 'Client Decision',
    stages: ['Client Decision'],
    targetDropStage: 'Client Decision',
  },
  { id: 'col-7', label: 'Won / Lost', stages: ['Won', 'Lost'], targetDropStage: 'Won' },
];

const ALL_STAGES: CommercialStage[] = [
  'New Request',
  'Requirements Review',
  'Site Visit Needed',
  'Quotation Preparation',
  'Quote Sent',
  'Client Decision',
  'Won',
  'Lost',
];

export const CommercialPipelineView: React.FC = () => {
  const { state, moveOpportunityStage, addEnquiryNote, navigateTo, getMemberName } =
    useOperations();

  const [selectedOppId, setSelectedOppId] = useState<string | null>(null);
  const [draggedOppId, setDraggedOppId] = useState<string | null>(null);
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);
  const [activityNote, setActivityNote] = useState('');

  const selectedOpp = useMemo(
    () => state.opportunities.find((o) => o.id === selectedOppId) || null,
    [state.opportunities, selectedOppId]
  );

  const selectedOppQuotes = useMemo(
    () =>
      selectedOpp
        ? state.quotations.filter((q) => q.enquiryId === selectedOpp.enquiryId)
        : [],
    [state.quotations, selectedOpp]
  );

  const totalPipelineValue = useMemo(
    () =>
      state.opportunities
        .filter((o) => o.stage !== 'Lost')
        .reduce((sum, o) => sum + (o.estimatedMonthlyValue || 0), 0),
    [state.opportunities]
  );

  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOpp || !activityNote.trim()) return;
    addEnquiryNote(selectedOpp.enquiryId, activityNote.trim());
    setActivityNote('');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-[#0F1B3D]">
            Commercial Cleaning Pipeline
          </h1>
          <p className="text-sm text-[#647087]">
            Manage commercial, office, and specialist contracts from initial specification to decision.
          </p>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-[#E8EAF0] bg-white px-4 py-2.5 text-xs">
          <div>
            <span className="text-[#647087]">Active Opportunities</span>
            <p className="font-display text-base font-bold text-[#0F1B3D] tabular-nums">
              {state.opportunities.length}
            </p>
          </div>
          <div className="h-8 w-px bg-[#E8EAF0]" />
          <div>
            <span className="text-[#647087]">Est. Monthly Value (Demo)</span>
            <p className="font-display text-base font-bold text-[#8A6A2C] tabular-nums">
              {formatGBPCompact(totalPipelineValue)}/mo
            </p>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-3.5 min-w-[1260px]">
          {PIPELINE_COLUMNS.map((col) => {
            const colItems = state.opportunities.filter((o) => col.stages.includes(o.stage));
            const isOver = dragOverColId === col.id;

            return (
              <div
                key={col.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverColId(col.id);
                }}
                onDragLeave={() => setDragOverColId(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverColId(null);
                  if (draggedOppId) {
                    moveOpportunityStage(draggedOppId, col.targetDropStage);
                    setDraggedOppId(null);
                  }
                }}
                className={`flex w-72 shrink-0 flex-col rounded-xl border p-3 transition-colors ${
                  isOver
                    ? 'border-[#8A6A2C] bg-[#EEF1F7]/70'
                    : 'border-[#E8EAF0] bg-[#F1F3F7]'
                }`}
              >
                <div className="mb-3 flex items-center justify-between px-1">
                  <h2 className="font-display text-xs font-bold text-[#0F1B3D]">
                    {col.label}
                  </h2>
                  <span className="font-mono-tabular text-xs font-semibold text-[#647087]">
                    {colItems.length}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1">
                  {colItems.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-[#D5D9E4] p-4 text-center text-[11.5px] text-[#647087]">
                      Drop card here or use stage selector
                    </div>
                  ) : (
                    colItems.map((opp: CommercialOpportunity) => (
                      <div
                        key={opp.id}
                        draggable
                        onDragStart={() => setDraggedOppId(opp.id)}
                        onDragEnd={() => {
                          setDraggedOppId(null);
                          setDragOverColId(null);
                        }}
                        onClick={() => setSelectedOppId(opp.id)}
                        className="group cursor-pointer rounded-lg border border-[#E8EAF0] bg-white p-3.5 shadow-2xs transition-all hover:border-[#8A6A2C]/60"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-mono-tabular text-[11px] text-[#647087]">
                            {opp.reference} · {opp.location}
                          </span>
                          <GripVertical className="h-3.5 w-3.5 text-[#9CA5B5] shrink-0" />
                        </div>

                        <h3 className="mt-1 font-display text-sm font-semibold text-[#0F1B3D] leading-snug">
                          {opp.companyName}
                        </h3>

                        <p className="mt-1 text-xs text-[#2C3752]">
                          {opp.cleaningType} · {opp.frequency}
                        </p>

                        <div className="mt-2.5 flex items-center justify-between gap-2">
                          {opp.estimatedMonthlyValue ? (
                            <span className="font-mono-tabular text-xs font-semibold text-[#8A6A2C]">
                              ~{formatGBPCompact(opp.estimatedMonthlyValue)}/mo
                            </span>
                          ) : (
                            <span className="text-[11px] text-[#647087]">Value TBC</span>
                          )}
                          <PriorityLabel priority={opp.priority} />
                        </div>

                        {(opp.stage === 'Won' || opp.stage === 'Lost') && (
                          <div className="mt-2">
                            <StatusBadge status={opp.stage} />
                          </div>
                        )}

                        <div className="mt-2.5 border-t border-[#EEF0F5] pt-2.5 space-y-2">
                          <p className="text-[11.5px] text-[#647087] line-clamp-2">
                            <span className="font-medium text-[#0F1B3D]">Next:</span>{' '}
                            {opp.nextAction}
                          </p>
                          <div
                            className="flex items-center justify-between gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="text-[11px] text-[#647087] truncate">
                              {getMemberName(opp.assignedToId)}
                            </span>
                            <select
                              aria-label={`Move ${opp.companyName} stage`}
                              value={opp.stage}
                              onChange={(e) =>
                                moveOpportunityStage(
                                  opp.id,
                                  e.target.value as CommercialStage
                                )
                              }
                              className="rounded border border-[#E8EAF0] bg-[#F7F8FA] px-1.5 py-0.5 text-[11px] text-[#0F1B3D] focus:border-[#8A6A2C] focus:outline-none"
                            >
                              {ALL_STAGES.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Commercial Detail Drawer */}
      {selectedOpp && (
        <div className="fixed inset-0 z-40 flex justify-end bg-[#0F1B3D]/40 backdrop-blur-[1px]">
          <div className="flex h-full w-full max-w-xl flex-col bg-white shadow-2xl border-l border-[#E8EAF0]">
            <div className="flex items-start justify-between gap-4 border-b border-[#EEF0F5] px-6 py-4">
              <div className="min-w-0">
                <p className="font-mono-tabular text-xs font-semibold text-[#8A6A2C]">
                  {selectedOpp.reference} · Commercial Opportunity
                </p>
                <h2 className="mt-0.5 font-display text-lg font-bold text-[#0F1B3D] truncate">
                  {selectedOpp.companyName}
                </h2>
                <p className="text-xs text-[#647087]">
                  Contact: {selectedOpp.contactName} · {selectedOpp.location} ({selectedOpp.postcode})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOppId(null)}
                aria-label="Close detail panel"
                className="rounded-lg p-1.5 text-[#647087] hover:bg-[#F7F8FA] cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* Stage Transition Bar */}
              <div className="rounded-xl bg-[#F7F8FA] p-4 border border-[#E8EAF0] space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11.5px] font-semibold text-[#647087]">Pipeline Stage</p>
                    <select
                      value={selectedOpp.stage}
                      onChange={(e) =>
                        moveOpportunityStage(selectedOpp.id, e.target.value as CommercialStage)
                      }
                      className="mt-1 rounded-lg border border-[#E8EAF0] bg-white px-3 py-1.5 text-xs font-semibold text-[#0F1B3D] focus:border-[#8A6A2C] focus:outline-none"
                    >
                      {ALL_STAGES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => moveOpportunityStage(selectedOpp.id, 'Won')}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#0F1B3D] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1A2B5C] cursor-pointer"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Mark Won</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => moveOpportunityStage(selectedOpp.id, 'Lost')}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3 py-1.5 text-xs font-medium text-[#B91C1C] hover:bg-[#FEE2E2] cursor-pointer"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      <span>Mark Lost</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    navigateTo('visits', {
                      openCreateVisitForEnquiryId: selectedOpp.enquiryId,
                    })
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#E8EAF0] bg-white px-3 py-1.5 text-xs font-medium text-[#0F1B3D] hover:bg-[#F7F2E7] cursor-pointer"
                >
                  <Calendar className="h-3.5 w-3.5 text-[#8A6A2C]" />
                  <span>Schedule Site Visit</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    navigateTo('quotations', {
                      openCreateQuoteForEnquiryId: selectedOpp.enquiryId,
                    })
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F1B3D] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1A2B5C] cursor-pointer"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  <span>Create Quotation</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    navigateTo('followups', {
                      openCreateFollowUpForEnquiryId: selectedOpp.enquiryId,
                    })
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#E8EAF0] bg-white px-3 py-1.5 text-xs font-medium text-[#0F1B3D] hover:bg-[#F7F2E7] cursor-pointer"
                >
                  <BellRing className="h-3.5 w-3.5 text-[#8A6A2C]" />
                  <span>Create Follow-up</span>
                </button>
              </div>

              {/* Commercial Specification Grid */}
              <div className="grid grid-cols-2 gap-3.5 border-t border-[#EEF0F5] pt-4 text-xs">
                <div>
                  <span className="text-[#647087]">Building Type</span>
                  <p className="mt-0.5 font-semibold text-[#0F1B3D] flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-[#8A6A2C]" />
                    {selectedOpp.buildingType}
                  </p>
                </div>
                <div>
                  <span className="text-[#647087]">Number of Sites</span>
                  <p className="mt-0.5 font-semibold text-[#0F1B3D] tabular-nums">
                    {selectedOpp.numberOfSites} site{selectedOpp.numberOfSites > 1 ? 's' : ''}
                  </p>
                </div>
                <div>
                  <span className="text-[#647087]">Approx. Floor Area</span>
                  <p className="mt-0.5 font-semibold text-[#0F1B3D] tabular-nums">
                    {selectedOpp.approxFloorAreaSqFt.toLocaleString('en-GB')} sq ft
                  </p>
                </div>
                <div>
                  <span className="text-[#647087]">Rooms / Floors</span>
                  <p className="mt-0.5 font-semibold text-[#0F1B3D]">
                    {selectedOpp.roomsOrFloors}
                  </p>
                </div>
                <div>
                  <span className="text-[#647087]">Preferred Cleaning Hours</span>
                  <p className="mt-0.5 font-semibold text-[#0F1B3D]">
                    {selectedOpp.preferredCleaningHours}
                  </p>
                </div>
                <div>
                  <span className="text-[#647087]">Est. Monthly Value (Demo)</span>
                  <p className="mt-0.5 font-mono-tabular font-semibold text-[#8A6A2C]">
                    {selectedOpp.estimatedMonthlyValue
                      ? `${formatGBP(selectedOpp.estimatedMonthlyValue)}/mo`
                      : 'To be quoted'}
                  </p>
                </div>
              </div>

              {/* Service & Visit Requirements */}
              <div className="border-t border-[#EEF0F5] pt-4 space-y-3 text-xs">
                <div>
                  <p className="font-semibold text-[#0F1B3D]">Service Requirements</p>
                  <ul className="mt-1.5 list-disc pl-4 space-y-1 text-[#2C3752]">
                    {selectedOpp.serviceRequirements.map((req, idx) => (
                      <li key={idx}>{req}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="font-semibold text-[#0F1B3D]">Site Visit Requirements</p>
                  <p className="mt-1 text-[#2C3752] flex items-start gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-[#647087] shrink-0 mt-0.5" />
                    <span>
                      {selectedOpp.visitRequired ? 'Site visit required — ' : 'Walkthrough complete — '}
                      {selectedOpp.visitNotes}
                    </span>
                  </p>
                </div>
              </div>

              {/* Quotation History */}
              <div className="border-t border-[#EEF0F5] pt-4">
                <p className="text-xs font-semibold text-[#0F1B3D] mb-2">Quotation History</p>
                {selectedOppQuotes.length === 0 ? (
                  <p className="text-xs text-[#647087]">
                    No quotations created for this commercial opportunity yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedOppQuotes.map((q) => (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => navigateTo('quotations', { selectedQuoteId: q.id })}
                        className="flex w-full items-center justify-between rounded-lg border border-[#E8EAF0] px-3 py-2 text-xs hover:bg-[#F7F8FA] cursor-pointer"
                      >
                        <span className="font-medium text-[#0F1B3D]">
                          <span className="font-mono-tabular">{q.reference}</span> ·{' '}
                          {formatGBP(q.total)}
                        </span>
                        <StatusBadge status={q.status} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Activity Note */}
              <div className="border-t border-[#EEF0F5] pt-4">
                <p className="text-xs font-semibold text-[#0F1B3D] mb-2">Log Commercial Activity</p>
                <form onSubmit={handleAddActivity} className="flex gap-2">
                  <input
                    type="text"
                    value={activityNote}
                    onChange={(e) => setActivityNote(e.target.value)}
                    placeholder="Record call summary or site detail..."
                    className="flex-1 rounded-lg border border-[#E8EAF0] px-3 py-2 text-xs focus:border-[#8A6A2C] focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!activityNote.trim()}
                    className="rounded-lg bg-[#0F1B3D] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#1A2B5C] disabled:opacity-40 cursor-pointer"
                  >
                    Save Note
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
