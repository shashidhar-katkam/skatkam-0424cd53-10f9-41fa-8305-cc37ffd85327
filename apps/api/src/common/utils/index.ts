import { PAGINATION } from '../constants';

/** Compute skip/take for pagination */
export function getPaginationParams(
  page: number = PAGINATION.DEFAULT_PAGE,
  limit: number = PAGINATION.DEFAULT_LIMIT
): { skip: number; take: number } {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(PAGINATION.MAX_LIMIT, Math.max(1, limit));
  return {
    skip: (safePage - 1) * safeLimit,
    take: safeLimit,
  };
}

/** Normalize string to slug (lowercase, spaces to underscores) */
export function toSlug(str: string): string {
  return str.toLowerCase().replace(/\s+/g, '_');
}

/** Format date to ISO date string (YYYY-MM-DD) */
export function toDateString(date: Date | null | undefined): string | null {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

/** Sort order direction */
export type SortOrder = 'ASC' | 'DESC';

/** Normalize sort order string */
export function normalizeSortOrder(value: string | undefined): SortOrder {
  if (!value) return 'ASC';
  return value.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
}
