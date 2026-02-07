/**
 * Returns the display range string for pagination (e.g. "1-10" or "0-0" when empty).
 */
export function paginatedRange(pageIndex: number, pageSize: number, total: number): string {
  if (total === 0) return '0-0';
  const start = pageIndex * pageSize + 1;
  const end = Math.min((pageIndex + 1) * pageSize, total);
  return `${start}-${end}`;
}
