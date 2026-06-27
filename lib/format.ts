/** Relative time: "2 hours ago", "just now", "3 days ago" */
export function formatRelativeTime(date: string | Date): string {
  const d       = typeof date === 'string' ? new Date(date) : date;
  const diffMs  = Date.now() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr  = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr  / 24);
  const diffWk  = Math.floor(diffDay / 7);
  const diffMo  = Math.floor(diffDay / 30);

  if (diffSec < 10)  return 'just now';
  if (diffSec < 60)  return `${diffSec}s ago`;
  if (diffMin < 60)  return `${diffMin}m ago`;
  if (diffHr  < 24)  return `${diffHr}h ago`;
  if (diffDay < 7)   return `${diffDay}d ago`;
  if (diffWk  < 5)   return `${diffWk}w ago`;
  if (diffMo  < 12)  return `${diffMo}mo ago`;
  return `${Math.floor(diffDay / 365)}y ago`;
}

/** Absolute date: "Jun 25, 2026" */
export function formatDate(date: string | Date, opts?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', opts ?? { year: 'numeric', month: 'short', day: 'numeric' });
}

/** Time: "14:32" */
export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

/** File size: "1.4 MB", "512 B" */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k     = 1024;
  const sizes = ['B','KB','MB','GB','TB'];
  const i     = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/** Large number: 1500 → "1.5K", 1200000 → "1.2M" */
export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

/** Truncate text with ellipsis */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1) + '…';
}

/** Capitalize first letter of each word */
export function titleCase(str: string): string {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Convert to slug: "My Doc Title" → "my-doc-title" */
export function toSlug(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** Pluralize: "1 document", "3 documents" */
export function pluralize(count: number, singular: string, plural?: string): string {
  return `${count.toLocaleString()} ${count === 1 ? singular : (plural ?? singular + 's')}`;
}

/** Percentage: 0.856 → "85.6%" */
export function formatPct(ratio: number, decimals = 1): string {
  return `${(ratio * 100).toFixed(decimals)}%`;
}

/** Duration in ms to human: 1800 → "1.8s", 90000 → "1m 30s" */
export function formatDuration(ms: number): string {
  if (ms < 1000)  return `${ms}ms`;
  const secs = Math.floor(ms / 1000);
  if (secs < 60)  return `${(ms / 1000).toFixed(1)}s`;
  const mins = Math.floor(secs / 60);
  const rem  = secs % 60;
  return `${mins}m ${rem}s`;
}
