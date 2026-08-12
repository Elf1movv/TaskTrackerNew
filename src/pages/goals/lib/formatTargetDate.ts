import { format } from "date-fns"

export function formatTargetDate(targetDate: string): string {
  return format(new Date(`${targetDate}T00:00:00`), "MMM d, yyyy")
}
