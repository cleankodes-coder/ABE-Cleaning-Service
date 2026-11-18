import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import {
  Plus,
  FileSpreadsheet,
  MapPin,
  BellRing,
  ArrowUpRight,
  Clock,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { useOperations } from '../../context/OperationsContext';
import {
  OPERATING_AREAS,
  addDaysISO,
  formatGBP,
  formatUKDateShort,
  getServiceGroup,
  getTodayISODate,
} from '../../utils/formatters';
import { StatusBadge } from '../common/StatusBadge';

export const OverviewDashboard: React.FC = () => {
  const { state, navigateTo, getMemberName } = useOperations();
  const today = getTodayISODate();

  // Dynamic KPIs computed from shared state
  const kpis = useMemo(() => {
    const totalEnquiries = state.enquiries.length;
    const newEnquiries = state.enquiries.filter((e) => e.status === 'New').length;
    const quotesAwaiting = state.quotations.filter(
      (q) => q.status === 'Sent (Demo)' || q.status === 'Ready for Review'
    ).length;
    const visitsScheduled = state.siteVisits.filter(
      (v) => v.status === 'Scheduled' || v.status === 'Confirmed' || v.status === 'Rescheduled'
    ).length;
    const followUpsDue = state.followUps.filter(
      (f) => f.status === 'Pending' && f.dueDate <= today
    ).length;
    const jobsConfirmed = state.jobs.filter(
      (j) => j.status === 'Scheduled' || j.status === 'Upcoming' || j.status === 'In Progress'
    ).length;

    return [
      {
        label: 'Total Enquiries',
        value: totalEnquiries,
        subtext: 'All active & archived records',
        onClick: () => navigateTo('enquiries'),
      },
      {
        label: 'New Enquiries',
        value: newEnquiries,
        subtext: 'Awaiting initial response',
        accent: newEnquiries > 0,
        onClick: () => navigateTo('enquiries'),
      },
      {
        label: 'Quotes Awaiting Response',
        value: quotesAwaiting,
        subtext: 'Sent or ready for review',
        onClick: () => navigateTo('quotations'),
      },
      {
        label: 'Site Visits Scheduled',
        value: visitsScheduled,
        subtext: 'Upcoming property assessments',
        onClick: () => navigateTo('visits'),
      },
      {
        label: 'Follow-ups Due',
        value: followUpsDue,
        subtext: 'Due today or overdue',
        warning: followUpsDue > 0,
        onClick: () => navigateTo('followups'),
      },
      {
        label: 'Jobs Confirmed',
        value: jobsConfirmed,
        subtext: 'Upcoming & active cleans',
        onClick: () => navigateTo('jobs'),
      },
    ];
  }, [state, today, navigateTo]);

  // A. Enquiry Trends across 6 rolling periods + live recent items
  const trendData = useMemo(() => {
    const periods = [
      { label: 'Wk -5', start: addDaysISO(today, -41), end: addDaysISO(today, -35), baseDom: 3, baseCom: 2 },
      { label: 'Wk -4', start: addDaysISO(today, -34), end: addDaysISO(today, -28), baseDom: 4, baseCom: 2 },
      { label: 'Wk -3', start: addDaysISO(today, -27), end: addDaysISO(today, -21), baseDom: 3, baseCom: 3 },
      { label: 'Wk -2', start: addDaysISO(today, -20), end: addDaysISO(today, -14), baseDom: 5, baseCom: 3 },
      { label: 'Last Wk', start: addDaysISO(today, -13), end: addDaysISO(today, -7), baseDom: 4, baseCom: 4 },
      { label: 'This Wk', start: addDaysISO(today, -6), end: addDaysISO(today, 1), baseDom: 0, baseCom: 0 },
    ];

    return periods.map((p, idx) => {
      const inRange = state.enquiries.filter(
        (e) => e.createdAt >= p.start && e.createdAt <= p.end
      );
      const domestic =
        (idx < 5 ? p.baseDom : 0) +
        inRange.filter((e) => getServiceGroup(e.service) === 'Domestic').length;
      const commercial =
        (idx < 5 ? p.baseCom : 0) +
        inRange.filter((e) => getServiceGroup(e.service) !== 'Domestic').length;
      return {
        name: p.label,
        Domestic: domestic,
        Commercial: commercial,
        Total: domestic + commercial,
      };
    });
  }, [state.enquiries, today]);

  // B. Service Breakdown Donut — Navy & Gold Cohesive Palette
  const serviceBreakdown = useMemo(() => {
    const counts = { Domestic: 0, Commercial: 0, Specialist: 0 };
    state.enquiries.forEach((e) => {
      counts[getServiceGroup(e.service)] += 1;
    });
    return [
      { name: 'Domestic', value: counts.Domestic, color: '#0F1B3D' },
      { name: 'Commercial', value: counts.Commercial, color: '#8A6A2C' },
      { name: 'Specialist', value: counts.Specialist, color: '#4B5E8C' },
    ];
  }, [state.enquiries]);

  // C. Location Performance Bar Chart
  const locationData = useMemo(() => {
    return OPERATING_AREAS.map((area) => {
      const count = state.enquiries.filter((e) => e.location === area).length;
      return {
        area: area === "King's Cross" ? "King's X" : area,
        fullArea: area,
        enquiries: count,
      };
    });
  }, [state.enquiries]);

  // D. Recent Enquiries
  const recentEnquiries = useMemo(() => {
    return [...state.enquiries]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5);
  }, [state.enquiries]);

  // E. Attention Required
  const attentionItems = useMemo(() => {
    const items: {
      id: string;
      type: string;
      title: string;
      meta: string;
      badge: string;
      onClick: () => void;
    }[] = [];

    state.followUps
      .filter((f) => f.status === 'Pending' && f.dueDate < today)
      .slice(0, 3)
      .forEach((f) => {
        items.push({
          id: `att-fu-${f.id}`,
          type: 'Overdue Follow-up',
          title: f.companyName || f.customerName,
          meta: `${f.type} · Due ${formatUKDateShort(f.dueDate)}`,
          badge: 'Overdue',
          onClick: () => navigateTo('followups'),
        });
      });

    state.enquiries
      .filter((e) => (e.priority === 'Urgent' || e.priority === 'High') && e.status === 'New')
      .slice(0, 2)
      .forEach((e) => {
        items.push({
          id: `att-enq-${e.id}`,
          type: `${e.priority} New Enquiry`,
          title: e.companyName || e.customerName,
          meta: `${e.service} · ${e.location}`,
          badge: 'New',
          onClick: () => navigateTo('enquiries', { selectedEnquiryId: e.id }),
        });
      });

    state.quotations
      .filter((q) => q.status === 'Sent (Demo)' || q.status === 'Ready for Review')
      .slice(0, 2)
      .forEach((q) => {
        items.push({
          id: `att-qte-${q.id}`,
          type: q.status === 'Ready for Review' ? 'Quote Review Needed' : 'Pending Client Quote',
          title: `${q.reference} · ${q.companyName || q.customerName}`,
          meta: `${formatGBP(q.total)} · ${q.location}`,
          badge: q.status,
          onClick: () => navigateTo('quotations', { selectedQuoteId: q.id }),
        });
      });

    return items.slice(0, 6);
  }, [state.followUps, state.enquiries, state.quotations, today, navigateTo]);

  // F. Upcoming Site Visits
  const upcomingVisits = useMemo(() => {
    return state.siteVisits
      .filter((v) => v.status !== 'Cancelled' && v.status !== 'Completed')
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
      .slice(0, 4);
  }, [state.siteVisits]);

  return (
    <div className="space-y-6">
      {/* Executive Header & Quick Actions */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-[26px] font-bold tracking-tight text-[#0F1B3D]">
            Good morning, ABE Team
          </h1>
          <p className="mt-1 text-sm text-[#647087]">
            Here&apos;s what&apos;s happening across your cleaning operations.
          </p>
        </div>

        {/* G. Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => navigateTo('enquiries', { openCreateEnquiry: true })}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F1B3D] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#1A2B5C] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 text-[#DEC896]" />
            <span>New Enquiry</span>
          </button>
          <button
            type="button"
            onClick={() =>
              navigateTo('quotations', {
                openCreateQuoteForEnquiryId: state.enquiries[0]?.id,
              })
            }
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E8EAF0] bg-white px-3.5 py-2 text-xs font-medium text-[#0F1B3D] hover:border-[#8A6A2C]/60 hover:bg-[#F7F2E7]/40 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-[#8A6A2C]" />
            <span>Create Quote</span>
          </button>
          <button
            type="button"
            onClick={() =>
              navigateTo('visits', {
                openCreateVisitForEnquiryId: state.enquiries[0]?.id,
              })
            }
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E8EAF0] bg-white px-3.5 py-2 text-xs font-medium text-[#0F1B3D] hover:border-[#8A6A2C]/60 hover:bg-[#F7F2E7]/40 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <MapPin className="h-3.5 w-3.5 text-[#8A6A2C]" />
            <span>Schedule Visit</span>
          </button>
          <button
            type="button"
            onClick={() =>
              navigateTo('followups', {
                openCreateFollowUpForEnquiryId: state.enquiries[0]?.id,
              })
            }
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E8EAF0] bg-white px-3.5 py-2 text-xs font-medium text-[#0F1B3D] hover:border-[#8A6A2C]/60 hover:bg-[#F7F2E7]/40 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <BellRing className="h-3.5 w-3.5 text-[#8A6A2C]" />
            <span>Add Follow-up</span>
          </button>
        </div>
      </div>

      {/* 6 Dynamic KPI Cards */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi) => (
          <button
            key={kpi.label}
            type="button"
            onClick={kpi.onClick}
            className="group flex flex-col justify-between rounded-xl border border-[#E8EAF0] bg-white p-4 text-left shadow-2xs transition-all hover:border-[#8A6A2C]/60 hover:shadow-xs cursor-pointer"
          >
            <div className="flex items-start justify-between gap-2 w-full">
              <span className="text-xs font-medium text-[#647087] leading-snug">
                {kpi.label}
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 text-[#8A6A2C] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span
                className={`font-display text-2xl font-bold tabular-nums ${
                  kpi.warning
                    ? 'text-[#B45309]'
                    : kpi.accent
                    ? 'text-[#8A6A2C]'
                    : 'text-[#0F1B3D]'
                }`}
              >
                {kpi.value}
              </span>
            </div>
            <p className="mt-1 text-[11.5px] text-[#647087] truncate w-full">{kpi.subtext}</p>
          </button>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* A. Enquiry Trends */}
        <section className="rounded-xl border border-[#E8EAF0] bg-white p-5 shadow-2xs lg:col-span-5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-[15px] font-semibold text-[#0F1B3D]">
                Enquiry Trends
              </h2>
              <p className="text-xs text-[#647087]">
                Rolling 6-week domestic vs commercial enquiries
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#647087]">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-xs bg-[#0F1B3D]" />
                Domestic
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-xs bg-[#8A6A2C]" />
                Commercial
              </span>
            </div>
          </div>

          <div className="mt-4 h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradDomestic" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0F1B3D" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#0F1B3D" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradCommercial" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8A6A2C" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#8A6A2C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F5" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#647087', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: '#647087', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #E8EAF0',
                    fontSize: '12px',
                    boxShadow: '0 4px 12px rgba(15,27,61,0.08)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="Domestic"
                  stroke="#0F1B3D"
                  strokeWidth={2}
                  fill="url(#gradDomestic)"
                />
                <Area
                  type="monotone"
                  dataKey="Commercial"
                  stroke="#8A6A2C"
                  strokeWidth={2}
                  fill="url(#gradCommercial)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* B. Service Breakdown Donut */}
        <section className="rounded-xl border border-[#E8EAF0] bg-white p-5 shadow-2xs lg:col-span-3">
          <div>
            <h2 className="font-display text-[15px] font-semibold text-[#0F1B3D]">
              Service Breakdown
            </h2>
            <p className="text-xs text-[#647087]">Active enquiry share by division</p>
          </div>

          <div className="mt-2 h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={serviceBreakdown}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={68}
                  paddingAngle={3}
                >
                  {serviceBreakdown.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #E8EAF0',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-1 space-y-1.5 border-t border-[#EEF0F5] pt-3">
            {serviceBreakdown.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-[#2C3752]">
                  <span
                    className="h-2.5 w-2.5 rounded-xs shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span>{item.name}</span>
                </span>
                <span className="font-mono-tabular font-semibold text-[#0F1B3D]">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* C. Location Performance Bar Chart */}
        <section className="rounded-xl border border-[#E8EAF0] bg-white p-5 shadow-2xs lg:col-span-4">
          <div>
            <h2 className="font-display text-[15px] font-semibold text-[#0F1B3D]">
              Location Performance
            </h2>
            <p className="text-xs text-[#647087]">Enquiries across ABE operating areas</p>
          </div>

          <div className="mt-4 h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={locationData} margin={{ top: 8, right: 6, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F5" vertical={false} />
                <XAxis
                  dataKey="area"
                  tick={{ fill: '#647087', fontSize: 10.5 }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: '#647087', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value) => [`${value} enquiries`, 'Volume']}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.fullArea || ''}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #E8EAF0',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="enquiries" fill="#0F1B3D" radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Bottom Operational Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* D. Recent Enquiries */}
        <section className="rounded-xl border border-[#E8EAF0] bg-white p-5 shadow-2xs lg:col-span-5">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#EEF0F5]">
            <div>
              <h2 className="font-display text-[15px] font-semibold text-[#0F1B3D]">
                Recent Enquiries
              </h2>
              <p className="text-xs text-[#647087]">Latest incoming domestic &amp; commercial requests</p>
            </div>
            <button
              type="button"
              onClick={() => navigateTo('enquiries')}
              className="text-xs font-semibold text-[#8A6A2C] hover:text-[#0F1B3D] whitespace-nowrap cursor-pointer"
            >
              View all
            </button>
          </div>

          <div className="divide-y divide-[#EEF0F5]">
            {recentEnquiries.map((enq) => (
              <button
                key={enq.id}
                type="button"
                onClick={() => navigateTo('enquiries', { selectedEnquiryId: enq.id })}
                className="flex w-full items-center justify-between gap-3 py-3 text-left hover:bg-[#F7F8FA] px-1.5 -mx-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#0F1B3D] truncate">
                    {enq.companyName || enq.customerName}
                  </p>
                  <p className="mt-0.5 text-xs text-[#647087] truncate">
                    {enq.service} · {enq.location} · {formatUKDateShort(enq.createdAt)}
                  </p>
                </div>
                <StatusBadge status={enq.status} />
              </button>
            ))}
          </div>
        </section>

        {/* E. Attention Required */}
        <section className="rounded-xl border border-[#E8EAF0] bg-white p-5 shadow-2xs lg:col-span-4">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#EEF0F5]">
            <div>
              <h2 className="font-display text-[15px] font-semibold text-[#0F1B3D]">
                Attention Required
              </h2>
              <p className="text-xs text-[#647087]">Overdue follow-ups, urgent leads &amp; quotes</p>
            </div>
            <AlertCircle className="h-4 w-4 text-[#D97706] shrink-0" />
          </div>

          {attentionItems.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm font-medium text-[#0F1B3D]">All caught up</p>
              <p className="mt-1 text-xs text-[#647087]">
                No overdue follow-ups or urgent items awaiting action.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#EEF0F5]">
              {attentionItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.onClick}
                  className="flex w-full items-start justify-between gap-3 py-3 text-left hover:bg-[#F7F8FA] px-1.5 -mx-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-[#8A6A2C]">{item.type}</p>
                    <p className="text-sm font-semibold text-[#0F1B3D] truncate mt-0.5">
                      {item.title}
                    </p>
                    <p className="text-xs text-[#647087] truncate mt-0.5">{item.meta}</p>
                  </div>
                  <StatusBadge status={item.badge} />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* F. Upcoming Site Visits */}
        <section className="rounded-xl border border-[#E8EAF0] bg-white p-5 shadow-2xs lg:col-span-3">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#EEF0F5]">
            <div>
              <h2 className="font-display text-[15px] font-semibold text-[#0F1B3D]">
                Upcoming Site Visits
              </h2>
              <p className="text-xs text-[#647087]">Scheduled assessments</p>
            </div>
            <button
              type="button"
              onClick={() => navigateTo('visits')}
              className="text-xs font-semibold text-[#8A6A2C] hover:text-[#0F1B3D] whitespace-nowrap cursor-pointer"
            >
              Calendar
            </button>
          </div>

          {upcomingVisits.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-xs text-[#647087]">No upcoming site visits scheduled.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#EEF0F5]">
              {upcomingVisits.map((visit) => (
                <button
                  key={visit.id}
                  type="button"
                  onClick={() => navigateTo('visits', { selectedVisitId: visit.id })}
                  className="flex w-full flex-col gap-1 py-3 text-left hover:bg-[#F7F8FA] px-1.5 -mx-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#8A6A2C] flex items-center gap-1 tabular-nums">
                      <Calendar className="h-3 w-3 shrink-0" />
                      {formatUKDateShort(visit.date)} · {visit.time}
                    </span>
                    <StatusBadge status={visit.status} />
                  </div>
                  <p className="text-sm font-semibold text-[#0F1B3D] truncate">
                    {visit.companyName || visit.customerName}
                  </p>
                  <p className="text-xs text-[#647087] truncate flex items-center gap-1">
                    <Clock className="h-3 w-3 shrink-0" />
                    {visit.location} · Assessor: {getMemberName(visit.assessorId)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
