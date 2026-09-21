import { addDays, format } from "date-fns"

export const DATE_KEY_FORMAT = "yyyy-MM-dd"

export function formatDateKey(date: Date): string {
  return format(date, DATE_KEY_FORMAT)
}

export function getTodayKey(): string {
  return formatDateKey(new Date())
}

// Overdue, due today, or due tomorrow — "yyyy-MM-dd" keys compare
// correctly as plain strings, so this is just a bounds check against
// tomorrow's key.
export function isDueSoonOrOverdue(dateKey: string | null): boolean {
  if (!dateKey) return false
  return dateKey <= formatDateKey(addDays(new Date(), 1))
}
