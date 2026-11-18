import React, { useState, useMemo, useEffect } from 'react';
import {
  Sparkles,
  RefreshCw,
  Copy,
  FileText,
  BellRing,
  Info,
  Check,
} from 'lucide-react';
import { AssistantPresetAction, FollowUpType } from '../../types/operations';
import { useOperations } from '../../context/OperationsContext';
import {
  addDaysISO,
  formatGBP,
  formatUKDate,
  getTodayISODate,
} from '../../utils/formatters';

const PRESET_ACTIONS: {
  id: AssistantPresetAction;
  label: string;
  description: string;
  followUpType: FollowUpType;
}[] = [
  {
    id: 'acknowledge',
    label: 'Draft Enquiry Acknowledgement',
    description: 'Warm, professional response confirming receipt and next steps.',
    followUpType: 'New enquiry acknowledgement',
  },
  {
    id: 'missing_details',
    label: 'Request Missing Details',
    description: 'Polite message asking for access, rooms, or parking details.',
    followUpType: 'Missing information request',
  },
  {
    id: 'quote_followup',
    label: 'Draft Commercial Quote Follow-up',
    description: 'Structured check-in referencing the prepared GBP quotation.',
    followUpType: 'Quote follow-up',
  },
  {
    id: 'visit_confirmation',
    label: 'Draft Site Visit Confirmation',
    description: 'Confirming assessor arrival time, postcode, and site contact.',
    followUpType: 'Site visit confirmation',
  },
  {
    id: 'booking_confirmation',
    label: 'Draft Booking Confirmation',
    description: 'Confirming cleaning team schedule, start time, and key handling.',
    followUpType: 'Repeat booking follow-up',
  },
  {
    id: 'summarise',
    label: 'Summarise Customer Requirements',
    description: 'Concise internal handover brief for assessors and supervisors.',
    followUpType: 'New enquiry acknowledgement',
  },
];

export const AssistantView: React.FC = () => {
  const {
    state,
    navPayload,
    clearNavPayload,
    addEnquiryNote,
    createFollowUp,
    showToast,
    getMemberName,
  } = useOperations();

  const [selectedEnquiryId, setSelectedEnquiryId] = useState(state.enquiries[0]?.id || '');
  const [selectedAction, setSelectedAction] = useState<AssistantPresetAction>('acknowledge');
  const [variationSeed, setVariationSeed] = useState(0);
  const [draftText, setDraftText] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!navPayload) return;
    if (navPayload.assistantEnquiryId) {
      setSelectedEnquiryId(navPayload.assistantEnquiryId);
    }
    if (navPayload.assistantAction) {
      setSelectedAction(navPayload.assistantAction);
    }
    if (navPayload.assistantEnquiryId || navPayload.assistantAction) {
      clearNavPayload();
    }
  }, [navPayload, clearNavPayload]);

  const selectedEnquiry = useMemo(
    () => state.enquiries.find((e) => e.id === selectedEnquiryId) || state.enquiries[0],
    [state.enquiries, selectedEnquiryId]
  );

  const linkedQuote = useMemo(
    () => state.quotations.find((q) => q.enquiryId === selectedEnquiry?.id),
    [state.quotations, selectedEnquiry]
  );

  const linkedVisit = useMemo(
    () => state.siteVisits.find((v) => v.enquiryId === selectedEnquiry?.id),
    [state.siteVisits, selectedEnquiry]
  );

  const linkedJob = useMemo(
    () => state.jobs.find((j) => j.enquiryId === selectedEnquiry?.id),
    [state.jobs, selectedEnquiry]
  );

  const generateDraft = (
    action: AssistantPresetAction,
    seed: number
  ): string => {
    if (!selectedEnquiry) return '';
    const firstName = selectedEnquiry.customerName.split(' ')[0];
    const orgOrHome = selectedEnquiry.companyName
      ? `${selectedEnquiry.companyName} (${selectedEnquiry.address}, ${selectedEnquiry.postcode})`
      : `${selectedEnquiry.address}, ${selectedEnquiry.location} (${selectedEnquiry.postcode})`;
    const alt = seed % 2 === 1;

    switch (action) {
      case 'acknowledge':
        return alt
          ? `Subject: Your ${selectedEnquiry.service} Enquiry (${selectedEnquiry.reference}) — ABE Cleaning Services\n\nDear ${firstName},\n\nMany thanks for getting in touch regarding ${selectedEnquiry.service.toLowerCase()} for ${orgOrHome}.\n\nWe have logged your request (${selectedEnquiry.frequency}, preferred date ${formatUKDate(
              selectedEnquiry.preferredDate
            )}) and assigned ${getMemberName(
              selectedEnquiry.assignedToId
            )} to coordinate next steps. We will be in touch shortly to confirm availability and any final details.\n\nKind regards,\nABE Cleaning Operations Team`
          : `Subject: Thank you for contacting ABE Cleaning Services (${selectedEnquiry.reference})\n\nHello ${firstName},\n\nThank you for your enquiry concerning ${selectedEnquiry.service.toLowerCase()} in ${selectedEnquiry.location} (${selectedEnquiry.postcode}).\n\nBased on your initial brief (${selectedEnquiry.propertyType}, ${selectedEnquiry.frequency}), ${getMemberName(
              selectedEnquiry.assignedToId
            )} is reviewing our ${selectedEnquiry.location} schedule for ${formatUKDate(
              selectedEnquiry.preferredDate
            )} and will follow up with you shortly.\n\nBest regards,\nABE Cleaning Services`;

      case 'missing_details':
        return `Subject: Quick details needed for ${selectedEnquiry.reference} — ABE Cleaning Services\n\nHi ${firstName},\n\nTo prepare an accurate schedule and estimate for ${orgOrHome}, could you kindly confirm a couple of quick points?\n\n1. Preferred key collection or building access arrangements\n2. Any priority areas, delicate surfaces, or parking restrictions near ${selectedEnquiry.postcode}\n3. Whether cleaning supplies should be provided by our team\n\nOnce we have those details, we can finalise everything promptly.\n\nKind regards,\n${getMemberName(
          selectedEnquiry.assignedToId
        )}\nABE Cleaning Services`;

      case 'quote_followup': {
        const quoteLine = linkedQuote
          ? `quotation ${linkedQuote.reference} (${formatGBP(linkedQuote.total)} illustrative total)`
          : `your recent ${selectedEnquiry.service.toLowerCase()} proposal`;
        return alt
          ? `Subject: Checking in on ${linkedQuote ? linkedQuote.reference : selectedEnquiry.reference} — ${
              selectedEnquiry.companyName || selectedEnquiry.customerName
            }\n\nDear ${firstName},\n\nI hope your week is going well. I wanted to follow up briefly on ${quoteLine} for ${orgOrHome}.\n\nIf you would like to adjust the cleaning frequency (${selectedEnquiry.frequency}), tweak the hours, or book a start date, please reply anytime and we will be glad to help.\n\nBest regards,\n${getMemberName(
              selectedEnquiry.assignedToId
            )}`
          : `Subject: Following up: ${selectedEnquiry.service} Proposal (${
              linkedQuote ? linkedQuote.reference : selectedEnquiry.reference
            })\n\nHello ${firstName},\n\nJust a polite check-in regarding ${quoteLine} for ${orgOrHome}. Please let us know if your team has any questions about the scope or schedule.\n\nWarm regards,\nABE Cleaning Operations Team`;
      }

      case 'visit_confirmation': {
        const visitDate = linkedVisit ? formatUKDate(linkedVisit.date) : formatUKDate(addDaysISO(getTodayISODate(), 2));
        const visitTime = linkedVisit ? linkedVisit.time : '14:00';
        const assessor = linkedVisit
          ? getMemberName(linkedVisit.assessorId)
          : 'Oliver Grant';
        return `Subject: Site Visit Confirmation — ${visitDate} at ${visitTime} (${selectedEnquiry.reference})\n\nDear ${firstName},\n\nThis is to confirm our on-site assessment at ${orgOrHome} on ${visitDate} at ${visitTime}.\n\nOur assessor, ${assessor}, will walk through the premises with you to confirm cleaning scope, access arrangements, and staffing recommendations.\n\nIf you need to adjust the time, please let us know in advance.\n\nKind regards,\nABE Cleaning Operations Team`;
      }

      case 'booking_confirmation': {
        const jobDate = linkedJob ? formatUKDate(linkedJob.date) : formatUKDate(selectedEnquiry.preferredDate);
        const jobTime = linkedJob ? linkedJob.startTime : '09:00';
        const team = linkedJob ? linkedJob.assignedTeam : 'ABE Operations Team';
        return `Subject: Booking Confirmation — ${selectedEnquiry.service} (${selectedEnquiry.reference})\n\nDear ${firstName},\n\nWe are pleased to confirm your ${selectedEnquiry.service.toLowerCase()} booking at ${orgOrHome}.\n\n• Date: ${jobDate}\n• Arrival Time: ${jobTime}\n• Assigned Team: ${team}\n• Frequency: ${selectedEnquiry.frequency}\n\nPlease ensure access details are ready ahead of arrival. Thank you for choosing ABE Cleaning Services.\n\nBest regards,\nABE Cleaning Operations Team`;
      }

      case 'summarise':
        return `INTERNAL OPERATIONS BRIEF — ${selectedEnquiry.reference}\nClient: ${
          selectedEnquiry.companyName
            ? `${selectedEnquiry.companyName} (Attn: ${selectedEnquiry.customerName})`
            : selectedEnquiry.customerName
        }\nArea & Postcode: ${selectedEnquiry.location} (${selectedEnquiry.postcode})\nAddress: ${
          selectedEnquiry.address
        }\nService: ${selectedEnquiry.service} · ${selectedEnquiry.frequency}\nProperty Type: ${
          selectedEnquiry.propertyType
        }\nPriority & Status: ${selectedEnquiry.priority} / ${
          selectedEnquiry.status
        }\nAssigned Lead: ${getMemberName(selectedEnquiry.assignedToId)}\n\nScope Summary:\n${
          selectedEnquiry.summary
        }${
          linkedVisit
            ? `\n\nSite Visit (${linkedVisit.reference}): ${linkedVisit.status} on ${formatUKDate(
                linkedVisit.date
              )} at ${linkedVisit.time}`
            : ''
        }${
          linkedQuote
            ? `\nLinked Quote (${linkedQuote.reference}): ${linkedQuote.status} — ${formatGBP(
                linkedQuote.total
              )}`
            : ''
        }`;
    }
  };

  useEffect(() => {
    setDraftText(generateDraft(selectedAction, variationSeed));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEnquiryId, selectedAction, variationSeed]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(draftText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showToast({ type: 'success', title: 'Draft copied to clipboard' });
    } catch {
      showToast({ type: 'info', title: 'Please copy text manually' });
    }
  };

  const handleSaveAsNote = () => {
    if (!selectedEnquiry || !draftText.trim()) return;
    addEnquiryNote(selectedEnquiry.id, `[Assistant Draft]\n${draftText.trim()}`, 'ABE Smart Assistant');
  };

  const handleCreateFollowUp = () => {
    if (!selectedEnquiry || !draftText.trim()) return;
    const presetMeta = PRESET_ACTIONS.find((p) => p.id === selectedAction);
    createFollowUp({
      enquiryId: selectedEnquiry.id,
      customerName: selectedEnquiry.customerName,
      companyName: selectedEnquiry.companyName,
      type: presetMeta?.followUpType || 'Quote follow-up',
      dueDate: addDaysISO(getTodayISODate(), 1),
      priority: selectedEnquiry.priority,
      assignedToId: selectedEnquiry.assignedToId,
      suggestedMessage: draftText.trim(),
    });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#8A6A2C]" />
          <h1 className="font-display text-xl font-bold text-[#0F1B3D]">ABE Smart Assistant</h1>
        </div>
        <p className="mt-1 text-sm text-[#647087]">
          Prepare consistent customer messages and internal handover briefs from live enquiry records.
        </p>
      </div>

      {/* Transparency Notice */}
      <div className="flex items-start gap-2.5 rounded-xl border border-[#DECFA8] bg-[#F7F2E7]/85 px-4 py-3 text-xs text-[#0F1B3D]">
        <Info className="h-4 w-4 text-[#8A6A2C] shrink-0 mt-0.5" />
        <p>
          <span className="font-semibold">Concept Mode Notice:</span> This prototype uses
          structured local templates populated from your workspace records—no external AI model is
          connected here. Live LLM drafting and inbox integration are proposed as a production
          enhancement.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left Controls */}
        <div className="space-y-4 lg:col-span-5">
          <div className="rounded-xl border border-[#E8EAF0] bg-white p-5 space-y-4">
            <div>
              <label
                htmlFor="assistant-enquiry"
                className="block text-xs font-semibold text-[#0F1B3D] mb-1.5"
              >
                1. Select Customer / Enquiry
              </label>
              <select
                id="assistant-enquiry"
                value={selectedEnquiryId}
                onChange={(e) => setSelectedEnquiryId(e.target.value)}
                className="w-full rounded-lg border border-[#E8EAF0] bg-white px-3 py-2 text-sm text-[#0F1B3D] focus:border-[#8A6A2C] focus:outline-none"
              >
                {state.enquiries.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.reference} — {e.companyName || e.customerName} ({e.service})
                  </option>
                ))}
              </select>
            </div>

            {selectedEnquiry && (
              <div className="rounded-lg bg-[#F7F8FA] p-3 text-xs border border-[#E8EAF0] space-y-1">
                <p className="font-semibold text-[#0F1B3D]">
                  {selectedEnquiry.companyName || selectedEnquiry.customerName}
                </p>
                <p className="text-[#647087]">
                  {selectedEnquiry.service} · {selectedEnquiry.location} ({selectedEnquiry.postcode})
                </p>
                <p className="text-[#647087]">
                  Status: <span className="font-medium text-[#0F1B3D]">{selectedEnquiry.status}</span>
                  {linkedQuote ? ` · Quote ${linkedQuote.reference}` : ''}
                </p>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold text-[#0F1B3D] mb-2">
                2. Choose Preset Action
              </p>
              <div className="space-y-2">
                {PRESET_ACTIONS.map((preset) => {
                  const active = selectedAction === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSelectedAction(preset.id)}
                      className={`w-full rounded-lg border p-3 text-left transition-colors cursor-pointer ${
                        active
                          ? 'border-[#8A6A2C] bg-[#F7F2E7]/85'
                          : 'border-[#E8EAF0] bg-white hover:bg-[#F7F8FA]'
                      }`}
                    >
                      <p
                        className={`text-xs font-semibold ${
                          active ? 'text-[#8A6A2C]' : 'text-[#0F1B3D]'
                        }`}
                      >
                        {preset.label}
                      </p>
                      <p className="mt-0.5 text-[11.5px] text-[#647087]">{preset.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Draft Editor */}
        <div className="lg:col-span-7">
          <div className="flex h-full flex-col rounded-xl border border-[#E8EAF0] bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#EEF0F5]">
              <div>
                <h2 className="font-display text-base font-bold text-[#0F1B3D]">
                  Contextual Draft Editor
                </h2>
                <p className="text-xs text-[#647087]">
                  Edit freely before copying or saving to the enquiry record.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setVariationSeed((s) => s + 1)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#E8EAF0] bg-white px-3 py-1.5 text-xs font-medium text-[#0F1B3D] hover:bg-[#F7F8FA] cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5 text-[#8A6A2C]" />
                <span>Regenerate Draft</span>
              </button>
            </div>

            <textarea
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              rows={15}
              aria-label="Editable message draft"
              className="mt-4 flex-1 w-full rounded-lg border border-[#E8EAF0] bg-[#F9FAFC] p-4 text-sm leading-relaxed text-[#0F1B3D] focus:border-[#8A6A2C] focus:bg-white focus:outline-none"
            />

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2.5 border-t border-[#EEF0F5] pt-4">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleSaveAsNote}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#E8EAF0] bg-white px-3.5 py-2 text-xs font-medium text-[#0F1B3D] hover:bg-[#F7F8FA] cursor-pointer"
                >
                  <FileText className="h-3.5 w-3.5 text-[#8A6A2C]" />
                  <span>Save as Internal Note</span>
                </button>
                <button
                  type="button"
                  onClick={handleCreateFollowUp}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#E8EAF0] bg-white px-3.5 py-2 text-xs font-medium text-[#0F1B3D] hover:bg-[#F7F8FA] cursor-pointer"
                >
                  <BellRing className="h-3.5 w-3.5 text-[#8A6A2C]" />
                  <span>Create Follow-up Task</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F1B3D] px-4 py-2 text-xs font-medium text-white hover:bg-[#1A2B5C] cursor-pointer"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied' : 'Copy to Clipboard'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
