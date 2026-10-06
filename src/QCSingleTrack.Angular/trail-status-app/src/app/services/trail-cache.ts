import { TrailDto } from '../models/trail-dto.model';

/**
 * The last trail list this browser loaded. Shown instantly on the next visit while the API, which sleeps
 * when idle and can take 30+ seconds to wake, catches up. Storage can be unavailable (private mode, blocked
 * site data), so every access is best-effort.
 */
const KEY = 'qcbt.trails.v1';

interface CachedTrails {
  savedAt: string;
  trails: TrailDto[];
}

export function readCachedTrails(): { savedAt: Date; trails: TrailDto[] } | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as CachedTrails;
    const savedAt = new Date(cached.savedAt);
    if (!Array.isArray(cached.trails) || cached.trails.length === 0 || isNaN(savedAt.getTime())) return null;
    return { savedAt, trails: cached.trails };
  } catch {
    return null;
  }
}

export function cacheTrails(trails: TrailDto[]): void {
  try {
    const value: CachedTrails = { savedAt: new Date().toISOString(), trails };
    localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    // Not being able to cache only costs the next visit its instant first paint.
  }
}
