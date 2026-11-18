import React, { useState, useMemo, useEffect } from 'react';
import {
  CalendarDays,
  List,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Users,
  X,
  CheckCircle2,
  Info,
} from 'lucide-react';
import {
  CleaningJob,
  JobStatus,
  OperatingArea,
  ServiceCategory,
} from '../../types/operations';
import { useOperations } from '../../context/OperationsContext';
import {
  OPERATING_AREAS,
  SERVICE_CATEGORIES,
  addDaysISO,
  formatUKDate,
  formatUKDateShort,
  getTodayISODate,
} from '../../utils/formatters';
import { StatusBadge } from '../common/StatusBadge';

const JOB_STATUSES: ('All' | JobStatus)[] = [
  'All',
  'Upcoming',
  'Scheduled',
  'In Progress',
  'Completed',
  'Cancelled',
];

const SQUAD_PRESETS = [
  'North London Domestic A',
  'North London Domestic B',
  'Tenancy Team A (2 Operatives)',
  'Commercial Evening Squad 1',
  'Commercial Day Care',
  'Herts Commercial Team',
  'Harrow Domestic Team',
  'Specialist Deep Clean A',
];

function getMondayOfWeek(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const day = (dt.getDay() + 6) % 7; // Monday = 0
  dt.setDate(dt.getDate() - day);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(
    dt.getDate()
  ).padStart(2, '0')}`;
}

export const JobsSchedulingView: React.FC = () => {
  const {
    state,
    navPayload,
    clearNavPayload,
    createJob,
    updateJob,
    updateJobStatus,
    getMemberName,
  } = useOperations();

  const [viewMode, setViewMode] = useState<'weekly' | 'list'>('weekly');
  const [statusFilter, setStatusFilter] = useState<'All' | JobStatus>('All');
  const [weekStart, setWeekStart] = useState(() => getMondayOfWeek(getTodayISODate()));
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  // Create Form
  const [formCustomer, setFormCustomer] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formEnquiryId, setFormEnquiryId] = useState<string>('');
  const [formQuoteId, setFormQuoteId] = useState<string>('');
  const [formService, setFormService] = useState<ServiceCategory>('Domestic Cleaning');
  const [formLocation, setFormLocation] = useState<OperatingArea>('Islington');
  const [formAddress, setFormAddress] = useState('');
  const [formPostcode, setFormPostcode] = useState('');
  const [formDate, setFormDate] = useState(getTodayISODate());
  const [formStartTime, setFormStartTime] = useState('09:00');
  const [formDuration, setFormDuration] = useState(3);
  const [formTeam, setFormTeam] = useState(SQUAD_PRESETS[0]);
  const [formLeadId, setFormLeadId] = useState('tm-1');
  const [formRecurring, setFormRecurring] = useState(false);
  const [formPattern, setFormPattern] = useState('Weekly');
  const [formNotes, setFormNotes] = useState('');

  // Detail Notes Edit
  const selectedJob = useMemo(
    () => state.jobs.find((j) => j.id === selectedJobId) || null,
    [state.jobs, selectedJobId]
  );
  const [detailNotes, setDetailNotes] = useState('');

  useEffect(() => {
    if (selectedJob) setDetailNotes(selectedJob.notes);
  }, [selectedJob]);

  useEffect(() => {
    if (!navPayload) return;
    if (navPayload.openCreateJobFromQuoteId) {
      const q = state.quotations.find((x) => x.id === navPayload.openCreateJobFromQuoteId);
      if (q) {
        setFormEnquiryId(q.enquiryId);
        setFormQuoteId(q.id);
        setFormCustomer(q.customerName);
        setFormCompany(q.companyName || '');
        setFormService(q.serviceCategory);
        setFormLocation(q.location);
        setFormAddress(q.address);
        setFormPostcode(q.postcode);
        setFormDuration(Math.min(8, Math.max(2, q.estimatedHours)));
        setFormRecurring(q.frequency !== 'One-off');
        setFormPattern(q.frequency);
        setFormNotes(`Scheduled from accepted quotation ${q.reference}.`);
      } else {
        setFormEnquiryId('');
        setFormQuoteId('');
        setFormCustomer('');
        setFormCompany('');
        setFormAddress('');
        setFormPostcode('');
        setFormNotes('');
      }
      setFormDate(addDaysISO(getTodayISODate(), 1));
      setCreateOpen(true);
      clearNavPayload();
    }
  }, [navPayload, clearNavPayload, state.quotations]);

  const filteredJobs = useMemo(() => {
    return state.jobs
      .filter((j) => statusFilter === 'All' || j.status === statusFilter)
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
  }, [state.jobs, statusFilter]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const iso = addDaysISO(weekStart, i);
      const jobs = filteredJobs.filter((j) => j.date === iso);
      return { iso, jobs };
    });
  }, [weekStart, filteredJobs]);

  const acceptedQuotes = useMemo(
    () => state.quotations.filter((q) => q.status === 'Accepted'),
    [state.quotations]
  );

  const handlePrefillFromQuote = (quoteId: string) => {
    setFormQuoteId(quoteId);
    const q = state.quotations.find((x) => x.id === quoteId);
    if (!q) return;
    setFormEnquiryId(q.enquiryId);
    setFormCustomer(q.customerName);
    setFormCompany(q.companyName || '');
    setFormService(q.serviceCategory);
    setFormLocation(q.location);
    setFormAddress(q.address);
    setFormPostcode(q.postcode);
    setFormDuration(Math.min(8, Math.max(2, q.estimatedHours)));
    setFormRecurring(q.frequency !== 'One-off');
    setFormPattern(q.frequency);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCustomer.trim() || !formAddress.trim()) return;
    const created = createJob({
      enquiryId: formEnquiryId || undefined,
      quotationId: formQuoteId || undefined,
      customerName: formCustomer.trim(),
      companyName: formCompany.trim() || undefined,
      service: formService,
      location: formLocation,
      address: formAddress.trim(),
      postcode: formPostcode.trim().toUpperCase(),
      date: formDate,
      startTime: formStartTime,
      durationHours: Number(formDuration) || 2,
      assignedTeam: formTeam,
      leadMemberId: formLeadId,
      isRecurring: formRecurring,
      recurrencePattern: formRecurring ? formPattern : undefined,
      status: 'Scheduled',
      notes: formNotes.trim(),
    });
    setCreateOpen(false);
    setSelectedJobId(created.id);
  };

  const todayISO = getTodayISODate();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-[#0F1B3D]">Jobs & Scheduling</h1>
          <p className="text-sm text-[#647087]">
            Convert accepted quotations into confirmed cleaning jobs and assign teams.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="inline-flex rounded-lg border border-[#E8EAF0] bg-white p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('weekly')}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium cursor-pointer ${
                viewMode === 'weekly'
                  ? 'bg-[#F7F2E7] text-[#8A6A2C]'
                  : 'text-[#647087] hover:text-[#0F1B3D]'
              }`}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              <span>Weekly Calendar</span>
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
              <span>List View</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setFormQuoteId('');
              setFormEnquiryId('');
              setFormCustomer('');
              setFormCompany('');
              setFormAddress('');
              setFormPostcode('');
              setFormNotes('');
              setFormDate(todayISO);
              setCreateOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F1B3D] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#1A2B5C] whitespace-nowrap cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Job</span>
          </button>
        </div>
      </div>

      {/* Discreet Concept Note */}
      <div className="flex items-center gap-2 rounded-xl border border-[#E8EAF0] bg-white px-4 py-2.5 text-xs text-[#647087]">
        <Info className="h-4 w-4 text-[#8A6A2C] shrink-0" />
        <span>
          Concept scheduling workspace using fictional team assignments. Independent of ABE&apos;s
          existing cleaner portal or staff application.
        </span>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-[#E8EAF0] bg-white p-1.5">
        {JOB_STATUSES.map((st) => {
          const count =
            st === 'All'
              ? state.jobs.length
              : state.jobs.filter((j) => j.status === st).length;
          const active = statusFilter === st;
          return (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                active
                  ? 'bg-[#0F1B3D] text-white'
                  : 'text-[#2C3752] hover:bg-[#F7F8FA] hover:text-[#0F1B3D]'
              }`}
            >
              <span>{st}</span>
              <span
                className={`font-mono-tabular text-[11px] ${
                  active ? 'text-white/90' : 'text-[#647087]'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {viewMode === 'weekly' ? (
        <div className="rounded-xl border border-[#E8EAF0] bg-white overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#EEF0F5] px-5 py-3.5">
            <div>
              <h2 className="font-display text-sm font-bold text-[#0F1B3D]">
                Week of {formatUKDate(weekStart)}
              </h2>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setWeekStart(addDaysISO(weekStart, -7))}
                aria-label="Previous week"
                className="rounded-lg border border-[#E8EAF0] p-1.5 text-[#0F1B3D] hover:bg-[#F7F8FA] cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setWeekStart(getMondayOfWeek(todayISO))}
                className="rounded-lg border border-[#E8EAF0] px-2.5 py-1 text-xs font-medium text-[#0F1B3D] hover:bg-[#F7F8FA] cursor-pointer"
              >
                This Week
              </button>
              <button
                type="button"
                onClick={() => setWeekStart(addDaysISO(weekStart, 7))}
                aria-label="Next week"
                className="rounded-lg border border-[#E8EAF0] p-1.5 text-[#0F1B3D] hover:bg-[#F7F8FA] cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="grid grid-cols-7 min-w-[960px] divide-x divide-[#EEF0F5]">
              {weekDays.map((day) => {
                const isToday = day.iso === todayISO;
                return (
                  <div key={day.iso} className="min-h-[320px] flex flex-col">
                    <div
                      className={`border-b border-[#EEF0F5] px-3 py-2.5 text-xs ${
                        isToday ? 'bg-[#F7F2E7]/85 font-bold text-[#8A6A2C]' : 'bg-[#F7F8FA] text-[#0F1B3D]'
                      }`}
                    >
                      {formatUKDateShort(day.iso)}
                    </div>
                    <div className="flex-1 p-2 space-y-2">
                      {day.jobs.length === 0 ? (
                        <p className="py-6 text-center text-[11px] text-[#8A94A6]">No jobs</p>
                      ) : (
                        day.jobs.map((job) => (
                          <button
                            key={job.id}
                            type="button"
                            onClick={() => setSelectedJobId(job.id)}
                            className="w-full rounded-lg border border-[#E8EAF0] bg-white p-2.5 text-left hover:border-[#0F1B3D] transition-colors cursor-pointer"
                          >
                            <div className="flex items-center justify-between gap-1 text-[11px]">
                              <span className="font-mono-tabular font-semibold text-[#8A6A2C]">
                                {job.startTime} ({job.durationHours}h)
                              </span>
                            </div>
                            <p className="mt-1 text-xs font-semibold text-[#0F1B3D] truncate">
                              {job.companyName || job.customerName}
                            </p>
                            <p className="text-[11px] text-[#647087] truncate">
                              {job.service} · {job.location}
                            </p>
                            <div className="mt-2">
                              <StatusBadge status={job.status} />
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#E8EAF0] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[#EEF0F5] bg-[#F7F8FA] text-[11.5px] font-semibold text-[#647087]">
                  <th className="py-3 px-4">Job Ref</th>
                  <th className="py-3 px-4">Customer / Site</th>
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-4">Schedule</th>
                  <th className="py-3 px-4">Assigned Team</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF0F5] text-sm">
                {filteredJobs.map((job) => (
                  <tr
                    key={job.id}
                    onClick={() => setSelectedJobId(job.id)}
                    className="cursor-pointer hover:bg-[#F7F8FA] transition-colors"
                  >
                    <td className="py-3 px-4 font-mono-tabular text-xs font-semibold text-[#0F1B3D] whitespace-nowrap">
                      {job.reference}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-[#0F1B3D]">
                        {job.companyName || job.customerName}
                      </p>
                      <p className="text-xs text-[#647087]">
                        {job.address}, {job.location} ({job.postcode})
                      </p>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <p className="font-medium text-[#0F1B3D]">{job.service}</p>
                      <p className="text-[#647087]">
                        {job.isRecurring ? job.recurrencePattern || 'Recurring' : 'One-off'}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-xs tabular-nums whitespace-nowrap">
                      <p className="font-medium text-[#0F1B3D]">{formatUKDate(job.date)}</p>
                      <p className="text-[#647087]">
                        {job.startTime} · {job.durationHours} hrs
                      </p>
                    </td>
                    <td className="py-3 px-4 text-xs text-[#2C3752]">
                      <p className="font-medium text-[#0F1B3D]">{job.assignedTeam}</p>
                      <p className="text-[#647087]">Lead: {getMemberName(job.leadMemberId)}</p>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={job.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Job Detail Drawer */}
      {selectedJob && (
        <div className="fixed inset-0 z-40 flex justify-end bg-[#0F1B3D]/40 backdrop-blur-[1px]">
          <div className="flex h-full w-full max-w-lg flex-col bg-white shadow-2xl border-l border-[#E8EAF0]">
            <div className="flex items-start justify-between gap-4 border-b border-[#EEF0F5] px-6 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono-tabular text-xs font-semibold text-[#8A6A2C]">
                    {selectedJob.reference}
                  </span>
                  <StatusBadge status={selectedJob.status} />
                </div>
                <h2 className="mt-1 font-display text-lg font-bold text-[#0F1B3D]">
                  {selectedJob.companyName || selectedJob.customerName}
                </h2>
                <p className="text-xs text-[#647087]">
                  {selectedJob.service} · {selectedJob.isRecurring ? 'Recurring' : 'One-off'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJobId(null)}
                aria-label="Close drawer"
                className="rounded-lg p-1.5 text-[#647087] hover:bg-[#F7F8FA] cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 rounded-xl bg-[#F7F8FA] p-4 border border-[#E8EAF0]">
                <div>
                  <label className="block text-[11px] font-semibold text-[#647087] mb-1">
                    Job Date
                  </label>
                  <input
                    type="date"
                    value={selectedJob.date}
                    onChange={(e) => updateJob(selectedJob.id, { date: e.target.value })}
                    className="w-full rounded-lg border border-[#E8EAF0] bg-white px-2.5 py-1.5 text-xs focus:border-[#8A6A2C] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#647087] mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={selectedJob.startTime}
                    onChange={(e) => updateJob(selectedJob.id, { startTime: e.target.value })}
                    className="w-full rounded-lg border border-[#E8EAF0] bg-white px-2.5 py-1.5 text-xs focus:border-[#8A6A2C] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#647087] mb-1">
                    Assigned Team
                  </label>
                  <select
                    value={selectedJob.assignedTeam}
                    onChange={(e) => updateJob(selectedJob.id, { assignedTeam: e.target.value })}
                    className="w-full rounded-lg border border-[#E8EAF0] bg-white px-2.5 py-1.5 text-xs focus:border-[#8A6A2C] focus:outline-none"
                  >
                    {SQUAD_PRESETS.map((sq) => (
                      <option key={sq} value={sq}>
                        {sq}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#647087] mb-1">
                    Job Status
                  </label>
                  <select
                    value={selectedJob.status}
                    onChange={(e) =>
                      updateJobStatus(selectedJob.id, e.target.value as JobStatus)
                    }
                    className="w-full rounded-lg border border-[#E8EAF0] bg-white px-2.5 py-1.5 text-xs font-medium text-[#0F1B3D] focus:border-[#8A6A2C] focus:outline-none"
                  >
                    {(['Upcoming', 'Scheduled', 'In Progress', 'Completed', 'Cancelled'] as JobStatus[]).map(
                      (s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div className="space-y-2 text-xs text-[#2C3752]">
                <p className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-[#647087]" />
                  <span>
                    {selectedJob.address}, {selectedJob.location} ({selectedJob.postcode})
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-[#647087]" />
                  <span>Duration: {selectedJob.durationHours} hours</span>
                </p>
                <p className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-[#647087]" />
                  <span>Supervisor: {getMemberName(selectedJob.leadMemberId)}</span>
                </p>
              </div>

              <div className="border-t border-[#EEF0F5] pt-4">
                <label className="block text-xs font-semibold text-[#0F1B3D] mb-1.5">
                  Operational Job Notes
                </label>
                <textarea
                  rows={3}
                  value={detailNotes}
                  onChange={(e) => setDetailNotes(e.target.value)}
                  className="w-full rounded-lg border border-[#E8EAF0] px-3 py-2 text-xs focus:border-[#8A6A2C] focus:outline-none"
                />
                <div className="mt-3 flex flex-wrap justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => updateJob(selectedJob.id, { notes: detailNotes })}
                    className="rounded-lg border border-[#E8EAF0] px-3.5 py-2 text-xs font-medium text-[#0F1B3D] hover:bg-[#F7F8FA] cursor-pointer"
                  >
                    Save Job Notes
                  </button>
                  {selectedJob.status !== 'Completed' && (
                    <button
                      type="button"
                      onClick={() => updateJobStatus(selectedJob.id, 'Completed')}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F1B3D] px-4 py-2 text-xs font-medium text-white hover:bg-[#1A2B5C] cursor-pointer"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Mark Completed</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Job Modal */}
      {createOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F1B3D]/45 p-4 backdrop-blur-[1px]"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex max-h-[92vh] w-full max-w-xl flex-col rounded-xl border border-[#E8EAF0] bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[#EEF0F5] px-6 py-4">
              <h2 className="font-display text-lg font-bold text-[#0F1B3D]">
                Schedule Cleaning Job
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

            <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {acceptedQuotes.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-[#0F1B3D] mb-1">
                    Prefill from Accepted Quotation (Optional)
                  </label>
                  <select
                    value={formQuoteId}
                    onChange={(e) => handlePrefillFromQuote(e.target.value)}
                    className="w-full rounded-lg border border-[#E8EAF0] bg-[#F7F8FA] px-3 py-2 text-xs focus:border-[#8A6A2C] focus:outline-none"
                  >
                    <option value="">— Manual job entry —</option>
                    {acceptedQuotes.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.reference} — {q.companyName || q.customerName} ({q.serviceCategory})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#0F1B3D] mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formCustomer}
                    onChange={(e) => setFormCustomer(e.target.value)}
                    className="w-full rounded-lg border border-[#E8EAF0] px-3 py-2 text-sm focus:border-[#8A6A2C] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0F1B3D] mb-1">
                    Company (if commercial)
                  </label>
                  <input
                    type="text"
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)}
                    className="w-full rounded-lg border border-[#E8EAF0] px-3 py-2 text-sm focus:border-[#8A6A2C] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0F1B3D] mb-1">
                    Service
                  </label>
                  <select
                    value={formService}
                    onChange={(e) => setFormService(e.target.value as ServiceCategory)}
                    className="w-full rounded-lg border border-[#E8EAF0] bg-white px-3 py-2 text-sm focus:border-[#8A6A2C] focus:outline-none"
                  >
                    {SERVICE_CATEGORIES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0F1B3D] mb-1">
                    Location Area
                  </label>
                  <select
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value as OperatingArea)}
                    className="w-full rounded-lg border border-[#E8EAF0] bg-white px-3 py-2 text-sm focus:border-[#8A6A2C] focus:outline-none"
                  >
                    {OPERATING_AREAS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0F1B3D] mb-1">
                    Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    className="w-full rounded-lg border border-[#E8EAF0] px-3 py-2 text-sm focus:border-[#8A6A2C] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0F1B3D] mb-1">
                    Postcode *
                  </label>
                  <input
                    type="text"
                    required
                    value={formPostcode}
                    onChange={(e) => setFormPostcode(e.target.value)}
                    className="w-full rounded-lg border border-[#E8EAF0] px-3 py-2 text-sm focus:border-[#8A6A2C] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0F1B3D] mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full rounded-lg border border-[#E8EAF0] px-3 py-2 text-sm focus:border-[#8A6A2C] focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#0F1B3D] mb-1">
                      Start
                    </label>
                    <input
                      type="time"
                      value={formStartTime}
                      onChange={(e) => setFormStartTime(e.target.value)}
                      className="w-full rounded-lg border border-[#E8EAF0] px-2.5 py-2 text-sm focus:border-[#8A6A2C] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#0F1B3D] mb-1">
                      Hours
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="0.5"
                      value={formDuration}
                      onChange={(e) => setFormDuration(parseFloat(e.target.value) || 2)}
                      className="w-full rounded-lg border border-[#E8EAF0] px-2.5 py-2 font-mono-tabular text-sm focus:border-[#8A6A2C] focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0F1B3D] mb-1">
                    Cleaning Team
                  </label>
                  <select
                    value={formTeam}
                    onChange={(e) => setFormTeam(e.target.value)}
                    className="w-full rounded-lg border border-[#E8EAF0] bg-white px-3 py-2 text-sm focus:border-[#8A6A2C] focus:outline-none"
                  >
                    {SQUAD_PRESETS.map((sq) => (
                      <option key={sq} value={sq}>
                        {sq}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0F1B3D] mb-1">
                    Lead Supervisor
                  </label>
                  <select
                    value={formLeadId}
                    onChange={(e) => setFormLeadId(e.target.value)}
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

              <div className="flex items-center gap-3">
                <input
                  id="job-recurring"
                  type="checkbox"
                  checked={formRecurring}
                  onChange={(e) => setFormRecurring(e.target.checked)}
                  className="h-4 w-4 accent-[#0F1B3D]"
                />
                <label htmlFor="job-recurring" className="text-xs font-medium text-[#0F1B3D]">
                  Recurring job schedule
                </label>
                {formRecurring && (
                  <input
                    type="text"
                    value={formPattern}
                    onChange={(e) => setFormPattern(e.target.value)}
                    placeholder="e.g. Weekly"
                    className="rounded-lg border border-[#E8EAF0] px-2.5 py-1 text-xs focus:border-[#8A6A2C] focus:outline-none"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F1B3D] mb-1">
                  Job Instructions / Keys / Access
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full rounded-lg border border-[#E8EAF0] px-3 py-2 text-xs focus:border-[#8A6A2C] focus:outline-none"
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
                  Confirm Job Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
