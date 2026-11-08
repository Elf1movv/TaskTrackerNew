import { format } from "date-fns"
import { capitalizeFirst, formatDay, getDateLocale, type Language } from "@/shared/lib/i18n"

// "Воскресенье, 8 ноября" — the Today page title. Was a 104px day number
// with an uppercase weekday above it (unslop pass 2026-11-08).
export function formatHeroDate(date: Date, language: Language): string {
  const weekday = format(date, "EEEE", { locale: getDateLocale(language) })
  return `${capitalizeFirst(weekday)}, ${formatDay(date, language, date)}`
}
