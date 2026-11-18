export type NavigationSection =
  | 'overview'
  | 'enquiries'
  | 'pipeline'
  | 'quotations'
  | 'visits'
  | 'jobs'
  | 'followups'
  | 'assistant'
  | 'settings';

export type ServiceCategory =
  | 'Domestic Cleaning'
  | 'Regular Cleaning'
  | 'Deep Cleaning'
  | 'End of Tenancy'
  | 'Office Cleaning'
  | 'Commercial Cleaning'
  | 'Specialist Cleaning'
  | 'After Builders Cleaning';

export type OperatingArea =
  | 'Islington'
  | "King's Cross"
  | 'Euston'
  | 'Willesden'
  | 'Harrow'
  | 'Watford'
  | 'St Albans';

export type EnquiryStatus =
  | 'New'
  | 'Contacted'
  | 'Awaiting Assessment'
  | 'Quote Required'
  | 'Quote Sent'
  | 'Accepted'
  | 'Converted'
  | 'Closed';

export type CommercialStage =
  | 'New Request'
  | 'Requirements Review'
  | 'Site Visit Needed'
  | 'Quotation Preparation'
  | 'Quote Sent'
  | 'Client Decision'
  | 'Won'
  | 'Lost';

export type QuoteStatus =
  | 'Draft'
  | 'Ready for Review'
  | 'Sent (Demo)'
  | 'Accepted'
  | 'Rejected';

export type VisitStatus =
  | 'Scheduled'
  | 'Confirmed'
  | 'Completed'
  | 'Rescheduled'
  | 'Cancelled';

export type JobStatus =
  | 'Upcoming'
  | 'Scheduled'
  | 'In Progress'
  | 'Completed'
  | 'Cancelled';

export type FollowUpType =
  | 'New enquiry acknowledgement'
  | 'Missing information request'
  | 'Site visit confirmation'
  | 'Quote follow-up'
  | 'Client decision reminder'
  | 'Repeat booking follow-up';

export type FollowUpStatus = 'Pending' | 'Completed';

export type Priority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type EnquirySource =
  | 'Website Booking Form'
  | 'Commercial Quote Request'
  | 'Telephone'
  | 'Email'
  | 'Referral';

export interface ActivityEntry {
  id: string;
  timestamp: string;
  author: string;
  action: string;
  detail?: string;
}

export interface InternalNote {
  id: string;
  timestamp: string;
  author: string;
  text: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  areaFocus: string;
  email: string;
  initials: string;
}

export interface Enquiry {
  id: string;
  reference: string;
  customerName: string;
  companyName?: string;
  email: string;
  phone: string;
  service: ServiceCategory;
  location: OperatingArea;
  address: string;
  postcode: string;
  propertyType: string;
  frequency: 'One-off' | 'Daily' | '3x Weekly' | 'Weekly' | 'Fortnightly' | 'Monthly';
  preferredDate: string;
  source: EnquirySource;
  status: EnquiryStatus;
  priority: Priority;
  assignedToId: string;
  createdAt: string;
  summary: string;
  notes: InternalNote[];
  activities: ActivityEntry[];
}

export interface CommercialOpportunity {
  id: string;
  enquiryId: string;
  reference: string;
  companyName: string;
  contactName: string;
  location: OperatingArea;
  postcode: string;
  cleaningType: ServiceCategory;
  frequency: 'One-off' | 'Daily' | '3x Weekly' | 'Weekly' | 'Fortnightly' | 'Monthly';
  stage: CommercialStage;
  estimatedMonthlyValue?: number;
  priority: Priority;
  assignedToId: string;
  nextAction: string;
  numberOfSites: number;
  buildingType: string;
  approxFloorAreaSqFt: number;
  roomsOrFloors: string;
  preferredCleaningHours: string;
  serviceRequirements: string[];
  visitRequired: boolean;
  visitNotes: string;
  updatedAt: string;
}

export interface QuoteAdditionalService {
  id: string;
  label: string;
  amount: number;
  selected: boolean;
}

export interface QuoteHistoryEntry {
  id: string;
  timestamp: string;
  event: string;
  actor: string;
}

export interface Quotation {
  id: string;
  reference: string;
  enquiryId: string;
  customerName: string;
  companyName?: string;
  location: OperatingArea;
  address: string;
  postcode: string;
  serviceDescription: string;
  serviceCategory: ServiceCategory;
  frequency: 'One-off' | 'Daily' | '3x Weekly' | 'Weekly' | 'Fortnightly' | 'Monthly';
  estimatedHours: number;
  hourlyRate: number;
  additionalServices: QuoteAdditionalService[];
  includeVat: boolean;
  vatRate: number; // e.g., 20
  subtotal: number;
  vatAmount: number;
  total: number;
  status: QuoteStatus;
  termsAndNotes: string;
  validUntil: string;
  createdAt: string;
  sentAt?: string;
  history: QuoteHistoryEntry[];
}

export interface SiteAssessmentNotes {
  propertyCondition: string;
  cleaningRequirements: string;
  accessDetails: string;
  estimatedHours: number;
  requiredEquipment: string;
  staffRecommendation: string;
  followUpAction: string;
}

export interface SiteVisit {
  id: string;
  reference: string;
  enquiryId: string;
  customerName: string;
  companyName?: string;
  location: OperatingArea;
  address: string;
  postcode: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  assessorId: string;
  status: VisitStatus;
  specialInstructions: string;
  assessment: SiteAssessmentNotes;
  createdAt: string;
}

export interface CleaningJob {
  id: string;
  reference: string;
  enquiryId?: string;
  quotationId?: string;
  customerName: string;
  companyName?: string;
  service: ServiceCategory;
  location: OperatingArea;
  address: string;
  postcode: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  durationHours: number;
  assignedTeam: string;
  leadMemberId: string;
  isRecurring: boolean;
  recurrencePattern?: string;
  status: JobStatus;
  notes: string;
}

export interface FollowUpTask {
  id: string;
  enquiryId: string;
  customerName: string;
  companyName?: string;
  type: FollowUpType;
  dueDate: string; // YYYY-MM-DD
  priority: Priority;
  assignedToId: string;
  status: FollowUpStatus;
  suggestedMessage: string;
  completedAt?: string;
  createdAt: string;
}

export interface DemoSettings {
  businessName: string;
  websiteUrl: string;
  timezone: string;
  currency: string;
  defaultVatRate: number;
  autoSuggestQuoteFollowUp: boolean;
  autoDraftVisitConfirmation: boolean;
  highlightOverdueTasks: boolean;
  notifyNewEnquiry: boolean;
  notifyQuoteAccepted: boolean;
  notifyVisitReminders: boolean;
}

export interface OperationsState {
  enquiries: Enquiry[];
  opportunities: CommercialOpportunity[];
  quotations: Quotation[];
  siteVisits: SiteVisit[];
  jobs: CleaningJob[];
  followUps: FollowUpTask[];
  teamMembers: TeamMember[];
  settings: DemoSettings;
}

export type AssistantPresetAction =
  | 'acknowledge'
  | 'missing_details'
  | 'quote_followup'
  | 'visit_confirmation'
  | 'booking_confirmation'
  | 'summarise';

export interface NavigationPayload {
  openCreateEnquiry?: boolean;
  selectedEnquiryId?: string;
  openCreateQuoteForEnquiryId?: string;
  prefillQuoteFromVisitId?: string;
  selectedQuoteId?: string;
  openCreateVisitForEnquiryId?: string;
  selectedVisitId?: string;
  openCreateJobFromQuoteId?: string;
  openCreateFollowUpForEnquiryId?: string;
  assistantEnquiryId?: string;
  assistantAction?: AssistantPresetAction;
}
