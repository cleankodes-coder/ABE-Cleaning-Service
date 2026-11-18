import { OperatingArea, ServiceCategory } from '../types/operations';

export const OPERATING_AREAS: OperatingArea[] = [
  'Islington',
  "King's Cross",
  'Euston',
  'Willesden',
  'Harrow',
  'Watford',
  'St Albans',
];

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  'Domestic Cleaning',
  'Regular Cleaning',
  'Deep Cleaning',
  'End of Tenancy',
  'Office Cleaning',
  'Commercial Cleaning',
  'Specialist Cleaning',
  'After Builders Cleaning',
];

export function formatGBP(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatGBPCompact(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getTodayISODate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDaysISO(baseIsoDate: string, days: number): string {
  const [y, m, d] = baseIsoDate.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  dt.setDate(dt.getDate() + days);
  const year = dt.getFullYear();
  const month = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatUKDate(isoDate: string): string {
  if (!isoDate) return '—';
  const datePart = isoDate.slice(0, 10);
  const [y, m, d] = datePart.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatUKDateShort(isoDate: string): string {
  if (!isoDate) return '—';
  const datePart = isoDate.slice(0, 10);
  const [y, m, d] = datePart.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function formatUKDateTime(isoTimestamp: string): string {
  if (!isoTimestamp) return '—';
  const dt = new Date(isoTimestamp);
  if (Number.isNaN(dt.getTime())) return isoTimestamp;
  return dt.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getServiceGroup(service: ServiceCategory): 'Domestic' | 'Commercial' | 'Specialist' {
  if (service === 'Domestic Cleaning' || service === 'Regular Cleaning' || service === 'Deep Cleaning' || service === 'End of Tenancy') {
    return 'Domestic';
  }
  if (service === 'Office Cleaning' || service === 'Commercial Cleaning') {
    return 'Commercial';
  }
  return 'Specialist';
}

export function generateId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 7)}-${Date.now().toString(36).slice(-4)}`;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isValidUKPostcode(postcode: string): boolean {
  return /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i.test(postcode.trim());
}
