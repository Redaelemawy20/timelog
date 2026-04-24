/** Local calendar date as `YYYY-MM-DD` (no timezone shift). */

export function parseDateOnly(value: string): Date | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parts = trimmed.split("-").map((p) => Number(p));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return undefined;
  const [y, m, d] = parts;
  if (y === undefined || m === undefined || d === undefined) return undefined;
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
    return undefined;
  }
  return date;
}

export function formatDateOnly(date: Date): string {
  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${mo}-${d}`;
}

export function formatDateOnlyDisplay(
  value: string,
  locale: string | undefined = undefined,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
): string {
  const date = parseDateOnly(value);
  if (!date) return "";
  return date.toLocaleDateString(locale, options);
}

function startOfLocalDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** For calendar `disabled` matchers: true if `a` is strictly before `b` (local day). */
export function isLocalDayBefore(a: Date, b: Date): boolean {
  return startOfLocalDay(a) < startOfLocalDay(b);
}

export function isLocalDayAfter(a: Date, b: Date): boolean {
  return startOfLocalDay(a) > startOfLocalDay(b);
}
