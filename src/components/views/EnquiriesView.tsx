import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Plus,
  LayoutGrid,
  List,
  X,
  Phone,
  Mail,
  MapPin,
  FileSpreadsheet,
  Calendar,
  BellRing,
  Sparkles,
  Trash2,
  Edit3,
  MessageSquarePlus,
} from 'lucide-react';
import {
  Enquiry,
  EnquirySource,
  EnquiryStatus,
  OperatingArea,
  Priority,
  ServiceCategory,
} from '../../types/operations';
import { useOperations } from '../../context/OperationsContext';
import {
  OPERATING_AREAS,
  SERVICE_CATEGORIES,
  formatGBP,
  formatUKDate,
  formatUKDateTime,
  getTodayISODate,
  isValidEmail,
} from '../../utils/formatters';
import { PriorityLabel, StatusBadge } from '../common/StatusBadge';

const ENQUIRY_STATUSES: EnquiryStatus[] = [
  'New',
  'Contacted',
  'Awaiting Assessment',
  'Quote Required',
  'Quote Sent',
  'Accepted',
  'Converted',
  'Closed',
];

const PRIORITIES: Priority[] = ['Urgent', 'High', 'Medium', 'Low'];
const FREQUENCIES: Enquiry['frequency'][] = [
  'One-off',
  'Daily',
  '3x Weekly',
  'Weekly',
  'Fortnightly',
  'Monthly',
];
const SOURCES: EnquirySource[] = [
  'Website Booking Form',
  'Commercial Quote Request',
  'Telephone',
  'Email',
  'Referral',
];

const PRIORITY_RANK: Record<Priority, number> = {
  Urgent: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

interface EnquiryFormState {
  customerName: string;
  companyName: string;
  email: string;
  phone: string;
  service: ServiceCategory;
  location: OperatingArea;
  address: string;
  postcode: string;
  propertyType: string;
  frequency: Enquiry['frequency'];
  preferredDate: string;
  source: EnquirySource;
  status: EnquiryStatus;
  priority: Priority;
  assignedToId: string;
  summary: string;
}

const DEFAULT_FORM: EnquiryFormState = {
  customerName: '',
  companyName: '',
  email: '',
  phone: '',
  service: 'Domestic Cleaning',
  location: 'Islington',
  address: '',
  postcode: '',
  propertyType: '',
  frequency: 'Weekly',
  preferredDate: getTodayISODate(),
  source: 'Website Booking Form',
  status: 'New',
  priority: 'Medium',
  assignedToId: 'tm-1',
  summary: '',
};

export const EnquiriesView: React.FC = () => {
  const {
    state,
    navPayload,
    clearNavPayload,
    navigateTo,
    createEnquiry,
    updateEnquiry,
    addEnquiryNote,
    deleteEnquiry,
    requestConfirm,
    getMemberName,
  } = useOperations();

  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [serviceFilter, setServiceFilter] = useState<string>('All');
  const [locationFilter, setLocationFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'priority'>('newest');

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EnquiryFormState>(DEFAULT_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [newNoteText, setNewNoteText] = useState('');

  useEffect(() => {
    if (!navPayload) return;
    if (navPayload.openCreateEnquiry) {
      setEditingId(null);
      setForm({ ...DEFAULT_FORM, preferredDate: getTodayISODate() });
      setFormErrors({});
      setFormOpen(true);
      clearNavPayload();
    } else if (navPayload.selectedEnquiryId) {
      setSelectedId(navPayload.selectedEnquiryId);
      clearNavPayload();
    }
  }, [navPayload, clearNavPayload]);

  const filteredEnquiries = useMemo(() => {
    const q = search.trim().toLowerCase();
    return state.enquiries
      .filter((e) => {
        if (statusFilter !== 'All' && e.status !== statusFilter) return false;
        if (serviceFilter !== 'All' && e.service !== serviceFilter) return false;
        if (locationFilter !== 'All' && e.location !== locationFilter) return false;
        if (!q) return true;
        return (
          e.customerName.toLowerCase().includes(q) ||
          (e.companyName && e.companyName.toLowerCase().includes(q)) ||
          e.reference.toLowerCase().includes(q) ||
          e.postcode.toLowerCase().includes(q) ||
          e.address.toLowerCase().includes(q) ||
          e.service.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return b.createdAt.localeCompare(a.createdAt);
        if (sortBy === 'oldest') return a.createdAt.localeCompare(b.createdAt);
        return PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
      });
  }, [state.enquiries, search, statusFilter, serviceFilter, locationFilter, sortBy]);

  const selectedEnquiry = useMemo(
    () => state.enquiries.find((e) => e.id === selectedId) || null,
    [state.enquiries, selectedId]
  );

  const openCreateModal = () => {
    setEditingId(null);
    setForm({ ...DEFAULT_FORM, preferredDate: getTodayISODate() });
    setFormErrors({});
    setFormOpen(true);
  };

  const openEditModal = (enq: Enquiry) => {
    setEditingId(enq.id);
    setForm({
      customerName: enq.customerName,
      companyName: enq.companyName || '',
      email: enq.email,
      phone: enq.phone,
      service: enq.service,
      location: enq.location,
      address: enq.address,
      postcode: enq.postcode,
      propertyType: enq.propertyType,
      frequency: enq.frequency,
      preferredDate: enq.preferredDate,
      source: enq.source,
      status: enq.status,
      priority: enq.priority,
      assignedToId: enq.assignedToId,
      summary: enq.summary,
    });
    setFormErrors({});
    setFormOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.customerName.trim()) errors.customerName = 'Customer name is required.';
    if (!form.email.trim() || !isValidEmail(form.email)) {
      errors.email = 'Please enter a valid email address.';
    }
    if (!form.phone.trim()) errors.phone = 'Contact phone number is required.';
    if (!form.address.trim()) errors.address = 'Street address is required.';
    if (!form.postcode.trim()) errors.postcode = 'UK postcode is required.';
    if (!form.propertyType.trim()) errors.propertyType = 'Property or building type is required.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      ...form,
      companyName: form.companyName.trim() || undefined,
      customerName: form.customerName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      postcode: form.postcode.trim().toUpperCase(),
      propertyType: form.propertyType.trim(),
      summary: form.summary.trim() || `${form.service} enquiry for ${form.propertyType.trim()}.`,
    };

    if (editingId) {
      updateEnquiry(editingId, payload, 'Enquiry details updated');
      setSelectedId(editingId);
    } else {
      const created = createEnquiry(payload);
      setSelectedId(created.id);
    }
    setFormOpen(false);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnquiry || !newNoteText.trim()) return;
    addEnquiryNote(selectedEnquiry.id, newNoteText.trim());
    setNewNoteText('');
  };

  const linkedQuotes = useMemo(
    () =>
      selectedEnquiry
        ? state.quotations.filter((q) => q.enquiryId === selectedEnquiry.id)
        : [],
    [state.quotations, selectedEnquiry]
  );

  const linkedVisits = useMemo(
    () =>
      selectedEnquiry
        ? state.siteVisits.filter((v) => v.enquiryId === selectedEnquiry.id)
        : [],
    [state.siteVisits, selectedEnquiry]
  );

  const linkedFollowUps = useMemo(
    () =>
      selectedEnquiry
        ? state.followUps.filter((f) => f.enquiryId === selectedEnquiry.id)
        : [],
    [state.followUps, selectedEnquiry]
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-[#0F1B3D]">Enquiry Management</h1>
          <p className="text-sm text-[#647087]">
            Central intake for domestic bookings and commercial cleaning enquiries ({filteredEnquiries.length} shown).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="inline-flex rounded-lg border border-[#E8EAF0] bg-white p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              aria-label="Table view"
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-[#F7F2E7] text-[#8A6A2C]'
                  : 'text-[#647087] hover:text-[#0F1B3D]'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              aria-label="Card view"
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-[#F7F2E7] text-[#8A6A2C]'
                  : 'text-[#647087] hover:text-[#0F1B3D]'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Cards</span>
            </button>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F1B3D] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#1A2B5C] transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Enquiry</span>
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="grid grid-cols-1 gap-2.5 rounded-xl border border-[#E8EAF0] bg-white p-3.5 sm:grid-cols-2 lg:grid-cols-6">
        <div className="relative lg:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#647087]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, company, postcode, ref..."
            className="w-full rounded-lg border border-[#E8EAF0] bg-[#F7F8FA] py-2 pl-9 pr-3 text-xs text-[#0F1B3D] placeholder-[#647087] focus:border-[#8A6A2C] focus:bg-white focus:outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
          className="rounded-lg border border-[#E8EAF0] bg-white px-3 py-2 text-xs text-[#0F1B3D] focus:border-[#8A6A2C] focus:outline-none"
        >
          <option value="All">All Statuses</option>
          {ENQUIRY_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          value={serviceFilter}
          onChange={(e) => setServiceFilter(e.target.value)}
          aria-label="Filter by service"
          className="rounded-lg border border-[#E8EAF0] bg-white px-3 py-2 text-xs text-[#0F1B3D] focus:border-[#8A6A2C] focus:outline-none"
        >
          <option value="All">All Services</option>
          {SERVICE_CATEGORIES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          aria-label="Filter by location"
          className="rounded-lg border border-[#E8EAF0] bg-white px-3 py-2 text-xs text-[#0F1B3D] focus:border-[#8A6A2C] focus:outline-none"
        >
          <option value="All">All Areas</option>
          {OPERATING_AREAS.map((area) => (
            <option key={area} value={area}>
              {area}
            </option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'priority')}
          aria-label="Sort enquiries"
          className="rounded-lg border border-[#E8EAF0] bg-white px-3 py-2 text-xs text-[#0F1B3D] focus:border-[#8A6A2C] focus:outline-none"
        >
          <option value="newest">Sort: Newest First</option>
          <option value="oldest">Sort: Oldest First</option>
          <option value="priority">Sort: Highest Priority</option>
        </select>
      </div>

      {/* Empty State */}
      {filteredEnquiries.length === 0 ? (
        <div className="rounded-xl border border-[#E8EAF0] bg-white p-10 text-center">
          <p className="font-display text-base font-semibold text-[#0F1B3D]">
            No enquiries match your current filters
          </p>
          <p className="mt-1 text-sm text-[#647087]">
            Adjust the search or filters above, or log a new customer enquiry.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatusFilter('All');
                setServiceFilter('All');
                setLocationFilter('All');
              }}
              className="rounded-lg border border-[#E8EAF0] px-4 py-2 text-xs font-medium text-[#0F1B3D] hover:bg-[#F7F8FA] cursor-pointer"
            >
              Clear Filters
            </button>
            <button
              type="button"
              onClick={openCreateModal}
              className="rounded-lg bg-[#0F1B3D] px-4 py-2 text-xs font-medium text-white hover:bg-[#1A2B5C] cursor-pointer"
            >
              Add Enquiry
            </button>
          </div>
        </div>
      ) : viewMode === 'table' ? (
        <div className="overflow-hidden rounded-xl border border-[#E8EAF0] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[#EEF0F5] bg-[#F7F8FA] text-[11.5px] font-semibold text-[#647087]">
                  <th className="py-3 px-4">Ref</th>
                  <th className="py-3 px-4">Client / Company</th>
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-4">Area & Postcode</th>
                  <th className="py-3 px-4">Preferred Date</th>
                  <th className="py-3 px-4">Assignee</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF0F5] text-sm">
                {filteredEnquiries.map((enq) => (
                  <tr
                    key={enq.id}
                    onClick={() => setSelectedId(enq.id)}
                    className={`cursor-pointer transition-colors hover:bg-[#F7F8FA] ${
                      selectedId === enq.id ? 'bg-[#EEF1F7]/70' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-mono-tabular text-xs font-medium text-[#0F1B3D] whitespace-nowrap">
                      {enq.reference}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-[#0F1B3D]">
                        {enq.companyName || enq.customerName}
                      </p>
                      <p className="text-xs text-[#647087]">
                        {enq.companyName ? `${enq.customerName} · ` : ''}
                        <PriorityLabel priority={enq.priority} />
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-xs font-medium text-[#0F1B3D]">{enq.service}</p>
                      <p className="text-[11.5px] text-[#647087]">{enq.frequency}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-xs font-medium text-[#0F1B3D]">{enq.location}</p>
                      <p className="font-mono-tabular text-[11.5px] text-[#647087]">
                        {enq.postcode}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-xs text-[#0F1B3D] whitespace-nowrap tabular-nums">
                      {formatUKDate(enq.preferredDate)}
                    </td>
                    <td className="py-3 px-4 text-xs text-[#647087] whitespace-nowrap">
                      {getMemberName(enq.assignedToId)}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={enq.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
          {filteredEnquiries.map((enq) => (
            <div
              key={enq.id}
              onClick={() => setSelectedId(enq.id)}
              className={`cursor-pointer rounded-xl border bg-white p-4 transition-all hover:border-[#8A6A2C]/60 ${
                selectedId === enq.id ? 'border-[#8A6A2C]' : 'border-[#E8EAF0]'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-mono-tabular text-[11.5px] text-[#647087]">
                    {enq.reference} · {enq.source}
                  </p>
                  <h3 className="mt-0.5 font-display text-sm font-semibold text-[#0F1B3D] truncate">
                    {enq.companyName || enq.customerName}
                  </h3>
                  {enq.companyName && (
                    <p className="text-xs text-[#647087]">{enq.customerName}</p>
                  )}
                </div>
                <StatusBadge status={enq.status} />
              </div>

              <p className="mt-2.5 text-xs text-[#2C3752] line-clamp-2 leading-relaxed">
                {enq.summary}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-[#EEF0F5] pt-3 text-[11.5px] text-[#647087]">
                <span className="font-medium text-[#0F1B3D]">{enq.service}</span>
                <span aria-hidden="true">·</span>
                <span>
                  {enq.location} ({enq.postcode})
                </span>
                <span aria-hidden="true">·</span>
                <span>{enq.frequency}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detailed Side Drawer */}
      {selectedEnquiry && (
        <div className="fixed inset-0 z-40 flex justify-end bg-[#0F1B3D]/40 backdrop-blur-[1px]">
          <div className="flex h-full w-full max-w-xl flex-col bg-white shadow-2xl border-l border-[#E8EAF0]">
            <div className="flex items-start justify-between gap-4 border-b border-[#EEF0F5] px-6 py-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-[#647087]">
                  <span className="font-mono-tabular font-semibold text-[#8A6A2C]">
                    {selectedEnquiry.reference}
                  </span>
                  <span>·</span>
                  <span>Logged {formatUKDate(selectedEnquiry.createdAt)}</span>
                </div>
                <h2 className="mt-1 font-display text-lg font-bold text-[#0F1B3D] truncate">
                  {selectedEnquiry.companyName || selectedEnquiry.customerName}
                </h2>
                {selectedEnquiry.companyName && (
                  <p className="text-xs text-[#647087]">Contact: {selectedEnquiry.customerName}</p>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => openEditModal(selectedEnquiry)}
                  aria-label="Edit enquiry"
                  className="rounded-lg border border-[#E8EAF0] p-2 text-[#0F1B3D] hover:bg-[#F7F8FA] cursor-pointer"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    requestConfirm({
                      title: `Delete ${selectedEnquiry.reference}?`,
                      description:
                        'This removes the fictional enquiry from the concept workspace.',
                      confirmLabel: 'Delete Enquiry',
                      variant: 'danger',
                      onConfirm: () => {
                        deleteEnquiry(selectedEnquiry.id);
                        setSelectedId(null);
                      },
                    })
                  }
                  aria-label="Delete enquiry"
                  className="rounded-lg border border-[#E8EAF0] p-2 text-[#B91C1C] hover:bg-[#FEF2F2] cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  aria-label="Close drawer"
                  className="rounded-lg p-2 text-[#647087] hover:bg-[#F7F8FA] hover:text-[#0F1B3D] cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* Stage & Assignment Controls */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 rounded-xl bg-[#F7F8FA] p-4 border border-[#E8EAF0]">
                <div>
                  <label
                    htmlFor="drawer-status"
                    className="block text-[11.5px] font-semibold text-[#647087] mb-1"
                  >
                    Enquiry Stage
                  </label>
                  <select
                    id="drawer-status"
                    value={selectedEnquiry.status}
                    onChange={(e) =>
                      updateEnquiry(
                        selectedEnquiry.id,
                        { status: e.target.value as EnquiryStatus },
                        `Stage updated to ${e.target.value}`
                      )
                    }
                    className="w-full rounded-lg border border-[#E8EAF0] bg-white px-3 py-2 text-xs font-medium text-[#0F1B3D] focus:border-[#8A6A2C] focus:outline-none"
                  >
                    {ENQUIRY_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="drawer-assignee"
                    className="block text-[11.5px] font-semibold text-[#647087] mb-1"
                  >
                    Assigned Team Member
                  </label>
                  <select
                    id="drawer-assignee"
                    value={selectedEnquiry.assignedToId}
                    onChange={(e) =>
                      updateEnquiry(
                        selectedEnquiry.id,
                        { assignedToId: e.target.value },
                        `Reassigned to ${getMemberName(e.target.value)}`
                      )
                    }
                    className="w-full rounded-lg border border-[#E8EAF0] bg-white px-3 py-2 text-xs font-medium text-[#0F1B3D] focus:border-[#8A6A2C] focus:outline-none"
                  >
                    {state.teamMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick Workflow Actions */}
              <div>
                <p className="text-xs font-semibold text-[#0F1B3D] mb-2">Workflow Actions</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      navigateTo('quotations', {
                        openCreateQuoteForEnquiryId: selectedEnquiry.id,
                      })
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F1B3D] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1A2B5C] cursor-pointer"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    <span>Create Quote</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      navigateTo('visits', {
                        openCreateVisitForEnquiryId: selectedEnquiry.id,
                      })
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#E8EAF0] bg-white px-3 py-1.5 text-xs font-medium text-[#0F1B3D] hover:bg-[#F7F2E7] cursor-pointer"
                  >
                    <Calendar className="h-3.5 w-3.5 text-[#8A6A2C]" />
                    <span>Schedule Visit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      navigateTo('followups', {
                        openCreateFollowUpForEnquiryId: selectedEnquiry.id,
                      })
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#E8EAF0] bg-white px-3 py-1.5 text-xs font-medium text-[#0F1B3D] hover:bg-[#F7F2E7] cursor-pointer"
                  >
                    <BellRing className="h-3.5 w-3.5 text-[#8A6A2C]" />
                    <span>Add Follow-up</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      navigateTo('assistant', {
                        assistantEnquiryId: selectedEnquiry.id,
                        assistantAction: 'acknowledge',
                      })
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#E8EAF0] bg-white px-3 py-1.5 text-xs font-medium text-[#0F1B3D] hover:bg-[#F7F2E7] cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-[#8A6A2C]" />
                    <span>Draft Message</span>
                  </button>
                </div>
              </div>

              {/* Contact & Property Details */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 border-t border-[#EEF0F5] pt-4 text-xs">
                <div className="space-y-2">
                  <p className="font-semibold text-[#0F1B3D]">Contact Details</p>
                  <p className="flex items-center gap-2 text-[#2C3752]">
                    <Mail className="h-3.5 w-3.5 text-[#647087]" />
                    <span>{selectedEnquiry.email}</span>
                  </p>
                  <p className="flex items-center gap-2 text-[#2C3752]">
                    <Phone className="h-3.5 w-3.5 text-[#647087]" />
                    <span className="font-mono-tabular">{selectedEnquiry.phone}</span>
                  </p>
                  <p className="flex items-start gap-2 text-[#2C3752]">
                    <MapPin className="h-3.5 w-3.5 text-[#647087] mt-0.5 shrink-0" />
                    <span>
                      {selectedEnquiry.address}, {selectedEnquiry.location},{' '}
                      <span className="font-mono-tabular">{selectedEnquiry.postcode}</span>
                    </span>
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="font-semibold text-[#0F1B3D]">Cleaning Specification</p>
                  <p className="text-[#2C3752]">
                    <span className="text-[#647087]">Service:</span> {selectedEnquiry.service}
                  </p>
                  <p className="text-[#2C3752]">
                    <span className="text-[#647087]">Property:</span> {selectedEnquiry.propertyType}
                  </p>
                  <p className="text-[#2C3752]">
                    <span className="text-[#647087]">Frequency:</span> {selectedEnquiry.frequency} ·{' '}
                    Preferred: {formatUKDate(selectedEnquiry.preferredDate)}
                  </p>
                </div>
              </div>

              <div className="border-t border-[#EEF0F5] pt-4">
                <p className="text-xs font-semibold text-[#0F1B3D]">Requirements Summary</p>
                <p className="mt-1.5 text-sm leading-relaxed text-[#2C3752]">
                  {selectedEnquiry.summary}
                </p>
              </div>

              {/* Linked Records */}
              {(linkedQuotes.length > 0 || linkedVisits.length > 0 || linkedFollowUps.length > 0) && (
                <div className="border-t border-[#EEF0F5] pt-4 space-y-2.5">
                  <p className="text-xs font-semibold text-[#0F1B3D]">Connected Records</p>
                  {linkedQuotes.map((q) => (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => navigateTo('quotations', { selectedQuoteId: q.id })}
                      className="flex w-full items-center justify-between rounded-lg border border-[#E8EAF0] px-3 py-2 text-xs hover:bg-[#F7F8FA] cursor-pointer"
                    >
                      <span className="font-medium text-[#0F1B3D]">
                        Quote {q.reference} · {formatGBP(q.total)}
                      </span>
                      <StatusBadge status={q.status} />
                    </button>
                  ))}
                  {linkedVisits.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => navigateTo('visits', { selectedVisitId: v.id })}
                      className="flex w-full items-center justify-between rounded-lg border border-[#E8EAF0] px-3 py-2 text-xs hover:bg-[#F7F8FA] cursor-pointer"
                    >
                      <span className="font-medium text-[#0F1B3D]">
                        Visit {v.reference} · {formatUKDate(v.date)} at {v.time}
                      </span>
                      <StatusBadge status={v.status} />
                    </button>
                  ))}
                  {linkedFollowUps.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => navigateTo('followups')}
                      className="flex w-full items-center justify-between rounded-lg border border-[#E8EAF0] px-3 py-2 text-xs hover:bg-[#F7F8FA] cursor-pointer"
                    >
                      <span className="font-medium text-[#0F1B3D]">
                        Follow-up: {f.type} ({formatUKDate(f.dueDate)})
                      </span>
                      <StatusBadge status={f.status} />
                    </button>
                  ))}
                </div>
              )}

              {/* Internal Notes */}
              <div className="border-t border-[#EEF0F5] pt-4">
                <p className="text-xs font-semibold text-[#0F1B3D] mb-2">Internal Notes</p>
                <form onSubmit={handleAddNote} className="flex gap-2">
                  <input
                    type="text"
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="Add an internal operational note..."
                    className="flex-1 rounded-lg border border-[#E8EAF0] px-3 py-2 text-xs text-[#0F1B3D] focus:border-[#8A6A2C] focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!newNoteText.trim()}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F1B3D] px-3 py-2 text-xs font-medium text-white hover:bg-[#1A2B5C] disabled:opacity-40 cursor-pointer"
                  >
                    <MessageSquarePlus className="h-3.5 w-3.5" />
                    <span>Add</span>
                  </button>
                </form>

                {selectedEnquiry.notes.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {selectedEnquiry.notes.map((n) => (
                      <div
                        key={n.id}
                        className="rounded-lg bg-[#F7F8FA] p-3 text-xs border border-[#E8EAF0]"
                      >
                        <div className="flex items-center justify-between text-[#647087]">
                          <span className="font-semibold text-[#0F1B3D]">{n.author}</span>
                          <span>{formatUKDateTime(n.timestamp)}</span>
                        </div>
                        <p className="mt-1 text-[#0F1B3D] leading-relaxed">{n.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Activity History */}
              <div className="border-t border-[#EEF0F5] pt-4">
                <p className="text-xs font-semibold text-[#0F1B3D] mb-2.5">Activity History</p>
                {selectedEnquiry.activities.length === 0 ? (
                  <p className="text-xs text-[#647087]">No activity logged yet.</p>
                ) : (
                  <div className="space-y-2.5">
                    {selectedEnquiry.activities.map((act) => (
                      <div key={act.id} className="flex items-start justify-between gap-3 text-xs">
                        <div>
                          <p className="font-medium text-[#0F1B3D]">{act.action}</p>
                          <p className="text-[#647087]">{act.author}</p>
                        </div>
                        <span className="text-[11px] text-[#647087] whitespace-nowrap">
                          {formatUKDateTime(act.timestamp)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Enquiry Modal */}
      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F1B3D]/45 p-4 backdrop-blur-[1px]"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-xl border border-[#E8EAF0] bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[#EEF0F5] px-6 py-4">
              <h2 className="font-display text-lg font-bold text-[#0F1B3D]">
                {editingId ? 'Edit Enquiry' : 'Log New Enquiry'}
              </h2>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                aria-label="Close modal"
                className="rounded-lg p-1.5 text-[#647087] hover:bg-[#F7F8FA] cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#0F1B3D] mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full rounded-lg border border-[#E8EAF0] px-3 py-2 text-sm focus:border-[#8A6A2C] focus:outline-none"
                  />
                  {formErrors.customerName && (
                    <p className="mt-1 text-xs text-[#DC2626]">{formErrors.customerName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F1B3D] mb-1">
                    Company Name (if commercial)
                  </label>
                  <input
                    type="text"
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                    placeholder="Optional"
                    className="w-full rounded-lg border border-[#E8EAF0] px-3 py-2 text-sm focus:border-[#8A6A2C] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F1B3D] mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="name@example-demo.co.uk"
                    className="w-full rounded-lg border border-[#E8EAF0] px-3 py-2 text-sm focus:border-[#8A6A2C] focus:outline-none"
                  />
                  {formErrors.email && (
                    <p className="mt-1 text-xs text-[#DC2626]">{formErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F1B3D] mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="020 7946 0000"
                    className="w-full rounded-lg border border-[#E8EAF0] px-3 py-2 text-sm focus:border-[#8A6A2C] focus:outline-none"
                  />
                  {formErrors.phone && (
                    <p className="mt-1 text-xs text-[#DC2626]">{formErrors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F1B3D] mb-1">
                    Cleaning Service
                  </label>
                  <select
                    value={form.service}
                    onChange={(e) =>
                      setForm({ ...form, service: e.target.value as ServiceCategory })
                    }
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
                    Operating Area
                  </label>
                  <select
                    value={form.location}
                    onChange={(e) =>
                      setForm({ ...form, location: e.target.value as OperatingArea })
                    }
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
                    Street Address *
                  </label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="e.g. 48 Highbury Park"
                    className="w-full rounded-lg border border-[#E8EAF0] px-3 py-2 text-sm focus:border-[#8A6A2C] focus:outline-none"
                  />
                  {formErrors.address && (
                    <p className="mt-1 text-xs text-[#DC2626]">{formErrors.address}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F1B3D] mb-1">
                    Postcode *
                  </label>
                  <input
                    type="text"
                    value={form.postcode}
                    onChange={(e) => setForm({ ...form, postcode: e.target.value })}
                    placeholder="e.g. N5 2XS"
                    className="w-full rounded-lg border border-[#E8EAF0] px-3 py-2 text-sm focus:border-[#8A6A2C] focus:outline-none"
                  />
                  {formErrors.postcode && (
                    <p className="mt-1 text-xs text-[#DC2626]">{formErrors.postcode}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F1B3D] mb-1">
                    Property / Building Type *
                  </label>
                  <input
                    type="text"
                    value={form.propertyType}
                    onChange={(e) => setForm({ ...form, propertyType: e.target.value })}
                    placeholder="e.g. 3-Bed Flat or 2-Storey Office"
                    className="w-full rounded-lg border border-[#E8EAF0] px-3 py-2 text-sm focus:border-[#8A6A2C] focus:outline-none"
                  />
                  {formErrors.propertyType && (
                    <p className="mt-1 text-xs text-[#DC2626]">{formErrors.propertyType}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F1B3D] mb-1">
                    Requested Frequency
                  </label>
                  <select
                    value={form.frequency}
                    onChange={(e) =>
                      setForm({ ...form, frequency: e.target.value as Enquiry['frequency'] })
                    }
                    className="w-full rounded-lg border border-[#E8EAF0] bg-white px-3 py-2 text-sm focus:border-[#8A6A2C] focus:outline-none"
                  >
                    {FREQUENCIES.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F1B3D] mb-1">
                    Preferred Start Date
                  </label>
                  <input
                    type="date"
                    value={form.preferredDate}
                    onChange={(e) => setForm({ ...form, preferredDate: e.target.value })}
                    className="w-full rounded-lg border border-[#E8EAF0] px-3 py-2 text-sm focus:border-[#8A6A2C] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F1B3D] mb-1">
                    Enquiry Source
                  </label>
                  <select
                    value={form.source}
                    onChange={(e) =>
                      setForm({ ...form, source: e.target.value as EnquirySource })
                    }
                    className="w-full rounded-lg border border-[#E8EAF0] bg-white px-3 py-2 text-sm focus:border-[#8A6A2C] focus:outline-none"
                  >
                    {SOURCES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F1B3D] mb-1">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
                    className="w-full rounded-lg border border-[#E8EAF0] bg-white px-3 py-2 text-sm focus:border-[#8A6A2C] focus:outline-none"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F1B3D] mb-1">
                    Assigned Team Member
                  </label>
                  <select
                    value={form.assignedToId}
                    onChange={(e) => setForm({ ...form, assignedToId: e.target.value })}
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
                  Summary / Cleaning Requirements
                </label>
                <textarea
                  rows={3}
                  value={form.summary}
                  onChange={(e) => setForm({ ...form, summary: e.target.value })}
                  placeholder="Describe rooms, access instructions, or special cleaning requests..."
                  className="w-full rounded-lg border border-[#E8EAF0] px-3 py-2 text-sm focus:border-[#8A6A2C] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-[#EEF0F5] pt-4">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="rounded-lg border border-[#E8EAF0] px-4 py-2 text-sm font-medium text-[#0F1B3D] hover:bg-[#F7F8FA] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#0F1B3D] px-5 py-2 text-sm font-medium text-white hover:bg-[#1A2B5C] cursor-pointer"
                >
                  {editingId ? 'Save Changes' : 'Create Enquiry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
