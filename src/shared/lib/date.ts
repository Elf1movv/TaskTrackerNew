import { format } from "date-fns"

export const DATE_KEY_FORMAT = "yyyy-MM-dd"

export function formatDateKey(date: Date): string {
  return format(date, DATE_KEY_FORMAT)
}

export function getTodayKey(): string {
  return formatDateKey(new Date())
}
