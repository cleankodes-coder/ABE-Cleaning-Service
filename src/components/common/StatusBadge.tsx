import React from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Send,
  XCircle,
  CalendarClock,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

const STATUS_STYLE_MAP: Record<
  string,
  { bg: string; text: string; border: string; icon: React.ReactNode }
> = {
  // Semantic Success
  Accepted: {
    bg: 'bg-[#ECFDF5]',
    text: 'text-[#15803D]',
    border: 'border-[#BBF7D0]',
    icon: <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />,
  },
  Converted: {
    bg: 'bg-[#ECFDF5]',
    text: 'text-[#15803D]',
    border: 'border-[#BBF7D0]',
    icon: <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />,
  },
  Completed: {
    bg: 'bg-[#ECFDF5]',
    text: 'text-[#15803D]',
    border: 'border-[#BBF7D0]',
    icon: <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />,
  },
  Confirmed: {
    bg: 'bg-[#ECFDF5]',
    text: 'text-[#15803D]',
    border: 'border-[#BBF7D0]',
    icon: <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />,
  },
  Won: {
    bg: 'bg-[#ECFDF5]',
    text: 'text-[#15803D]',
    border: 'border-[#BBF7D0]',
    icon: <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />,
  },

  // Brand Navy / Active States
  New: {
    bg: 'bg-[#EEF1F7]',
    text: 'text-[#0F1B3D]',
    border: 'border-[#D0D7E7]',
    icon: <Sparkles className="h-3.5 w-3.5 shrink-0" />,
  },
  Contacted: {
    bg: 'bg-[#F3F5F9]',
    text: 'text-[#2C3752]',
    border: 'border-[#DCE1EC]',
    icon: <Clock className="h-3.5 w-3.5 shrink-0" />,
  },
  'Quote Sent': {
    bg: 'bg-[#EEF1F7]',
    text: 'text-[#0F1B3D]',
    border: 'border-[#D0D7E7]',
    icon: <Send className="h-3.5 w-3.5 shrink-0" />,
  },
  'Sent (Demo)': {
    bg: 'bg-[#EEF1F7]',
    text: 'text-[#0F1B3D]',
    border: 'border-[#D0D7E7]',
    icon: <Send className="h-3.5 w-3.5 shrink-0" />,
  },
  Scheduled: {
    bg: 'bg-[#EEF1F7]',
    text: 'text-[#0F1B3D]',
    border: 'border-[#D0D7E7]',
    icon: <CalendarClock className="h-3.5 w-3.5 shrink-0" />,
  },
  Upcoming: {
    bg: 'bg-[#F7F2E7]',
    text: 'text-[#73561F]',
    border: 'border-[#DECFA8]',
    icon: <CalendarClock className="h-3.5 w-3.5 shrink-0" />,
  },
  'In Progress': {
    bg: 'bg-[#EFF6FF]',
    text: 'text-[#1D4ED8]',
    border: 'border-[#BFDBFE]',
    icon: <RefreshCw className="h-3.5 w-3.5 shrink-0" />,
  },

  // Semantic Warning / Pending / Review
  'Awaiting Assessment': {
    bg: 'bg-[#FFFBEB]',
    text: 'text-[#B45309]',
    border: 'border-[#FDE68A]',
    icon: <Clock className="h-3.5 w-3.5 shrink-0" />,
  },
  'Quote Required': {
    bg: 'bg-[#FFFBEB]',
    text: 'text-[#B45309]',
    border: 'border-[#FDE68A]',
    icon: <FileText className="h-3.5 w-3.5 shrink-0" />,
  },
  'Ready for Review': {
    bg: 'bg-[#FFFBEB]',
    text: 'text-[#B45309]',
    border: 'border-[#FDE68A]',
    icon: <FileText className="h-3.5 w-3.5 shrink-0" />,
  },
  Rescheduled: {
    bg: 'bg-[#FFFBEB]',
    text: 'text-[#B45309]',
    border: 'border-[#FDE68A]',
    icon: <CalendarClock className="h-3.5 w-3.5 shrink-0" />,
  },
  Pending: {
    bg: 'bg-[#FFFBEB]',
    text: 'text-[#B45309]',
    border: 'border-[#FDE68A]',
    icon: <Clock className="h-3.5 w-3.5 shrink-0" />,
  },

  // Semantic Error / Danger
  Overdue: {
    bg: 'bg-[#FEF2F2]',
    text: 'text-[#B91C1C]',
    border: 'border-[#FECACA]',
    icon: <AlertCircle className="h-3.5 w-3.5 shrink-0" />,
  },
  Rejected: {
    bg: 'bg-[#FEF2F2]',
    text: 'text-[#B91C1C]',
    border: 'border-[#FECACA]',
    icon: <XCircle className="h-3.5 w-3.5 shrink-0" />,
  },
  Cancelled: {
    bg: 'bg-[#FEF2F2]',
    text: 'text-[#B91C1C]',
    border: 'border-[#FECACA]',
    icon: <XCircle className="h-3.5 w-3.5 shrink-0" />,
  },
  Lost: {
    bg: 'bg-[#FEF2F2]',
    text: 'text-[#B91C1C]',
    border: 'border-[#FECACA]',
    icon: <XCircle className="h-3.5 w-3.5 shrink-0" />,
  },
  Draft: {
    bg: 'bg-[#F4F5F8]',
    text: 'text-[#525D73]',
    border: 'border-[#E2E5EC]',
    icon: <FileText className="h-3.5 w-3.5 shrink-0" />,
  },
  Closed: {
    bg: 'bg-[#F4F5F8]',
    text: 'text-[#525D73]',
    border: 'border-[#E2E5EC]',
    icon: <XCircle className="h-3.5 w-3.5 shrink-0" />,
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const style = STATUS_STYLE_MAP[status] || {
    bg: 'bg-[#F4F5F8]',
    text: 'text-[#525D73]',
    border: 'border-[#E2E5EC]',
    icon: <Clock className="h-3.5 w-3.5 shrink-0" />,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border font-medium whitespace-nowrap shrink-0 ${style.bg} ${style.text} ${style.border} ${
        size === 'sm' ? 'px-2 py-0.5 text-[11.5px]' : 'px-2.5 py-1 text-xs'
      }`}
    >
      {style.icon}
      <span>{status}</span>
    </span>
  );
};

export const PriorityLabel: React.FC<{ priority: string }> = ({ priority }) => {
  const colorMap: Record<string, string> = {
    Urgent: 'text-[#B91C1C] font-semibold',
    High: 'text-[#8A6A2C] font-semibold',
    Medium: 'text-[#0F1B3D] font-medium',
    Low: 'text-[#647087] font-normal',
  };
  return (
    <span className={`text-xs whitespace-nowrap ${colorMap[priority] || 'text-[#647087]'}`}>
      {priority} priority
    </span>
  );
};
