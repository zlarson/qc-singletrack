import { TrailDto, TrailStatus } from './trail-dto.model';

/** Past this, a "since" date is old news (e.g. Sylvan Island, which almost never closes). */
const STALE_SINCE_DAYS = 60;

const STATUS_ORDER: Record<TrailStatus, number> = {
  Open: 0,
  Caution: 1,
  'Freeze/Thaw': 2,
  Closed: 3
};

const STATUS_DOT: Record<TrailStatus, string> = {
  Open: 'bg-status-open',
  Caution: 'bg-status-caution',
  'Freeze/Thaw': 'bg-status-freeze',
  Closed: 'bg-status-closed'
};

const STATUS_TEXT: Record<TrailStatus, string> = {
  Open: 'text-status-open border-status-open',
  Caution: 'text-status-caution border-status-caution',
  'Freeze/Thaw': 'text-status-freeze border-status-freeze',
  Closed: 'text-status-closed border-status-closed'
};

/** Trails FORC doesn't monitor come back with no status; they're always open. */
export function statusOf(trail: TrailDto): TrailStatus {
  return trail.currentStatus ?? 'Open';
}

export function isMonitored(trail: TrailDto): boolean {
  return !!trail.currentStatus;
}

export function statusDotClass(trail: TrailDto): string {
  return STATUS_DOT[statusOf(trail)];
}

export function statusTextClass(trail: TrailDto): string {
  return STATUS_TEXT[statusOf(trail)];
}

export function byStatusThenName(a: TrailDto, b: TrailDto): number {
  return STATUS_ORDER[statusOf(a)] - STATUS_ORDER[statusOf(b)] || a.trailName.localeCompare(b.trailName);
}

/** When the status last changed, or null if unknown or too old to be worth showing. */
export function statusSince(trail: TrailDto, now = new Date()): Date | null {
  if (!isMonitored(trail) || !trail.lastScrapedTime) return null;
  // The API returns UTC without a zone suffix.
  const iso = /Z|[+-]\d\d:\d\d$/.test(trail.lastScrapedTime) ? trail.lastScrapedTime : trail.lastScrapedTime + 'Z';
  const since = new Date(iso);
  if (isNaN(since.getTime())) return null;
  const ageDays = (now.getTime() - since.getTime()) / 86_400_000;
  return ageDays > STALE_SINCE_DAYS ? null : since;
}

/** The short second line under a trail name, e.g. "closed · since Oct 2" or "closed · muddy trails". */
export function statusDetail(trail: TrailDto): string {
  const label = statusOf(trail).toLowerCase();
  if (!isMonitored(trail)) return `${label} · not monitored`;
  if (trail.currentReason) return `${label} · ${trail.currentReason.toLowerCase()}`;
  const since = statusSince(trail);
  if (since) return `${label} · since ${since.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  return label;
}
