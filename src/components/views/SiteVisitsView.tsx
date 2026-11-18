import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  List,
  Plus,
  MapPin,
  Clock,
  UserCheck,
  FileSpreadsheet,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import {
  OperatingArea,
  SiteAssessmentNotes,
  SiteVisit,
  VisitStatus,
} from '../../types/operations';
import { useOperations } from '../../context/OperationsContext';
import {
  OPERATING_AREAS,
  formatUKDate,
  formatUKDateShort,
  getTodayISODate,
} from '../../utils/formatters';
import { StatusBadge } from '../common/StatusBadge';

const VISIT_STATUSES: VisitStatus[] = [
  'Scheduled',
  'Confirmed',
  'Completed',
  'Rescheduled',
  'Cancelled',
];

export const SiteVisitsView: React.FC = () => {
  const {
    state,
    navPayload,
    clearNavPayload,
    navigateTo,
    createSiteVisit,
    updateSiteVisit,
    completeSiteVisit,
    requestConfirm,
    getMemberName,
  } = useOperations();

  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  // Calendar Month State
  const todayDate = new Date();
  const [calYear, setCalYear] = useState(todayDate.getFullYear());
  const [calMonth, setCalMonth] = useState(todayDate.getMonth()); // 0-indexed

  // Create Form State
  const [newEnquiryId, setNewEnquiryId] = useState(state.enquiries[0]?.id || '');
  const [newLocation, setNewLocation] = useState<OperatingArea>(
    state.enquiries[0]?.location || 'Islington'
  );
  const [newAddress, setNewAddress] = useState(state.enquiries[0]?.address || '');
  const [newPostcode, setNewPostcode] = useState(state.enquiries[0]?.postcode || '');
  const [newDate, setNewDate] = useState(getTodayISODate());
  const [newTime, setNewTime] = useState('14:00');
  const [newAssessorId, setNewAssessorId] = useState('tm-2');
  const [newInstructions, setNewInstructions] = useState('');

  // Assessment Form State inside Detail Panel
  const selectedVisit = useMemo(
    () => state.siteVisits.find((v) => v.id === selectedVisitId) || null,
    [state.siteVisits, selectedVisitId]
  );

  const [assessmentDraft, setAssessmentDraft] = useState<SiteAssessmentNotes>({
    propertyCondition: '',
    cleaningRequirements: '',
    accessDetails: '',
    estimatedHours: 3,
    requiredEquipment: '',
    staffRecommendation: '',
    followUpAction: '',
  });

  useEffect(() => {
    if (selectedVisit) {
      setAssessmentDraft({ ...selectedVisit.assessment });
    }
  }, [selectedVisit]);

  useEffect(() => {
    if (!navPayload) return;
    if (navPayload.selectedVisitId) {
      setSelectedVisitId(navPayload.selectedVisitId);
      clearNavPayload();
    } else if (navPayload.openCreateVisitForEnquiryId) {
      const enq =
        state.enquiries.find((e) => e.id === navPayload.openCreateVisitForEnquiryId) ||
        state.enquiries[0];
      if (enq) {
        setNewEnquiryId(enq.id);
        setNewLocation(enq.location);
        setNewAddress(enq.address);
        setNewPostcode(enq.postcode);
      }
      setNewDate(getTodayISODate());
      setNewTime('14:00');
      setNewInstructions('');
      setCreateOpen(true);
      clearNavPayload();
    }
  }, [navPayload, clearNavPayload, state.enquiries]);

  const handleSelectEnquiry = (enquiryId: string) => {
    setNewEnquiryId(enquiryId);
    const enq = state.enquiries.find((e) => e.id === enquiryId);
    if (enq) {
      setNewLocation(enq.location);
      setNewAddress(enq.address);
      setNewPostcode(enq.postcode);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const enq = state.enquiries.find((x) => x.id === newEnquiryId);
    if (!enq) return;

    const created = createSiteVisit({
      enquiryId: enq.id,
      customerName: enq.customerName,
      companyName: enq.companyName,
      location: newLocation,
      address: newAddress.trim() || enq.address,
      postcode: (newPostcode.trim() || enq.postcode).toUpperCase(),
      date: newDate,
      time: newTime,
      assessorId: newAssessorId,
      status: 'Scheduled',
      specialInstructions: newInstructions.trim(),
      assessment: {
        propertyCondition: '',
        cleaningRequirements: enq.summary,
        accessDetails: '',
        estimatedHours: 3,
        requiredEquipment: '',
        staffRecommendation: '',
        followUpAction: '',
      },
    });
    setCreateOpen(false);
    setSelectedVisitId(created.id);
  };

  // Calendar grid days
  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(calYear, calMonth, 1);
    // Make Monday index 0 (UK calendar)
    const startOffset = (firstDayOfMonth.getDay() + 6) % 7;
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

    const cells: { iso: string | null; dayNum: number | null; visits: SiteVisit[] }[] = [];
    for (let i = 0; i < startOffset; i++) {
      cells.push({ iso: null, dayNum: null, visits: [] });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(
        2,
        '0'
      )}`;
      const visits = state.siteVisits
        .filter((v) => v.date === iso)
        .sort((a, b) => a.time.localeCompare(b.time));
      cells.push({ iso, dayNum: d, visits });
    }
    return cells;
  }, [calYear, calMonth, state.siteVisits]);

  const sortedVisits = useMemo(() => {
    return [...state.siteVisits].sort(
      (a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)
    );
  }, [state.siteVisits]);

  const monthLabel = new Date(calYear, calMonth, 1).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  });

  const stepMonth = (delta: number) => {
    const d = new Date(calYear, calMonth + delta, 1);
    setCalYear(d.getFullYear());
    setCalMonth(d.getMonth());
  };

  const todayISO = getTodayISODate();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-[#0F1B3D]">
            Site Visits & Assessments
          </h1>
          <p className="text-sm text-[#647087]">
            Schedule on-site walkthroughs, record property conditions, and pre-fill quotations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="inline-flex rounded-lg border border-[#E8EAF0] bg-white p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium cursor-pointer ${
                viewMode === 'calendar'
                  ? 'bg-[#F7F2E7] text-[#8A6A2C]'
                  : 'text-[#647087] hover:text-[#0F1B3D]'
              }`}
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              <span>Calendar</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-[#F7F2E7] text-[#8A6A2C]'
                  : 'text-[#647087] hover:text-[#0F1B3D]'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>Upcoming List</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F1B3D] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#1A2B5C] whitespace-nowrap cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Schedule Visit</span>
          </button>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <div className="rounded-xl border border-[#E8EAF0] bg-white overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#EEF0F5] px-5 py-3.5">
            <h2 className="font-display text-base font-bold text-[#0F1B3D]">{monthLabel}</h2>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => stepMonth(-1)}
                aria-label="Previous month"
                className="rounded-lg border border-[#E8EAF0] p-1.5 text-[#0F1B3D] hover:bg-[#F7F8FA] cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  setCalYear(now.getFullYear());
                  setCalMonth(now.getMonth());
                }}
                className="rounded-lg border border-[#E8EAF0] px-2.5 py-1 text-xs font-medium text-[#0F1B3D] hover:bg-[#F7F8FA] cursor-pointer"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => stepMonth(1)}
                aria-label="Next month"
                className="rounded-lg border border-[#E8EAF0] p-1.5 text-[#0F1B3D] hover:bg-[#F7F8FA] cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-[#EEF0F5] bg-[#F7F8FA] text-center text-[11px] font-semibold text-[#647087]">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
              <div key={d} className="py-2">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 auto-rows-[minmax(96px,auto)] divide-x divide-y divide-[#EEF0F5]">
            {calendarCells.map((cell, idx) => {
              const isToday = cell.iso === todayISO;
              return (
                <div
                  key={idx}
                  className={`p-1.5 ${
                    cell.dayNum ? 'bg-white' : 'bg-[#F7F8FA]'
                  } ${isToday ? 'ring-1 ring-inset ring-[#8A6A2C]/60 bg-[#F7F2E7]/50' : ''}`}
                >
                  {cell.dayNum && (
                    <div className="flex items-center justify-between px-1 mb-1">
                      <span
                        className={`font-mono-tabular text-xs ${
                          isToday
                            ? 'inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#0F1B3D] text-white font-semibold'
                            : 'text-[#647087]'
                        }`}
                      >
                        {cell.dayNum}
                      </span>
                    </div>
                  )}

                  <div className="space-y-1">
                    {cell.visits.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVisitId(v.id)}
                        className={`w-full rounded-md border px-1.5 py-1 text-left text-[11px] leading-tight transition-colors cursor-pointer ${
                          v.status === 'Cancelled'
                            ? 'border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]'
                            : v.status === 'Completed'
                            ? 'border-[#BBF7D0] bg-[#ECFDF5] text-[#15803D]'
                            : 'border-[#D0D7E7] bg-[#EEF1F7] text-[#0F1B3D] hover:border-[#8A6A2C]'
                        }`}
                      >
                        <p className="font-mono-tabular font-semibold truncate">{v.time}</p>
                        <p className="truncate font-medium">
                          {v.companyName || v.customerName}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
          {sortedVisits.map((visit) => (
            <div
              key={visit.id}
              onClick={() => setSelectedVisitId(visit.id)}
              className="cursor-pointer rounded-xl border border-[#E8EAF0] bg-white p-4 hover:border-[#8A6A2C]/60 transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono-tabular text-xs font-semibold text-[#8A6A2C]">
                    {visit.reference}
                  </span>
                  <h3 className="mt-0.5 font-display text-base font-semibold text-[#0F1B3D]">
                    {visit.companyName || visit.customerName}
                  </h3>
                </div>
                <StatusBadge status={visit.status} />
              </div>

              <div className="mt-3 space-y-1.5 text-xs text-[#2C3752]">
                <p className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-[#647087]" />
                  <span>
                    {formatUKDateShort(visit.date)} at{' '}
                    <span className="font-mono-tabular font-semibold">{visit.time}</span>
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-[#647087]" />
                  <span>
                    {visit.address}, {visit.location} ({visit.postcode})
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <UserCheck className="h-3.5 w-3.5 text-[#647087]" />
                  <span>Assessor: {getMemberName(visit.assessorId)}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Visit Detail & Assessment Drawer */}
      {selectedVisit && (
        <div className="fixed inset-0 z-40 flex justify-end bg-[#0F1B3D]/40 backdrop-blur-[1px]">
          <div className="flex h-full w-full max-w-xl flex-col bg-white shadow-2xl border-l border-[#E8EAF0]">
            <div className="flex items-start justify-between gap-4 border-b border-[#EEF0F5] px-6 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono-tabular text-xs font-semibold text-[#8A6A2C]">
                    {selectedVisit.reference}
                  </span>
                  <StatusBadge status={selectedVisit.status} />
                </div>
                <h2 className="mt-1 font-display text-lg font-bold text-[#0F1B3D]">
                  {selectedVisit.companyName || selectedVisit.customerName}
                </h2>
                <p className="text-xs text-[#647087]">
                  {selectedVisit.address}, {selectedVisit.location} ({selectedVisit.postcode})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVisitId(null)}
                aria-label="Close detail panel"
                className="rounded-lg p-1.5 text-[#647087] hover:bg-[#F7F8FA] cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* Prepare Quotation Banner when Completed */}
              {selectedVisit.status === 'Completed' && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[#DECFA8] bg-[#F7F2E7] p-4">
                  <div>
                    <p className="text-xs font-bold text-[#8A6A2C]">Assessment Complete</p>
                    <p className="text-xs text-[#0F1B3D] mt-0.5">
                      Pre-fill a quotation using these assessment hours and notes.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      navigateTo('quotations', {
                        prefillQuoteFromVisitId: selectedVisit.id,
                      })
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F1B3D] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#1A2B5C] whitespace-nowrap cursor-pointer"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    <span>Prepare Quotation</span>
                  </button>
                </div>
              )}

              {/* Schedule & Status Controls */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 rounded-xl bg-[#F7F8FA] p-4 border border-[#E8EAF0]">
                <div>
                  <label className="block text-[11px] font-semibold text-[#647087] mb-1">
                    Visit Date
                  </label>
                  <input
                    type="date"
                    value={selectedVisit.date}
                    onChange={(e) =>
                      updateSiteVisit(selectedVisit.id, {
                        date: e.target.value,
                        status:
                          selectedVisit.status === 'Scheduled'
                            ? 'Rescheduled'
                            : selectedVisit.status,
                      })
                    }
                    className="w-full rounded-lg border border-[#E8EAF0] bg-white px-2.5 py-1.5 text-xs focus:border-[#8A6A2C] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#647087] mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    value={selectedVisit.time}
                    onChange={(e) =>
                      updateSiteVisit(selectedVisit.id, { time: e.target.value })
                    }
                    className="w-full rounded-lg border border-[#E8EAF0] bg-white px-2.5 py-1.5 text-xs focus:border-[#8A6A2C] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#647087] mb-1">
                    Status
                  </label>
                  <select
                    value={selectedVisit.status}
                    onChange={(e) => {
                      const next = e.target.value as VisitStatus;
                      if (next === 'Cancelled') {
                        requestConfirm({
                          title: `Cancel ${selectedVisit.reference}?`,
                          description:
                            'Are you sure you want to mark this site visit as Cancelled?',
                          confirmLabel: 'Cancel Visit',
                          variant: 'danger',
                          onConfirm: () =>
                            updateSiteVisit(selectedVisit.id, { status: 'Cancelled' }),
                        });
                      } else {
                        updateSiteVisit(selectedVisit.id, { status: next });
                      }
                    }}
                    className="w-full rounded-lg border border-[#E8EAF0] bg-white px-2.5 py-1.5 text-xs font-medium text-[#0F1B3D] focus:border-[#8A6A2C] focus:outline-none"
                  >
                    {VISIT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    navigateTo('assistant', {
                      assistantEnquiryId: selectedVisit.enquiryId,
                      assistantAction: 'visit_confirmation',
                    })
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#E8EAF0] bg-white px-3 py-1.5 text-xs font-medium text-[#0F1B3D] hover:bg-[#F7F2E7] cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5 text-[#8A6A2C]" />
                  <span>Draft Confirmation Message</span>
                </button>
              </div>

              {selectedVisit.specialInstructions && (
                <div className="text-xs">
                  <p className="font-semibold text-[#0F1B3D]">Special Instructions</p>
                  <p className="mt-1 text-[#2C3752]">{selectedVisit.specialInstructions}</p>
                </div>
              )}

              {/* Assessment Notes Form */}
              <div className="border-t border-[#EEF0F5] pt-4 space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-sm font-bold text-[#0F1B3D]">
                    Site Assessment Notes
                  </h3>
                  <span className="text-xs text-[#647087]">
                    Assessor: {getMemberName(selectedVisit.assessorId)}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F1B3D] mb-1">
                    Property Condition
                  </label>
                  <input
                    type="text"
                    value={assessmentDraft.propertyCondition}
                    onChange={(e) =>
                      setAssessmentDraft({
                        ...assessmentDraft,
                        propertyCondition: e.target.value,
                      })
                    }
                    placeholder="e.g. Modern finish, heavy wear in reception"
                    className="w-full rounded-lg border border-[#E8EAF0] px-3 py-2 text-xs focus:border-[#8A6A2C] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F1B3D] mb-1">
                    Cleaning Requirements
                  </label>
                  <textarea
                    rows={2}
                    value={assessmentDraft.cleaningRequirements}
                    onChange={(e) =>
                      setAssessmentDraft({
                        ...assessmentDraft,
                        cleaningRequirements: e.target.value,
                      })
                    }
                    placeholder="Detail rooms, flooring, sanitisation scope..."
                    className="w-full rounded-lg border border-[#E8EAF0] px-3 py-2 text-xs focus:border-[#8A6A2C] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#0F1B3D] mb-1">
                      Access Details
                    </label>
                    <input
                      type="text"
                      value={assessmentDraft.accessDetails}
                      onChange={(e) =>
                        setAssessmentDraft({
                          ...assessmentDraft,
                          accessDetails: e.target.value,
                        })
                      }
                      placeholder="Key safe, alarm fob, concierge..."
                      className="w-full rounded-lg border border-[#E8EAF0] px-3 py-2 text-xs focus:border-[#8A6A2C] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#0F1B3D] mb-1">
                      Estimated Labour Hours
                    </label>
                    <input
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={assessmentDraft.estimatedHours}
                      onChange={(e) =>
                        setAssessmentDraft({
                          ...assessmentDraft,
                          estimatedHours: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full rounded-lg border border-[#E8EAF0] px-3 py-2 font-mono-tabular text-xs focus:border-[#8A6A2C] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F1B3D] mb-1">
                    Required Equipment & Products
                  </label>
                  <input
                    type="text"
                    value={assessmentDraft.requiredEquipment}
                    onChange={(e) =>
                      setAssessmentDraft({
                        ...assessmentDraft,
                        requiredEquipment: e.target.value,
                      })
                    }
                    placeholder="e.g. HEPA vacuum, colour-coded microfibre, non-fragranced sanitiser"
                    className="w-full rounded-lg border border-[#E8EAF0] px-3 py-2 text-xs focus:border-[#8A6A2C] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#0F1B3D] mb-1">
                      Staff Recommendation
                    </label>
                    <input
                      type="text"
                      value={assessmentDraft.staffRecommendation}
                      onChange={(e) =>
                        setAssessmentDraft({
                          ...assessmentDraft,
                          staffRecommendation: e.target.value,
                        })
                      }
                      placeholder="e.g. 2 operatives (1.5 hrs each)"
                      className="w-full rounded-lg border border-[#E8EAF0] px-3 py-2 text-xs focus:border-[#8A6A2C] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#0F1B3D] mb-1">
                      Follow-up Action
                    </label>
                    <input
                      type="text"
                      value={assessmentDraft.followUpAction}
                      onChange={(e) =>
                        setAssessmentDraft({
                          ...assessmentDraft,
                          followUpAction: e.target.value,
                        })
                      }
                      placeholder="e.g. Issue monthly quote"
                      className="w-full rounded-lg border border-[#E8EAF0] px-3 py-2 text-xs focus:border-[#8A6A2C] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() =>
                      updateSiteVisit(selectedVisit.id, { assessment: assessmentDraft })
                    }
                    className="rounded-lg border border-[#E8EAF0] px-3.5 py-2 text-xs font-medium text-[#0F1B3D] hover:bg-[#F7F8FA] cursor-pointer"
                  >
                    Save Notes
                  </button>
                  <button
                    type="button"
                    onClick={() => completeSiteVisit(selectedVisit.id, assessmentDraft)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F1B3D] px-4 py-2 text-xs font-medium text-white hover:bg-[#1A2B5C] cursor-pointer"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Complete Visit & Save</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule New Site Visit Modal */}
      {createOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F1B3D]/45 p-4 backdrop-blur-[1px]"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-xl border border-[#E8EAF0] bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[#EEF0F5] px-6 py-4">
              <h2 className="font-display text-lg font-bold text-[#0F1B3D]">
                Schedule Site Visit
              </h2>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                aria-label="Close modal"
                className="rounded-lg p-1.5 text-[#647087] hover:bg-[#F7F8FA] cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0F1B3D] mb-1">
                  Linked Enquiry
                </label>
                <select
                  value={newEnquiryId}
                  onChange={(e) => handleSelectEnquiry(e.target.value)}
                  className="w-full rounded-lg border border-[#E8EAF0] bg-white px-3 py-2 text-sm focus:border-[#8A6A2C] focus:outline-none"
                >
                  {state.enquiries.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.reference} — {e.companyName || e.customerName} ({e.location})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#0F1B3D] mb-1">
                    Location Area
                  </label>
                  <select
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value as OperatingArea)}
                    className="w-full rounded-lg border border-[#E8EAF0] bg-white px-3 py-2 text-sm focus:border-[#8A6A2C] focus:outline-none"
                  >
                    {OPERATING_AREAS.map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F1B3D] mb-1">
                    Postcode
                  </label>
                  <input
                    type="text"
                    required
                    value={newPostcode}
                    onChange={(e) => setNewPostcode(e.target.value)}
                    className="w-full rounded-lg border border-[#E8EAF0] px-3 py-2 text-sm focus:border-[#8A6A2C] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F1B3D] mb-1">
                  Property Address
                </label>
                <input
                  type="text"
                  required
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full rounded-lg border border-[#E8EAF0] px-3 py-2 text-sm focus:border-[#8A6A2C] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0F1B3D] mb-1">
                    Visit Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full rounded-lg border border-[#E8EAF0] px-3 py-2 text-sm focus:border-[#8A6A2C] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0F1B3D] mb-1">
                    Visit Time
                  </label>
                  <input
                    type="time"
                    required
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full rounded-lg border border-[#E8EAF0] px-3 py-2 text-sm focus:border-[#8A6A2C] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0F1B3D] mb-1">
                    Assessor
                  </label>
                  <select
                    value={newAssessorId}
                    onChange={(e) => setNewAssessorId(e.target.value)}
                    className="w-full rounded-lg border border-[#E8EAF0] bg-white px-3 py-2 text-sm focus:border-[#8A6A2C] focus:outline-none"
                  >
                    {state.teamMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F1B3D] mb-1">
                  Special Instructions
                </label>
                <textarea
                  rows={2}
                  value={newInstructions}
                  onChange={(e) => setNewInstructions(e.target.value)}
                  placeholder="Parking, reception contact, key collection..."
                  className="w-full rounded-lg border border-[#E8EAF0] px-3 py-2 text-sm focus:border-[#8A6A2C] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 border-t border-[#EEF0F5] pt-4">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="rounded-lg border border-[#E8EAF0] px-4 py-2 text-xs font-medium text-[#0F1B3D] hover:bg-[#F7F8FA] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#0F1B3D] px-4 py-2 text-xs font-medium text-white hover:bg-[#1A2B5C] cursor-pointer"
                >
                  Schedule Site Visit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
