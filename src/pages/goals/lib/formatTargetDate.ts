import { format } from "date-fns"
import { getDateLocale, type Language } from "@/shared/lib/i18n"

// null in, null out — a goal with no deadline has no "due" label to show at
// all (see GoalAccordionItem, which renders a plain "no deadline" string
// instead of "Due: {label}" when this is null).
export function formatTargetDate(targetDate: string | null, language: Language): string | null {
  if (!targetDate) return null
  return format(new Date(`${targetDate}T00:00:00`), "MMM d, yyyy", { locale: getDateLocale(language) })
}
