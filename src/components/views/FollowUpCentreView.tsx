import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  CheckCircle2,
  Clock,
  Copy,
  Edit3,
  X,
  Zap,
  AlertCircle,
} from 'lucide-react';
import { FollowUpTask, FollowUpType, Priority } from '../../types/operations';
import { useOperations } from '../../context/OperationsContext';
import { formatUKDate, getTodayISODate } from '../../utils/formatters';
import { PriorityLabel, StatusBadge } from '../common/StatusBadge';

type FollowUpTab = 'Due Today' | 'Upcoming' | 'Overdue' | 'Completed';

const FOLLOW_UP_TYPES: FollowUpType[] = [
  'New enquiry acknowledgement',
  'Missing information request',
  'Site visit confirmation',
  'Quote follow-up',
  'Client decision reminder',
  'Repeat booking follow-up',
];

export const FollowUpCentreView: React.FC = () => {
  const {
    state,
    navPayload,
    clearNavPayload,
    createFollowUp,
    updateFollowUp,
    completeFollowUp,
    snoozeFollowUp,
    showToast,
    getMemberName,
  } = useOperations();

  const today = getTodayISODate();
  const [activeTab, setActiveTab] = useState<FollowUpTab>('Due Today');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<FollowUpTask | null>(null);

  const [enquiryId, setEnquiryId] = useState(state.enquiries[0]?.id || '');
  const [type, setType] = useState<FollowUpType>('Quote follow-up');
  const [dueDate, setDueDate] = useState(today);
  const [priority, setPriority] = useState<Priority>('Medium');
  const [assignedToId, setAssignedToId] = useState('tm-1');
  const [suggestedMessage, setSuggestedMessage] = useState('');

  useEffect(() => {
    if (!navPayload) return;
    if (navPayload.openCreateFollowUpForEnquiryId) {
      const enq =
        state.enquiries.find((e) => e.id === navPayload.openCreateFollowUpForEnquiryId) ||
        state.enquiries[0];
      setEditingTask(null);
      if (enq) {
        setEnquiryId(enq.id);
        setAssignedToId(enq.assignedToId);
        setSuggestedMessage(
          `Hello ${enq.customerName}, following up regarding your ${enq.service} enquiry (${enq.reference}) in ${enq.location}. Please let us know if we can assist further.`
        );
      }
      setType('Quote follow-up');
      setDueDate(today);
      setPriority('Medium');
      setModalOpen(true);
      clearNavPayload();
    }
  }, [navPayload, clearNavPayload, state.enquiries, today]);

  const categorized = useMemo(() => {
    const dueToday = state.followUps.filter(
      (f) => f.status === 'Pending' && f.dueDate === today
    );
    const upcoming = state.followUps.filter(
      (f) => f.status === 'Pending' && f.dueDate > today
    );
    const overdue = state.followUps.filter(
      (f) => f.status === 'Pending' && f.dueDate < today
    );
    const completed = state.followUps.filter((f) => f.status === 'Completed');
    return {
      'Due Today': dueToday,
      Upcoming: upcoming,
      Overdue: overdue,
      Completed: completed,
    };
  }, [state.followUps, today]);

  const visibleTasks = categorized[activeTab];

  const openNewModal = () => {
    const enq = state.enquiries[0];
    setEditingTask(null);
    if (enq) {
      setEnquiryId(enq.id);
      setAssignedToId(enq.assignedToId);
      setSuggestedMessage(
        `Hello ${enq.customerName}, checking in regarding your ${enq.service} enquiry (${enq.reference}) at ${enq.location}.`
      );
    }
    setType('New enquiry acknowledgement');
    setDueDate(today);
    setPriority('Medium');
    setModalOpen(true);
  };

  const openEditModal = (task: FollowUpTask) => {
    setEditingTask(task);
    setEnquiryId(task.enquiryId);
    setType(task.type);
    setDueDate(task.dueDate);
    setPriority(task.priority);
    setAssignedToId(task.assignedToId);
    setSuggestedMessage(task.suggestedMessage);
    setModalOpen(true);
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    const enq = state.enquiries.find((x) => x.id === enquiryId);
    if (!enq) return;

    if (editingTask) {
      updateFollowUp(editingTask.id, {
        enquiryId: enq.id,
        customerName: enq.customerName,
        companyName: enq.companyName,
        type,
        dueDate,
        priority,
        assignedToId,
        suggestedMessage: suggestedMessage.trim(),
      });
    } else {
      createFollowUp({
        enquiryId: enq.id,
        customerName: enq.customerName,
        companyName: enq.companyName,
        type,
        dueDate,
        priority,
        assignedToId,
        suggestedMessage: suggestedMessage.trim(),
      });
    }
    setModalOpen(false);
  };

  const handleCopyMessage = async (msg: string) => {
    try {
      await navigator.clipboard.writeText(msg);
      showToast({
        type: 'success',
        title: 'Message copied to clipboard',
        description: 'Ready to paste into your preferred email or messaging tool.',
      });
    } catch {
      showToast({
        type: 'info',
        title: 'Copy unavailable',
        description: 'Please select and copy the message text manually.',
      });
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-[#0F1B3D]">
            Automated Follow-up Centre
          </h1>
          <p className="text-sm text-[#647087]">
            Track acknowledgements, quote nudges, and site visit confirmations without losing momentum.
          </p>
        </div>

        <button
          type="button"
          onClick={openNewModal}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F1B3D] px-4 py-2 text-xs font-medium text-white hover:bg-[#1A2B5C] whitespace-nowrap self-start cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Follow-up</span>
        </button>
      </div>

      {/* Demo Automation Rules Strip */}
      <div className="rounded-xl border border-[#DECFA8] bg-[#F7F2E7]/85 p-4">
        <div className="flex items-start gap-3">
          <Zap className="h-4 w-4 text-[#8A6A2C] shrink-0 mt-0.5" />
          <div className="text-xs text-[#0F1B3D] space-y-1">
            <p className="font-semibold">
              Local Demo Automation Rules Active (No real emails, SMS, or WhatsApp sent)
            </p>
            <p className="text-[#2C3752]">
              1. Marking a quote &ldquo;Sent (Demo)&rdquo; offers an instant 2-day follow-up task ·
              2. Site visits link directly to confirmation message drafts · 3. Pending tasks past
              due date are automatically flagged Overdue.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-[#E8EAF0] bg-white p-1.5">
        {(['Due Today', 'Overdue', 'Upcoming', 'Completed'] as FollowUpTab[]).map((tab) => {
          const count = categorized[tab].length;
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                isActive
                  ? tab === 'Overdue'
                    ? 'bg-[#DC2626] text-white'
                    : 'bg-[#0F1B3D] text-white'
                  : 'text-[#2C3752] hover:bg-[#F7F8FA]'
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

      {/* Tasks List */}
      {visibleTasks.length === 0 ? (
        <div className="rounded-xl border border-[#E8EAF0] bg-white p-10 text-center">
          <p className="font-display text-base font-semibold text-[#0F1B3D]">
            No follow-ups in {activeTab}
          </p>
          <p className="mt-1 text-sm text-[#647087]">
            Create a follow-up task or switch tabs to review other scheduled communications.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleTasks.map((task) => {
            const isOverdue = task.status === 'Pending' && task.dueDate < today;
            return (
              <div
                key={task.id}
                className="rounded-xl border border-[#E8EAF0] bg-white p-4 sm:p-5 transition-colors hover:border-[#8A6A2C]/50"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-sm font-bold text-[#0F1B3D]">
                        {task.companyName || task.customerName}
                      </span>
                      <span className="text-xs text-[#647087]">·</span>
                      <span className="text-xs font-medium text-[#8A6A2C]">{task.type}</span>
                      <StatusBadge status={isOverdue ? 'Overdue' : task.status} />
                    </div>
                    <p className="text-xs text-[#647087]">
                      Due: <span className="font-medium text-[#0F1B3D]">{formatUKDate(task.dueDate)}</span> · Assigned to{' '}
                      {getMemberName(task.assignedToId)} · <PriorityLabel priority={task.priority} />
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyMessage(task.suggestedMessage)}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#E8EAF0] bg-white px-2.5 py-1.5 text-xs font-medium text-[#0F1B3D] hover:bg-[#F7F8FA] cursor-pointer"
                    >
                      <Copy className="h-3.5 w-3.5 text-[#8A6A2C]" />
                      <span>Copy Message</span>
                    </button>

                    {task.status === 'Pending' && (
                      <>
                        <button
                          type="button"
                          onClick={() => snoozeFollowUp(task.id, 2)}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#E8EAF0] bg-white px-2.5 py-1.5 text-xs font-medium text-[#2C3752] hover:bg-[#F7F8FA] cursor-pointer"
                        >
                          <Clock className="h-3.5 w-3.5" />
                          <span>Snooze +2d</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(task)}
                          aria-label="Edit follow-up"
                          className="rounded-lg border border-[#E8EAF0] bg-white p-1.5 text-[#2C3752] hover:bg-[#F7F8FA] cursor-pointer"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => completeFollowUp(task.id)}
                          className="inline-flex items-center gap-1 rounded-lg bg-[#0F1B3D] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1A2B5C] cursor-pointer"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Complete</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Suggested Draft Box */}
                <div className="mt-3 rounded-lg bg-[#F7F8FA] p-3 border border-[#E8EAF0] text-xs text-[#0F1B3D] leading-relaxed">
                  <span className="font-semibold text-[#647087] block mb-1">
                    Suggested Draft (Demo — copy to send manually):
                  </span>
                  {task.suggestedMessage}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Follow-up Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F1B3D]/45 p-4 backdrop-blur-[1px]"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-xl border border-[#E8EAF0] bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[#EEF0F5] px-6 py-4">
              <h2 className="font-display text-lg font-bold text-[#0F1B3D]">
                {editingTask ? 'Edit Follow-up Task' : 'Create Follow-up Task'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close modal"
                className="rounded-lg p-1.5 text-[#647087] hover:bg-[#F7F8FA] cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0F1B3D] mb-1">
                  Linked Customer / Enquiry
                </label>
                <select
                  value={enquiryId}
                  onChange={(e) => setEnquiryId(e.target.value)}
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
                    Follow-up Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as FollowUpType)}
                    className="w-full rounded-lg border border-[#E8EAF0] bg-white px-3 py-2 text-sm focus:border-[#8A6A2C] focus:outline-none"
                  >
                    {FOLLOW_UP_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F1B3D] mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full rounded-lg border border-[#E8EAF0] px-3 py-2 text-sm focus:border-[#8A6A2C] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F1B3D] mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    className="w-full rounded-lg border border-[#E8EAF0] bg-white px-3 py-2 text-sm focus:border-[#8A6A2C] focus:outline-none"
                  >
                    {(['Low', 'Medium', 'High', 'Urgent'] as Priority[]).map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F1B3D] mb-1">
                    Assigned Member
                  </label>
                  <select
                    value={assignedToId}
                    onChange={(e) => setAssignedToId(e.target.value)}
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
                  Suggested Message Draft
                </label>
                <textarea
                  rows={3}
                  required
                  value={suggestedMessage}
                  onChange={(e) => setSuggestedMessage(e.target.value)}
                  className="w-full rounded-lg border border-[#E8EAF0] px-3 py-2 text-xs leading-relaxed focus:border-[#8A6A2C] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 border-t border-[#EEF0F5] pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-[#E8EAF0] px-4 py-2 text-xs font-medium text-[#0F1B3D] hover:bg-[#F7F8FA] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#0F1B3D] px-4 py-2 text-xs font-medium text-white hover:bg-[#1A2B5C] cursor-pointer"
                >
                  {editingTask ? 'Save Changes' : 'Create Follow-up'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
