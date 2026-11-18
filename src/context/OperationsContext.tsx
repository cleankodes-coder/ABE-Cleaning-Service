import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  CleaningJob,
  CommercialOpportunity,
  CommercialStage,
  DemoSettings,
  Enquiry,
  EnquiryStatus,
  FollowUpTask,
  JobStatus,
  NavigationPayload,
  NavigationSection,
  OperationsState,
  Quotation,
  QuoteStatus,
  SiteAssessmentNotes,
  SiteVisit,
  VisitStatus,
} from '../types/operations';
import { createSeedData } from '../data/seedData';
import { addDaysISO, generateId, getTodayISODate } from '../utils/formatters';

const STORAGE_KEY = 'abe_smart_ops_hub_v1';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  description?: string;
}

export interface ConfirmOptions {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  onConfirm: () => void;
}

interface OperationsContextValue {
  state: OperationsState;
  activeSection: NavigationSection;
  navPayload: NavigationPayload | null;
  clearNavPayload: () => void;
  navigateTo: (section: NavigationSection, payload?: NavigationPayload) => void;

  // Toasts & Confirmations
  toasts: ToastMessage[];
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;
  confirmState: ConfirmOptions | null;
  requestConfirm: (options: ConfirmOptions) => void;
  closeConfirm: () => void;

  // Enquiries
  createEnquiry: (data: Omit<Enquiry, 'id' | 'reference' | 'createdAt' | 'notes' | 'activities'>) => Enquiry;
  updateEnquiry: (id: string, patch: Partial<Enquiry>, activityNote?: string) => void;
  addEnquiryNote: (enquiryId: string, text: string, author?: string) => void;
  deleteEnquiry: (id: string) => void;

  // Commercial Pipeline
  moveOpportunityStage: (oppId: string, stage: CommercialStage) => void;
  updateOpportunity: (oppId: string, patch: Partial<CommercialOpportunity>) => void;

  // Quotations
  saveQuotation: (quote: Omit<Quotation, 'id' | 'reference' | 'createdAt' | 'history'> & { id?: string }) => Quotation;
  updateQuoteStatus: (quoteId: string, status: QuoteStatus, createFollowUp?: boolean) => void;

  // Site Visits
  createSiteVisit: (visit: Omit<SiteVisit, 'id' | 'reference' | 'createdAt'>) => SiteVisit;
  updateSiteVisit: (visitId: string, patch: Partial<SiteVisit>) => void;
  completeSiteVisit: (visitId: string, assessment: SiteAssessmentNotes) => void;

  // Jobs & Scheduling
  createJob: (job: Omit<CleaningJob, 'id' | 'reference'>) => CleaningJob;
  updateJob: (jobId: string, patch: Partial<CleaningJob>) => void;
  updateJobStatus: (jobId: string, status: JobStatus) => void;

  // Follow-ups
  createFollowUp: (task: Omit<FollowUpTask, 'id' | 'createdAt' | 'status'>) => FollowUpTask;
  updateFollowUp: (taskId: string, patch: Partial<FollowUpTask>) => void;
  completeFollowUp: (taskId: string) => void;
  snoozeFollowUp: (taskId: string, days: number) => void;

  // Settings & Reset
  updateSettings: (patch: Partial<DemoSettings>) => void;
  resetDemoData: () => void;

  // Helpers
  getMemberName: (id: string) => string;
}

const OperationsContext = createContext<OperationsContextValue | null>(null);

function loadInitialState(): OperationsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as OperationsState;
      if (parsed && Array.isArray(parsed.enquiries) && Array.isArray(parsed.quotations)) {
        return parsed;
      }
    }
  } catch {
    // Fallback to seed data if storage is unreadable
  }
  return createSeedData();
}

export const OperationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<OperationsState>(loadInitialState);
  const [activeSection, setActiveSection] = useState<NavigationSection>('overview');
  const [navPayload, setNavPayload] = useState<NavigationPayload | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmOptions | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota issues in demo
    }
  }, [state]);

  const showToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = generateId('toast');
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const requestConfirm = useCallback((options: ConfirmOptions) => {
    setConfirmState(options);
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmState(null);
  }, []);

  const navigateTo = useCallback((section: NavigationSection, payload?: NavigationPayload) => {
    setActiveSection(section);
    setNavPayload(payload ?? null);
  }, []);

  const clearNavPayload = useCallback(() => {
    setNavPayload(null);
  }, []);

  const getMemberName = useCallback(
    (id: string) => {
      return state.teamMembers.find((m) => m.id === id)?.name ?? 'Operations Team';
    },
    [state.teamMembers]
  );

  // Enquiries
  const createEnquiry = useCallback(
    (data: Omit<Enquiry, 'id' | 'reference' | 'createdAt' | 'notes' | 'activities'>) => {
      const nextNum = 2401 + state.enquiries.length + Math.floor(Math.random() * 10);
      const nowIso = new Date().toISOString();
      const newEnq: Enquiry = {
        ...data,
        id: generateId('enq'),
        reference: `ENQ-${nextNum}`,
        createdAt: getTodayISODate(),
        notes: [],
        activities: [
          {
            id: generateId('act'),
            timestamp: nowIso,
            author: 'Operations Hub',
            action: `Enquiry created (${data.source})`,
          },
        ],
      };

      setState((prev) => {
        const nextOpportunities = [...prev.opportunities];
        if (
          data.service === 'Commercial Cleaning' ||
          data.service === 'Office Cleaning' ||
          data.service === 'Specialist Cleaning'
        ) {
          nextOpportunities.unshift({
            id: generateId('opp'),
            enquiryId: newEnq.id,
            reference: `COM-${309 + prev.opportunities.length}`,
            companyName: data.companyName || data.customerName,
            contactName: data.customerName,
            location: data.location,
            postcode: data.postcode,
            cleaningType: data.service,
            frequency: data.frequency,
            stage: 'New Request',
            priority: data.priority,
            assignedToId: data.assignedToId,
            nextAction: 'Review commercial cleaning specifications',
            numberOfSites: 1,
            buildingType: data.propertyType || 'Commercial Premises',
            approxFloorAreaSqFt: 2000,
            roomsOrFloors: 'To be confirmed during assessment',
            preferredCleaningHours: 'Out of hours (TBC)',
            serviceRequirements: [data.summary || 'Standard commercial specification'],
            visitRequired: true,
            visitNotes: 'Pending initial contact.',
            updatedAt: getTodayISODate(),
          });
        }

        return {
          ...prev,
          enquiries: [newEnq, ...prev.enquiries],
          opportunities: nextOpportunities,
        };
      });

      showToast({
        type: 'success',
        title: `Enquiry ${newEnq.reference} added`,
        description: `${newEnq.customerName} (${newEnq.location}) saved to operations hub.`,
      });
      return newEnq;
    },
    [state.enquiries.length, showToast]
  );

  const updateEnquiry = useCallback(
    (id: string, patch: Partial<Enquiry>, activityNote?: string) => {
      const nowIso = new Date().toISOString();
      setState((prev) => ({
        ...prev,
        enquiries: prev.enquiries.map((e) => {
          if (e.id !== id) return e;
          const activities = activityNote
            ? [
                {
                  id: generateId('act'),
                  timestamp: nowIso,
                  author: 'Hannah Bennett',
                  action: activityNote,
                },
                ...e.activities,
              ]
            : e.activities;
          return { ...e, ...patch, activities };
        }),
      }));
      showToast({
        type: 'success',
        title: 'Enquiry updated',
        description: activityNote || 'Changes saved to LocalStorage.',
      });
    },
    [showToast]
  );

  const addEnquiryNote = useCallback(
    (enquiryId: string, text: string, author = 'Hannah Bennett') => {
      const nowIso = new Date().toISOString();
      setState((prev) => ({
        ...prev,
        enquiries: prev.enquiries.map((e) => {
          if (e.id !== enquiryId) return e;
          return {
            ...e,
            notes: [
              { id: generateId('note'), timestamp: nowIso, author, text },
              ...e.notes,
            ],
            activities: [
              { id: generateId('act'), timestamp: nowIso, author, action: 'Added internal note', detail: text },
              ...e.activities,
            ],
          };
        }),
      }));
      showToast({ type: 'success', title: 'Internal note saved' });
    },
    [showToast]
  );

  const deleteEnquiry = useCallback(
    (id: string) => {
      setState((prev) => ({
        ...prev,
        enquiries: prev.enquiries.filter((e) => e.id !== id),
        opportunities: prev.opportunities.filter((o) => o.enquiryId !== id),
      }));
      showToast({ type: 'info', title: 'Enquiry removed' });
    },
    [showToast]
  );

  // Commercial Pipeline
  const moveOpportunityStage = useCallback(
    (oppId: string, stage: CommercialStage) => {
      const stageToEnquiryStatus: Record<CommercialStage, EnquiryStatus> = {
        'New Request': 'New',
        'Requirements Review': 'Contacted',
        'Site Visit Needed': 'Awaiting Assessment',
        'Quotation Preparation': 'Quote Required',
        'Quote Sent': 'Quote Sent',
        'Client Decision': 'Quote Sent',
        Won: 'Accepted',
        Lost: 'Closed',
      };

      const nowIso = new Date().toISOString();
      setState((prev) => {
        const opp = prev.opportunities.find((o) => o.id === oppId);
        if (!opp) return prev;
        const mappedStatus = stageToEnquiryStatus[stage];
        return {
          ...prev,
          opportunities: prev.opportunities.map((o) =>
            o.id === oppId ? { ...o, stage, updatedAt: getTodayISODate() } : o
          ),
          enquiries: prev.enquiries.map((e) =>
            e.id === opp.enquiryId
              ? {
                  ...e,
                  status: mappedStatus,
                  activities: [
                    {
                      id: generateId('act'),
                      timestamp: nowIso,
                      author: 'Pipeline Board',
                      action: `Commercial stage moved to ${stage}`,
                    },
                    ...e.activities,
                  ],
                }
              : e
          ),
        };
      });

      showToast({
        type: 'success',
        title: `Moved to ${stage}`,
        description: 'Linked enquiry status synchronised.',
      });
    },
    [showToast]
  );

  const updateOpportunity = useCallback((oppId: string, patch: Partial<CommercialOpportunity>) => {
    setState((prev) => ({
      ...prev,
      opportunities: prev.opportunities.map((o) =>
        o.id === oppId ? { ...o, ...patch, updatedAt: getTodayISODate() } : o
      ),
    }));
  }, []);

  // Quotations
  const saveQuotation = useCallback(
    (quoteInput: Omit<Quotation, 'id' | 'reference' | 'createdAt' | 'history'> & { id?: string }) => {
      const nowIso = new Date().toISOString();
      let savedQuote!: Quotation;

      setState((prev) => {
        if (quoteInput.id) {
          const existing = prev.quotations.find((q) => q.id === quoteInput.id);
          if (existing) {
            savedQuote = {
              ...existing,
              ...quoteInput,
              history: [
                { id: generateId('qh'), timestamp: nowIso, event: 'Quotation updated', actor: 'Hannah Bennett' },
                ...existing.history,
              ],
            };
            return {
              ...prev,
              quotations: prev.quotations.map((q) => (q.id === existing.id ? savedQuote : q)),
            };
          }
        }

        const nextNum = 1086 + prev.quotations.length;
        savedQuote = {
          ...quoteInput,
          id: generateId('qte'),
          reference: `QTE-${nextNum}`,
          createdAt: getTodayISODate(),
          history: [
            { id: generateId('qh'), timestamp: nowIso, event: 'Quotation created', actor: 'Hannah Bennett' },
          ],
        };

        return {
          ...prev,
          quotations: [savedQuote, ...prev.quotations],
          enquiries: prev.enquiries.map((e) =>
            e.id === savedQuote.enquiryId
              ? {
                  ...e,
                  status: savedQuote.status === 'Sent (Demo)' ? 'Quote Sent' : 'Quote Required',
                  activities: [
                    {
                      id: generateId('act'),
                      timestamp: nowIso,
                      author: 'Quotations',
                      action: `Created quotation ${savedQuote.reference}`,
                    },
                    ...e.activities,
                  ],
                }
              : e
          ),
        };
      });

      showToast({
        type: 'success',
        title: `Quotation ${savedQuote.reference} saved`,
        description: `Status: ${savedQuote.status}`,
      });
      return savedQuote;
    },
    [showToast]
  );

  const updateQuoteStatus = useCallback(
    (quoteId: string, status: QuoteStatus, createFollowUp = false) => {
      const nowIso = new Date().toISOString();
      const today = getTodayISODate();

      setState((prev) => {
        const quote = prev.quotations.find((q) => q.id === quoteId);
        if (!quote) return prev;

        const updatedQuotes = prev.quotations.map((q) => {
          if (q.id !== quoteId) return q;
          return {
            ...q,
            status,
            sentAt: status === 'Sent (Demo)' ? today : q.sentAt,
            history: [
              { id: generateId('qh'), timestamp: nowIso, event: `Status changed to ${status}`, actor: 'Hannah Bennett' },
              ...q.history,
            ],
          };
        });

        const enqStatusMap: Record<QuoteStatus, EnquiryStatus> = {
          Draft: 'Quote Required',
          'Ready for Review': 'Quote Required',
          'Sent (Demo)': 'Quote Sent',
          Accepted: 'Accepted',
          Rejected: 'Closed',
        };

        const oppStageMap: Partial<Record<QuoteStatus, CommercialStage>> = {
          'Sent (Demo)': 'Quote Sent',
          Accepted: 'Won',
          Rejected: 'Lost',
        };

        const updatedEnquiries = prev.enquiries.map((e) =>
          e.id === quote.enquiryId
            ? {
                ...e,
                status: enqStatusMap[status],
                activities: [
                  {
                    id: generateId('act'),
                    timestamp: nowIso,
                    author: 'Quotations',
                    action: `Quotation ${quote.reference} marked ${status}`,
                  },
                  ...e.activities,
                ],
              }
            : e
        );

        const mappedStage = oppStageMap[status];
        const updatedOpps = mappedStage
          ? prev.opportunities.map((o) =>
              o.enquiryId === quote.enquiryId ? { ...o, stage: mappedStage, updatedAt: today } : o
            )
          : prev.opportunities;

        let updatedFollowUps = prev.followUps;
        if (status === 'Sent (Demo)' && createFollowUp) {
          const linkedEnq = prev.enquiries.find((e) => e.id === quote.enquiryId);
          const fu: FollowUpTask = {
            id: generateId('fu'),
            enquiryId: quote.enquiryId,
            customerName: quote.customerName,
            companyName: quote.companyName,
            type: 'Quote follow-up',
            dueDate: addDaysISO(today, 2),
            priority: 'High',
            assignedToId: linkedEnq?.assignedToId || 'tm-1',
            status: 'Pending',
            suggestedMessage: `Hello ${quote.customerName}, I'm checking in regarding quotation ${quote.reference} for ${quote.serviceCategory} at ${quote.location}. Please let us know if you have any questions or would like to confirm a start date.`,
            createdAt: today,
          };
          updatedFollowUps = [fu, ...prev.followUps];
        }

        return {
          ...prev,
          quotations: updatedQuotes,
          enquiries: updatedEnquiries,
          opportunities: updatedOpps,
          followUps: updatedFollowUps,
        };
      });

      showToast({
        type: 'success',
        title: `Quotation marked ${status}`,
        description:
          status === 'Sent (Demo)' && createFollowUp
            ? '2-day Quote Follow-up task scheduled in Follow-up Centre.'
            : 'Linked enquiry and pipeline updated.',
      });
    },
    [showToast]
  );

  // Site Visits
  const createSiteVisit = useCallback(
    (visitInput: Omit<SiteVisit, 'id' | 'reference' | 'createdAt'>) => {
      const nowIso = new Date().toISOString();
      const newVisit: SiteVisit = {
        ...visitInput,
        id: generateId('vis'),
        reference: `VIS-${407 + state.siteVisits.length}`,
        createdAt: getTodayISODate(),
      };

      setState((prev) => ({
        ...prev,
        siteVisits: [newVisit, ...prev.siteVisits],
        enquiries: prev.enquiries.map((e) =>
          e.id === newVisit.enquiryId
            ? {
                ...e,
                status: 'Awaiting Assessment',
                activities: [
                  {
                    id: generateId('act'),
                    timestamp: nowIso,
                    author: 'Site Visits',
                    action: `Scheduled site visit ${newVisit.reference} on ${newVisit.date} at ${newVisit.time}`,
                  },
                  ...e.activities,
                ],
              }
            : e
        ),
        opportunities: prev.opportunities.map((o) =>
          o.enquiryId === newVisit.enquiryId
            ? { ...o, stage: 'Site Visit Needed', updatedAt: getTodayISODate() }
            : o
        ),
      }));

      showToast({
        type: 'success',
        title: `Site visit ${newVisit.reference} scheduled`,
        description: `${newVisit.customerName} on ${newVisit.date} at ${newVisit.time}.`,
      });
      return newVisit;
    },
    [state.siteVisits.length, showToast]
  );

  const updateSiteVisit = useCallback(
    (visitId: string, patch: Partial<SiteVisit>) => {
      setState((prev) => ({
        ...prev,
        siteVisits: prev.siteVisits.map((v) => (v.id === visitId ? { ...v, ...patch } : v)),
      }));
      showToast({ type: 'success', title: 'Site visit updated' });
    },
    [showToast]
  );

  const completeSiteVisit = useCallback(
    (visitId: string, assessment: SiteAssessmentNotes) => {
      const nowIso = new Date().toISOString();
      setState((prev) => {
        const visit = prev.siteVisits.find((v) => v.id === visitId);
        if (!visit) return prev;
        return {
          ...prev,
          siteVisits: prev.siteVisits.map((v) =>
            v.id === visitId ? { ...v, status: 'Completed' as VisitStatus, assessment } : v
          ),
          enquiries: prev.enquiries.map((e) =>
            e.id === visit.enquiryId
              ? {
                  ...e,
                  status: 'Quote Required',
                  activities: [
                    {
                      id: generateId('act'),
                      timestamp: nowIso,
                      author: 'Site Visits',
                      action: `Site visit ${visit.reference} completed — ready for quotation`,
                    },
                    ...e.activities,
                  ],
                }
              : e
          ),
          opportunities: prev.opportunities.map((o) =>
            o.enquiryId === visit.enquiryId
              ? { ...o, stage: 'Quotation Preparation', updatedAt: getTodayISODate() }
              : o
          ),
        };
      });
      showToast({
        type: 'success',
        title: 'Assessment saved & visit completed',
        description: 'You can now prepare a pre-filled quotation.',
      });
    },
    [showToast]
  );

  // Jobs
  const createJob = useCallback(
    (jobInput: Omit<CleaningJob, 'id' | 'reference'>) => {
      const nowIso = new Date().toISOString();
      const newJob: CleaningJob = {
        ...jobInput,
        id: generateId('job'),
        reference: `JOB-${511 + state.jobs.length}`,
      };

      setState((prev) => ({
        ...prev,
        jobs: [newJob, ...prev.jobs],
        enquiries: newJob.enquiryId
          ? prev.enquiries.map((e) =>
              e.id === newJob.enquiryId
                ? {
                    ...e,
                    status: 'Converted',
                    activities: [
                      {
                        id: generateId('act'),
                        timestamp: nowIso,
                        author: 'Scheduling',
                        action: `Job ${newJob.reference} scheduled for ${newJob.date}`,
                      },
                      ...e.activities,
                    ],
                  }
                : e
            )
          : prev.enquiries,
      }));

      showToast({
        type: 'success',
        title: `Job ${newJob.reference} scheduled`,
        description: `${newJob.assignedTeam} assigned for ${newJob.date}.`,
      });
      return newJob;
    },
    [state.jobs.length, showToast]
  );

  const updateJob = useCallback(
    (jobId: string, patch: Partial<CleaningJob>) => {
      setState((prev) => ({
        ...prev,
        jobs: prev.jobs.map((j) => (j.id === jobId ? { ...j, ...patch } : j)),
      }));
      showToast({ type: 'success', title: 'Job schedule updated' });
    },
    [showToast]
  );

  const updateJobStatus = useCallback(
    (jobId: string, status: JobStatus) => {
      setState((prev) => ({
        ...prev,
        jobs: prev.jobs.map((j) => (j.id === jobId ? { ...j, status } : j)),
      }));
      showToast({ type: 'success', title: `Job marked ${status}` });
    },
    [showToast]
  );

  // Follow-ups
  const createFollowUp = useCallback(
    (taskInput: Omit<FollowUpTask, 'id' | 'createdAt' | 'status'>) => {
      const newTask: FollowUpTask = {
        ...taskInput,
        id: generateId('fu'),
        status: 'Pending',
        createdAt: getTodayISODate(),
      };
      setState((prev) => ({
        ...prev,
        followUps: [newTask, ...prev.followUps],
      }));
      showToast({
        type: 'success',
        title: 'Follow-up task added',
        description: `${newTask.type} due ${newTask.dueDate}.`,
      });
      return newTask;
    },
    [showToast]
  );

  const updateFollowUp = useCallback(
    (taskId: string, patch: Partial<FollowUpTask>) => {
      setState((prev) => ({
        ...prev,
        followUps: prev.followUps.map((f) => (f.id === taskId ? { ...f, ...patch } : f)),
      }));
      showToast({ type: 'success', title: 'Follow-up updated' });
    },
    [showToast]
  );

  const completeFollowUp = useCallback(
    (taskId: string) => {
      const nowIso = new Date().toISOString();
      setState((prev) => ({
        ...prev,
        followUps: prev.followUps.map((f) =>
          f.id === taskId ? { ...f, status: 'Completed', completedAt: nowIso } : f
        ),
      }));
      showToast({
        type: 'success',
        title: 'Follow-up completed',
        description: 'Dashboard totals updated.',
      });
    },
    [showToast]
  );

  const snoozeFollowUp = useCallback(
    (taskId: string, days: number) => {
      setState((prev) => ({
        ...prev,
        followUps: prev.followUps.map((f) =>
          f.id === taskId
            ? { ...f, dueDate: addDaysISO(getTodayISODate(), days), status: 'Pending' }
            : f
        ),
      }));
      showToast({
        type: 'info',
        title: `Snoozed by ${days} day${days > 1 ? 's' : ''}`,
      });
    },
    [showToast]
  );

  // Settings & Reset
  const updateSettings = useCallback(
    (patch: Partial<DemoSettings>) => {
      setState((prev) => ({
        ...prev,
        settings: { ...prev.settings, ...patch },
      }));
      showToast({ type: 'success', title: 'Preferences saved' });
    },
    [showToast]
  );

  const resetDemoData = useCallback(() => {
    const fresh = createSeedData();
    setState(fresh);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    showToast({
      type: 'success',
      title: 'Demo data restored',
      description: 'All sample enquiries, quotes, visits, jobs, and follow-ups reset.',
    });
  }, [showToast]);

  return (
    <OperationsContext.Provider
      value={{
        state,
        activeSection,
        navPayload,
        clearNavPayload,
        navigateTo,
        toasts,
        showToast,
        dismissToast,
        confirmState,
        requestConfirm,
        closeConfirm,
        createEnquiry,
        updateEnquiry,
        addEnquiryNote,
        deleteEnquiry,
        moveOpportunityStage,
        updateOpportunity,
        saveQuotation,
        updateQuoteStatus,
        createSiteVisit,
        updateSiteVisit,
        completeSiteVisit,
        createJob,
        updateJob,
        updateJobStatus,
        createFollowUp,
        updateFollowUp,
        completeFollowUp,
        snoozeFollowUp,
        updateSettings,
        resetDemoData,
        getMemberName,
      }}
    >
      {children}
    </OperationsContext.Provider>
  );
};

export function useOperations(): OperationsContextValue {
  const ctx = useContext(OperationsContext);
  if (!ctx) {
    throw new Error('useOperations must be used within OperationsProvider');
  }
  return ctx;
}
