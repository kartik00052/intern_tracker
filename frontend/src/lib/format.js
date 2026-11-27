const withLeadingZero = (value) => String(value).padStart(2, '0');

const asDate = (value) => {
  if (!value) return null;
  const date = new Date(value.length === 10 ? `${value}T00:00:00Z` : value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatNumber = (value) => new Intl.NumberFormat('en-IN').format(value ?? 0);

export function relativeTime(value) {
  const date = asDate(value);
  if (!date) return null;
  const diff = date.getTime() - Date.now();
  const minutes = Math.round(Math.abs(diff) / 60000);
  const suffix = diff >= 0 ? '' : ' ago';
  const prefix = diff >= 0 ? 'in ' : '';
  if (minutes < 1) return diff >= 0 ? 'now' : 'just now';
  if (minutes < 60) return `${prefix}${minutes} min${suffix}`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${prefix}${hours} h${suffix}`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${prefix}${days} d${suffix}`;
  const months = Math.round(days / 30);
  return `${prefix}${months} mo${suffix}`;
}

export function formatTimestamp(value) {
  const date = asDate(value);
  if (!date) return null;
  const day = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date);
  const time = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' }).format(date);
  return `${day}, ${time} UTC`;
}

export function formatDate(value) {
  const date = asDate(value);
  if (!date) return null;
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date);
}

function compactMoney(value, currency) {
  if (currency === 'INR') {
    if (value >= 100000) {
      const lakhs = value / 100000;
      return `₹${Number.isInteger(lakhs) ? lakhs : lakhs.toFixed(1)} L`;
    }
    return `₹${new Intl.NumberFormat('en-IN').format(value)}`;
  }
  return `$${new Intl.NumberFormat('en-US').format(value)}`;
}

export function formatStipend(min, max, currency) {
  if (min == null && max == null) return null;
  const code = currency || (min != null && min >= 1000 ? 'INR' : 'USD');
  if (min != null && max != null) return `${compactMoney(min, code)}–${compactMoney(max, code)}`;
  if (min != null) return `${compactMoney(min, code)}+`;
  return `up to ${compactMoney(max, code)}`;
}

export function formatDuration(months) {
  if (months == null) return null;
  return `${months} ${months === 1 ? 'month' : 'months'}`;
}

export function deadlineInfo(value) {
  const date = asDate(value);
  if (!date) return null;
  const today = new Date();
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const days = Math.round((Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - todayUtc) / 86400000);
  if (days < 0) return { label: `${Math.abs(days)} d past`, urgency: 'past', absolute: formatDate(value) };
  if (days === 0) return { label: 'today', urgency: 'urgent', absolute: formatDate(value) };
  if (days <= 3) return { label: `in ${days} d`, urgency: 'urgent', absolute: formatDate(value) };
  if (days <= 7) return { label: `in ${days} d`, urgency: 'soon', absolute: formatDate(value) };
  return { label: `in ${days} d`, urgency: 'calm', absolute: formatDate(value) };
}

export function formatHttpStatus(status) {
  return status === 0 ? '000' : String(status);
}

export function formatClock(seconds) {
  if (seconds == null) return null;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${withLeadingZero(mins)}:${withLeadingZero(secs)}`;
}

export function escapeCsv(value) {
  if (value == null) return '';
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(rows) {
  return rows.map((row) => row.map(escapeCsv).join(',')).join('\r\n');
}
