import { format } from "date-fns"
import { getDateLocale, type Language } from "@/shared/lib/i18n"

export function formatTargetDate(targetDate: string, language: Language): string {
  return format(new Date(`${targetDate}T00:00:00`), "MMM d, yyyy", { locale: getDateLocale(language) })
}
