import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Download,
  Send,
  CheckCircle2,
  XCircle,
  Edit3,
  X,
  CalendarPlus,
  BellRing,
  Info,
} from 'lucide-react';
import {
  OperatingArea,
  Quotation,
  QuoteAdditionalService,
  QuoteStatus,
  ServiceCategory,
} from '../../types/operations';
import { useOperations } from '../../context/OperationsContext';
import {
  OPERATING_AREAS,
  SERVICE_CATEGORIES,
  addDaysISO,
  formatGBP,
  formatUKDate,
  formatUKDateTime,
  generateId,
  getTodayISODate,
} from '../../utils/formatters';
import { downloadQuotationPDF } from '../../utils/pdfGenerator';
import { StatusBadge } from '../common/StatusBadge';

const QUOTE_TABS: ('All' | QuoteStatus)[] = [
  'All',
  'Draft',
  'Ready for Review',
  'Sent (Demo)',
  'Accepted',
  'Rejected',
];

const DEFAULT_EXTRAS: QuoteAdditionalService[] = [
  { id: 'ex-1', label: 'Oven & Extractor Deep Degrease', amount: 55, selected: false },
  { id: 'ex-2', label: 'Carpet Steam Extraction (per zone)', amount: 75, selected: false },
  { id: 'ex-3', label: 'Internal Glass & Partition Detailing', amount: 60, selected: false },
  { id: 'ex-4', label: 'Eco Consumables & Restocking Pack', amount: 80, selected: false },
];

interface QuoteFormState {
  id?: string;
  enquiryId: string;
  customerName: string;
  companyName: string;
  location: OperatingArea;
  address: string;
  postcode: string;
  serviceCategory: ServiceCategory;
  serviceDescription: string;
  frequency: Quotation['frequency'];
  estimatedHours: number;
  hourlyRate: number;
  additionalServices: QuoteAdditionalService[];
  includeVat: boolean;
  vatRate: number;
  validUntil: string;
  status: QuoteStatus;
  termsAndNotes: string;
}

export const QuotationsView: React.FC = () => {
  const {
    state,
    navPayload,
    clearNavPayload,
    navigateTo,
    saveQuotation,
    updateQuoteStatus,
    showToast,
  } = useOperations();

  const [activeTab, setActiveTab] = useState<'All' | QuoteStatus>('All');
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<QuoteFormState | null>(null);
  const [customExtraLabel, setCustomExtraLabel] = useState('');
  const [customExtraAmount, setCustomExtraAmount] = useState('45');
  const [sentPromptQuoteId, setSentPromptQuoteId] = useState<string | null>(null);

  const buildFormFromEnquiry = (
    enquiryId: string,
    overrideHours?: number,
    overrideDesc?: string
  ): QuoteFormState => {
    const enq = state.enquiries.find((e) => e.id === enquiryId) || state.enquiries[0];
    const isCommercial =
      enq.service === 'Commercial Cleaning' ||
      enq.service === 'Office Cleaning' ||
      enq.service === 'Specialist Cleaning';
    return {
      enquiryId: enq.id,
      customerName: enq.customerName,
      companyName: enq.companyName || '',
      location: enq.location,
      address: enq.address,
      postcode: enq.postcode,
      serviceCategory: enq.service,
      serviceDescription: overrideDesc || enq.summary,
      frequency: enq.frequency,
      estimatedHours: overrideHours ?? (isCommercial ? 24 : 4),
      hourlyRate: isCommercial ? 22 : 21,
      additionalServices: DEFAULT_EXTRAS.map((x) => ({ ...x })),
      includeVat: isCommercial,
      vatRate: state.settings.defaultVatRate,
      validUntil: addDaysISO(getTodayISODate(), 21),
      status: 'Draft',
      termsAndNotes:
        'Illustrative quotation generated in Operations Hub concept. Final schedule and pricing subject to confirmation.',
    };
  };

  useEffect(() => {
    if (!navPayload) return;
    if (navPayload.selectedQuoteId) {
      setSelectedQuoteId(navPayload.selectedQuoteId);
      clearNavPayload();
    } else if (navPayload.prefillQuoteFromVisitId) {
      const visit = state.siteVisits.find((v) => v.id === navPayload.prefillQuoteFromVisitId);
      if (visit) {
        const desc = [
          visit.assessment.cleaningRequirements,
          visit.assessment.staffRecommendation
            ? `Recommended team: ${visit.assessment.staffRecommendation}`
            : '',
        ]
          .filter(Boolean)
          .join(' — ');
        setForm(
          buildFormFromEnquiry(
            visit.enquiryId,
            visit.assessment.estimatedHours || 4,
            desc || undefined
          )
        );
        setFormOpen(true);
      }
      clearNavPayload();
    } else if (navPayload.openCreateQuoteForEnquiryId) {
      setForm(buildFormFromEnquiry(navPayload.openCreateQuoteForEnquiryId));
      setFormOpen(true);
      clearNavPayload();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navPayload, clearNavPayload]);

  const filteredQuotes = useMemo(() => {
    if (activeTab === 'All') return state.quotations;
    return state.quotations.filter((q) => q.status === activeTab);
  }, [state.quotations, activeTab]);

  const selectedQuote = useMemo(
    () => state.quotations.find((q) => q.id === selectedQuoteId) || null,
    [state.quotations, selectedQuoteId]
  );

  // Live Totals Calculator for Quote Form
  const liveCalc = useMemo(() => {
    if (!form) return { base: 0, extras: 0, subtotal: 0, vatAmount: 0, total: 0 };
    const base = Math.max(0, form.estimatedHours) * Math.max(0, form.hourlyRate);
    const extras = form.additionalServices
      .filter((s) => s.selected)
      .reduce((acc, s) => acc + s.amount, 0);
    const subtotal = Number((base + extras).toFixed(2));
    const vatAmount = form.includeVat
      ? Number(((subtotal * form.vatRate) / 100).toFixed(2))
      : 0;
    const total = Number((subtotal + vatAmount).toFixed(2));
    return { base, extras, subtotal, vatAmount, total };
  }, [form]);

  const openNewQuote = () => {
    if (state.enquiries.length === 0) return;
    setForm(buildFormFromEnquiry(state.enquiries[0].id));
    setFormOpen(true);
  };

  const openEditQuote = (q: Quotation) => {
    setForm({
      id: q.id,
      enquiryId: q.enquiryId,
      customerName: q.customerName,
      companyName: q.companyName || '',
      location: q.location,
      address: q.address,
      postcode: q.postcode,
      serviceCategory: q.serviceCategory,
      serviceDescription: q.serviceDescription,
      frequency: q.frequency,
      estimatedHours: q.estimatedHours,
      hourlyRate: q.hourlyRate,
      additionalServices: q.additionalServices.map((x) => ({ ...x })),
      includeVat: q.includeVat,
      vatRate: q.vatRate,
      validUntil: q.validUntil,
      status: q.status,
      termsAndNotes: q.termsAndNotes,
    });
    setFormOpen(true);
  };

  const handleEnquiryChange = (enquiryId: string) => {
    if (!form) return;
    const enq = state.enquiries.find((e) => e.id === enquiryId);
    if (!enq) return;
    setForm({
      ...form,
      enquiryId: enq.id,
      customerName: enq.customerName,
      companyName: enq.companyName || '',
      location: enq.location,
      address: enq.address,
      postcode: enq.postcode,
      serviceCategory: enq.service,
      serviceDescription: enq.summary,
      frequency: enq.frequency,
    });
  };

  const handleAddCustomExtra = () => {
    if (!form || !customExtraLabel.trim()) return;
    const amt = parseFloat(customExtraAmount) || 0;
    if (amt <= 0) return;
    setForm({
      ...form,
      additionalServices: [
        ...form.additionalServices,
        {
          id: generateId('ex'),
          label: customExtraLabel.trim(),
          amount: amt,
          selected: true,
        },
      ],
    });
    setCustomExtraLabel('');
  };

  const handleSaveQuote = (targetStatus?: QuoteStatus) => {
    if (!form) return;
    if (!form.customerName.trim() || !form.serviceDescription.trim()) {
      showToast({
        type: 'error',
        title: 'Missing required fields',
        description: 'Customer name and service description are required.',
      });
      return;
    }

    const saved = saveQuotation({
      id: form.id,
      enquiryId: form.enquiryId,
      customerName: form.customerName.trim(),
      companyName: form.companyName.trim() || undefined,
      location: form.location,
      address: form.address.trim(),
      postcode: form.postcode.trim().toUpperCase(),
      serviceDescription: form.serviceDescription.trim(),
      serviceCategory: form.serviceCategory,
      frequency: form.frequency,
      estimatedHours: Number(form.estimatedHours) || 0,
      hourlyRate: Number(form.hourlyRate) || 0,
      additionalServices: form.additionalServices,
      includeVat: form.includeVat,
      vatRate: form.vatRate,
      subtotal: liveCalc.subtotal,
      vatAmount: liveCalc.vatAmount,
      total: liveCalc.total,
      status: targetStatus || form.status,
      termsAndNotes: form.termsAndNotes.trim(),
      validUntil: form.validUntil,
    });

    setFormOpen(false);
    setSelectedQuoteId(saved.id);
  };

  const handleMarkSentDemo = (quote: Quotation) => {
    if (state.settings.autoSuggestQuoteFollowUp) {
      setSentPromptQuoteId(quote.id);
    } else {
      updateQuoteStatus(quote.id, 'Sent (Demo)', false);
    }
  };

  const handleDownloadPdf = (quote: Quotation) => {
    downloadQuotationPDF(quote);
    showToast({
      type: 'success',
      title: `Downloaded ${quote.reference} PDF`,
      description: 'Formatted sample quotation saved to your device.',
    });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-[#0F1B3D]">Quotation Management</h1>
          <p className="text-sm text-[#647087]">
            Build, review, export PDF estimates, and convert accepted quotes into scheduled jobs.
          </p>
        </div>
        <button
          type="button"
          onClick={openNewQuote}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F1B3D] px-4 py-2 text-xs font-medium text-white hover:bg-[#1A2B5C] transition-colors whitespace-nowrap self-start cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Create Quotation</span>
        </button>
      </div>

      {/* Illustrative Rates Notice */}
      <div className="flex items-start gap-2.5 rounded-xl border border-[#DECFA8] bg-[#F7F2E7]/85 px-4 py-3 text-xs text-[#0F1B3D]">
        <Info className="h-4 w-4 text-[#8A6A2C] shrink-0 mt-0.5" />
        <p>
          <span className="font-semibold">Illustrative Rates Notice:</span> Hourly rates and add-on
          figures shown here are editable demonstration placeholders—not ABE Cleaning Services&apos;
          confirmed commercial pricing. No real emails are dispatched when marking quotes as Sent
          (Demo).
        </p>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-[#E8EAF0] bg-white p-1.5">
        {QUOTE_TABS.map((tab) => {
          const count =
            tab === 'All'
              ? state.quotations.length
              : state.quotations.filter((q) => q.status === tab).length;
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-[#0F1B3D] text-white'
                  : 'text-[#2C3752] hover:bg-[#F7F8FA] hover:text-[#0F1B3D]'
              }`}
            >
              <span>{tab}</span>
              <span
                className={`font-mono-tabular text-[11px] ${
                  isActive ? 'text-white/90' : 'text-[#647087]'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Quotations Table */}
      {filteredQuotes.length === 0 ? (
        <div className="rounded-xl border border-[#E8EAF0] bg-white p-10 text-center">
          <p className="font-display text-base font-semibold text-[#0F1B3D]">
            No quotations in &ldquo;{activeTab}&rdquo;
          </p>
          <p className="mt-1 text-sm text-[#647087]">
            Create a new quotation from any customer enquiry or switch tabs.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#E8EAF0] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[#EEF0F5] bg-[#F7F8FA] text-[11.5px] font-semibold text-[#647087]">
                  <th className="py-3 px-4">Quote Ref</th>
                  <th className="py-3 px-4">Client / Company</th>
                  <th className="py-3 px-4">Service & Area</th>
                  <th className="py-3 px-4 text-right">Hours × Rate</th>
                  <th className="py-3 px-4 text-right">Total (GBP)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF0F5] text-sm">
                {filteredQuotes.map((q) => (
                  <tr
                    key={q.id}
                    onClick={() => setSelectedQuoteId(q.id)}
                    className={`cursor-pointer transition-colors hover:bg-[#F7F8FA] ${
                      selectedQuoteId === q.id ? 'bg-[#EEF1F7]/70' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-mono-tabular text-xs font-semibold text-[#0F1B3D] whitespace-nowrap">
                      {q.reference}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-[#0F1B3D]">
                        {q.companyName || q.customerName}
                      </p>
                      <p className="text-xs text-[#647087]">
                        {q.companyName ? q.customerName : q.postcode} · Valid until{' '}
                        {formatUKDate(q.validUntil)}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-xs font-medium text-[#0F1B3D]">
                        {q.serviceCategory} ({q.frequency})
                      </p>
                      <p className="text-[11.5px] text-[#647087]">{q.location}</p>
                    </td>
                    <td className="py-3 px-4 text-right font-mono-tabular text-xs text-[#2C3752] whitespace-nowrap">
                      {q.estimatedHours}h × {formatGBP(q.hourlyRate)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono-tabular text-sm font-bold text-[#0F1B3D] whitespace-nowrap">
                      {formatGBP(q.total)}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={q.status} />
                    </td>
                    <td
                      className="py-3 px-4 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => handleDownloadPdf(q)}
                        aria-label={`Download PDF for ${q.reference}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#E8EAF0] bg-white px-2.5 py-1.5 text-xs font-medium text-[#0F1B3D] hover:bg-[#F7F8FA] cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5 text-[#8A6A2C]" />
                        <span>PDF</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Selected Quotation Detail Drawer */}
      {selectedQuote && (
        <div className="fixed inset-0 z-40 flex justify-end bg-[#0F1B3D]/40 backdrop-blur-[1px]">
          <div className="flex h-full w-full max-w-xl flex-col bg-white shadow-2xl border-l border-[#E8EAF0]">
            <div className="flex items-start justify-between gap-4 border-b border-[#EEF0F5] px-6 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono-tabular text-xs font-semibold text-[#8A6A2C]">
                    {selectedQuote.reference}
                  </span>
                  <StatusBadge status={selectedQuote.status} />
                </div>
                <h2 className="mt-1 font-display text-lg font-bold text-[#0F1B3D]">
                  {selectedQuote.companyName || selectedQuote.customerName}
                </h2>
                <p className="text-xs text-[#647087]">
                  {selectedQuote.address}, {selectedQuote.location} ({selectedQuote.postcode})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedQuoteId(null)}
                aria-label="Close quotation panel"
                className="rounded-lg p-1.5 text-[#647087] hover:bg-[#F7F8FA] cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => openEditQuote(selectedQuote)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#E8EAF0] bg-white px-3 py-2 text-xs font-medium text-[#0F1B3D] hover:bg-[#F7F8FA] cursor-pointer"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Edit Quote</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadPdf(selectedQuote)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#E8EAF0] bg-white px-3 py-2 text-xs font-medium text-[#0F1B3D] hover:bg-[#F7F2E7] cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5 text-[#8A6A2C]" />
                  <span>Download PDF</span>
                </button>

                {(selectedQuote.status === 'Draft' ||
                  selectedQuote.status === 'Ready for Review') && (
                  <button
                    type="button"
                    onClick={() => handleMarkSentDemo(selectedQuote)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F1B3D] px-3 py-2 text-xs font-medium text-white hover:bg-[#1A2B5C] cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Mark Sent (Demo)</span>
                  </button>
                )}

                {selectedQuote.status !== 'Accepted' && (
                  <button
                    type="button"
                    onClick={() => updateQuoteStatus(selectedQuote.id, 'Accepted', false)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F1B3D] px-3 py-2 text-xs font-medium text-white hover:bg-[#1A2B5C] cursor-pointer"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Mark Accepted</span>
                  </button>
                )}

                {selectedQuote.status !== 'Rejected' && selectedQuote.status !== 'Accepted' && (
                  <button
                    type="button"
                    onClick={() => updateQuoteStatus(selectedQuote.id, 'Rejected', false)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-xs font-medium text-[#B91C1C] hover:bg-[#FEE2E2] cursor-pointer"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    <span>Mark Rejected</span>
                  </button>
                )}
              </div>

              {/* Convert Accepted Quote to Scheduled Job */}
              {selectedQuote.status === 'Accepted' && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[#DECFA8] bg-[#F7F2E7] p-4">
                  <div>
                    <p className="text-xs font-bold text-[#8A6A2C]">Quotation Accepted</p>
                    <p className="text-xs text-[#0F1B3D] mt-0.5">
                      Convert this accepted quote into a scheduled cleaning job.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      navigateTo('jobs', { openCreateJobFromQuoteId: selectedQuote.id })
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F1B3D] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#1A2B5C] whitespace-nowrap cursor-pointer"
                  >
                    <CalendarPlus className="h-3.5 w-3.5" />
                    <span>Schedule Job</span>
                  </button>
                </div>
              )}

              {/* Breakdown Card */}
              <div className="rounded-xl border border-[#E8EAF0] bg-[#F7F8FA] p-4 space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#647087]">Service Category</span>
                  <span className="font-semibold text-[#0F1B3D]">
                    {selectedQuote.serviceCategory} ({selectedQuote.frequency})
                  </span>
                </div>
                <div>
                  <span className="text-[#647087]">Scope Description</span>
                  <p className="mt-1 text-[#0F1B3D] leading-relaxed">
                    {selectedQuote.serviceDescription}
                  </p>
                </div>
                <div className="border-t border-[#E8EAF0] pt-3 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-[#2C3752]">
                      Base Cleaning ({selectedQuote.estimatedHours} hrs ×{' '}
                      {formatGBP(selectedQuote.hourlyRate)}/hr)
                    </span>
                    <span className="font-mono-tabular font-medium text-[#0F1B3D]">
                      {formatGBP(selectedQuote.estimatedHours * selectedQuote.hourlyRate)}
                    </span>
                  </div>
                  {selectedQuote.additionalServices
                    .filter((s) => s.selected)
                    .map((extra) => (
                      <div key={extra.id} className="flex justify-between">
                        <span className="text-[#2C3752]">{extra.label}</span>
                        <span className="font-mono-tabular font-medium text-[#0F1B3D]">
                          {formatGBP(extra.amount)}
                        </span>
                      </div>
                    ))}
                </div>
                <div className="border-t border-[#E8EAF0] pt-3 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-[#647087]">Subtotal</span>
                    <span className="font-mono-tabular font-semibold text-[#0F1B3D]">
                      {formatGBP(selectedQuote.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#647087]">
                      {selectedQuote.includeVat
                        ? `UK VAT (${selectedQuote.vatRate}%)`
                        : 'VAT (Not Applied)'}
                    </span>
                    <span className="font-mono-tabular text-[#0F1B3D]">
                      {formatGBP(selectedQuote.vatAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-[#E8EAF0] text-sm font-bold text-[#0F1B3D]">
                    <span>Total Estimate</span>
                    <span className="font-mono-tabular text-[#8A6A2C]">
                      {formatGBP(selectedQuote.total)}
                    </span>
                  </div>
                </div>
              </div>

              {selectedQuote.termsAndNotes && (
                <div>
                  <p className="text-xs font-semibold text-[#0F1B3D]">Terms & Notes</p>
                  <p className="mt-1 text-xs leading-relaxed text-[#2C3752]">
                    {selectedQuote.termsAndNotes}
                  </p>
                </div>
              )}

              {/* Quote History */}
              <div className="border-t border-[#EEF0F5] pt-4">
                <p className="text-xs font-semibold text-[#0F1B3D] mb-2.5">Quote History</p>
                <div className="space-y-2">
                  {selectedQuote.history.map((h) => (
                    <div key={h.id} className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-medium text-[#0F1B3D]">{h.event}</span>
                        <span className="text-[#647087]"> · {h.actor}</span>
                      </div>
                      <span className="text-[11px] text-[#647087] tabular-nums">
                        {formatUKDateTime(h.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sent (Demo) Follow-up Suggestion Modal */}
      {sentPromptQuoteId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F1B3D]/45 p-4 backdrop-blur-[1px]"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-xl border border-[#E8EAF0] bg-white p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F7F2E7] text-[#8A6A2C]">
                <BellRing className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-[#0F1B3D]">
                  Simulate Marking Quote Sent?
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-[#647087]">
                  No real email will be sent. Would you also like the demo automation rule to
                  create a <span className="font-semibold text-[#0F1B3D]">2-day Quote Follow-up</span>{' '}
                  task in the Follow-up Centre?
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSentPromptQuoteId(null)}
                className="rounded-lg border border-[#E8EAF0] px-3.5 py-2 text-xs font-medium text-[#0F1B3D] hover:bg-[#F7F8FA] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  updateQuoteStatus(sentPromptQuoteId, 'Sent (Demo)', false);
                  setSentPromptQuoteId(null);
                }}
                className="rounded-lg border border-[#E8EAF0] px-3.5 py-2 text-xs font-medium text-[#0F1B3D] hover:bg-[#F7F8FA] cursor-pointer"
              >
                Mark Sent Only
              </button>
              <button
                type="button"
                onClick={() => {
                  updateQuoteStatus(sentPromptQuoteId, 'Sent (Demo)', true);
                  setSentPromptQuoteId(null);
                }}
                className="rounded-lg bg-[#0F1B3D] px-4 py-2 text-xs font-medium text-white hover:bg-[#1A2B5C] cursor-pointer"
              >
                Mark Sent + Create Follow-up
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Quotation Modal */}
      {formOpen && form && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F1B3D]/45 p-4 backdrop-blur-[1px]"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col rounded-xl border border-[#E8EAF0] bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[#EEF0F5] px-6 py-4">
              <div>
                <h2 className="font-display text-lg font-bold text-[#0F1B3D]">
                  {form.id ? 'Edit Quotation' : 'Create Illustrative Quotation'}
                </h2>
                <p className="text-xs text-[#647087]">
                  Dynamic GBP pricing calculator with configurable VAT and add-on services.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                aria-label="Close modal"
                className="rounded-lg p-1.5 text-[#647087] hover:bg-[#F7F8FA] cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* Linked Enquiry */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#0F1B3D] mb-1">
                    Linked Enquiry / Customer
                  </label>
                  <select
                    value={form.enquiryId}
                    onChange={(e) => handleEnquiryChange(e.target.value)}
                    className="w-full rounded-lg border border-[#E8EAF0] bg-white px-3 py-2 text-sm focus:border-[#8A6A2C] focus:outline-none"
                  >
                    {state.enquiries.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.reference} — {e.companyName || e.customerName} ({e.service}, {e.location})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F1B3D] mb-1">
                    Service Category
                  </label>
                  <select
                    value={form.serviceCategory}
                    onChange={(e) =>
                      setForm({ ...form, serviceCategory: e.target.value as ServiceCategory })
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
                    Frequency
                  </label>
                  <select
                    value={form.frequency}
                    onChange={(e) =>
                      setForm({ ...form, frequency: e.target.value as Quotation['frequency'] })
                    }
                    className="w-full rounded-lg border border-[#E8EAF0] bg-white px-3 py-2 text-sm focus:border-[#8A6A2C] focus:outline-none"
                  >
                    {['One-off', 'Daily', '3x Weekly', 'Weekly', 'Fortnightly', 'Monthly'].map(
                      (f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F1B3D] mb-1">
                    Valid Until
                  </label>
                  <input
                    type="date"
                    value={form.validUntil}
                    onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                    className="w-full rounded-lg border border-[#E8EAF0] px-3 py-2 text-sm focus:border-[#8A6A2C] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F1B3D] mb-1">
                  Service Description *
                </label>
                <textarea
                  rows={2}
                  value={form.serviceDescription}
                  onChange={(e) => setForm({ ...form, serviceDescription: e.target.value })}
                  className="w-full rounded-lg border border-[#E8EAF0] px-3 py-2 text-sm focus:border-[#8A6A2C] focus:outline-none"
                />
              </div>

              {/* Hours & Rate */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 rounded-xl bg-[#F7F8FA] p-4 border border-[#E8EAF0]">
                <div>
                  <label className="block text-xs font-semibold text-[#0F1B3D] mb-1">
                    Estimated Hours
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={form.estimatedHours}
                    onChange={(e) =>
                      setForm({ ...form, estimatedHours: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full rounded-lg border border-[#E8EAF0] bg-white px-3 py-2 font-mono-tabular text-sm focus:border-[#8A6A2C] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0F1B3D] mb-1">
                    Illustrative Hourly Rate (£)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={form.hourlyRate}
                    onChange={(e) =>
                      setForm({ ...form, hourlyRate: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full rounded-lg border border-[#E8EAF0] bg-white px-3 py-2 font-mono-tabular text-sm focus:border-[#8A6A2C] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0F1B3D] mb-1">
                    UK VAT Configuration
                  </label>
                  <div className="flex items-center gap-2 pt-1.5">
                    <input
                      id="vat-toggle"
                      type="checkbox"
                      checked={form.includeVat}
                      onChange={(e) => setForm({ ...form, includeVat: e.target.checked })}
                      className="h-4 w-4 accent-[#0F1B3D]"
                    />
                    <label htmlFor="vat-toggle" className="text-xs text-[#0F1B3D]">
                      Apply {form.vatRate}% VAT
                    </label>
                  </div>
                </div>
              </div>

              {/* Optional Add-ons */}
              <div>
                <p className="text-xs font-semibold text-[#0F1B3D] mb-2">
                  Optional Additional Services
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {form.additionalServices.map((extra) => (
                    <label
                      key={extra.id}
                      className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs cursor-pointer transition-colors ${
                        extra.selected
                          ? 'border-[#8A6A2C] bg-[#F7F2E7]/75'
                          : 'border-[#E8EAF0] bg-white'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={extra.selected}
                          onChange={() =>
                            setForm({
                              ...form,
                              additionalServices: form.additionalServices.map((x) =>
                                x.id === extra.id ? { ...x, selected: !x.selected } : x
                              ),
                            })
                          }
                          className="accent-[#0F1B3D]"
                        />
                        <span className="text-[#0F1B3D]">{extra.label}</span>
                      </span>
                      <span className="font-mono-tabular font-semibold text-[#0F1B3D] ml-2">
                        {formatGBP(extra.amount)}
                      </span>
                    </label>
                  ))}
                </div>

                <div className="mt-2.5 flex flex-wrap gap-2">
                  <input
                    type="text"
                    value={customExtraLabel}
                    onChange={(e) => setCustomExtraLabel(e.target.value)}
                    placeholder="Add custom extra service..."
                    className="flex-1 min-w-[180px] rounded-lg border border-[#E8EAF0] px-3 py-1.5 text-xs focus:border-[#8A6A2C] focus:outline-none"
                  />
                  <input
                    type="number"
                    min="1"
                    value={customExtraAmount}
                    onChange={(e) => setCustomExtraAmount(e.target.value)}
                    placeholder="£"
                    className="w-24 rounded-lg border border-[#E8EAF0] px-3 py-1.5 font-mono-tabular text-xs focus:border-[#8A6A2C] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomExtra}
                    className="rounded-lg border border-[#E8EAF0] px-3 py-1.5 text-xs font-medium text-[#0F1B3D] hover:bg-[#F7F8FA] cursor-pointer"
                  >
                    Add Item
                  </button>
                </div>
              </div>

              {/* Terms */}
              <div>
                <label className="block text-xs font-semibold text-[#0F1B3D] mb-1">
                  Terms & Notes
                </label>
                <textarea
                  rows={2}
                  value={form.termsAndNotes}
                  onChange={(e) => setForm({ ...form, termsAndNotes: e.target.value })}
                  className="w-full rounded-lg border border-[#E8EAF0] px-3 py-2 text-xs focus:border-[#8A6A2C] focus:outline-none"
                />
              </div>

              {/* Live Totals Summary */}
              <div className="rounded-xl border border-[#DECFA8] bg-[#F7F2E7]/85 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 text-xs text-[#0F1B3D]">
                  <p>
                    Subtotal:{' '}
                    <span className="font-mono-tabular font-semibold">
                      {formatGBP(liveCalc.subtotal)}
                    </span>
                  </p>
                  <p>
                    VAT ({form.includeVat ? `${form.vatRate}%` : '0%'}):{' '}
                    <span className="font-mono-tabular font-semibold">
                      {formatGBP(liveCalc.vatAmount)}
                    </span>
                  </p>
                </div>
                <div className="sm:text-right">
                  <p className="text-[11.5px] font-medium text-[#647087]">
                    Illustrative Total (GBP)
                  </p>
                  <p className="font-display text-2xl font-bold text-[#8A6A2C] font-mono-tabular">
                    {formatGBP(liveCalc.total)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-[#EEF0F5] px-6 py-4">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="rounded-lg border border-[#E8EAF0] px-4 py-2 text-xs font-medium text-[#0F1B3D] hover:bg-[#F7F8FA] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveQuote('Draft')}
                className="rounded-lg border border-[#0F1B3D] px-4 py-2 text-xs font-medium text-[#0F1B3D] hover:bg-[#F7F8FA] cursor-pointer"
              >
                Save as Draft
              </button>
              <button
                type="button"
                onClick={() => handleSaveQuote('Ready for Review')}
                className="rounded-lg bg-[#0F1B3D] px-4 py-2 text-xs font-medium text-white hover:bg-[#1A2B5C] cursor-pointer"
              >
                Save & Ready for Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
