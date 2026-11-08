import { format, isSameMonth, isSameYear } from "date-fns"
import { getDateLocale } from "./dateLocale"
import type { Language } from "./languageContext"

// One human date format for the whole app (unslop pass 2026-11-08): before
// it, tasks showed "2026-11-08", goals "мая 27, 2027" and the habit week
// "2 Нояб. - 8 Нояб.". Day + month in words; the year only when it isn't
// the current one.

// "yyyy-MM-dd" keys are read as local midnight, not UTC (new Date("2026-11-08")
// would be the previous evening west of Greenwich).
function toDate(value: Date | string): Date {
  return typeof value === "string" ? new Date(`${value}T00:00:00`) : value
}

export function formatDay(value: Date | string, language: Language, today = new Date()): string {
  const date = toDate(value)
  const locale = getDateLocale(language)
  const sameYear = isSameYear(date, today)
  if (language === "ru") return format(date, sameYear ? "d MMMM" : "d MMMM yyyy", { locale })
  return format(date, sameYear ? "MMMM d" : "MMMM d, yyyy", { locale })
}

// "2–8 ноября" / "November 2–8"; across months "30 октября – 5 ноября".
export function formatDayRange(
  startValue: Date | string,
  endValue: Date | string,
  language: Language,
  today = new Date(),
): string {
  const start = toDate(startValue)
  const end = toDate(endValue)
  const locale = getDateLocale(language)
  if (isSameMonth(start, end)) {
    const year = isSameYear(end, today) ? "" : ` ${format(end, "yyyy")}`
    return language === "ru"
      ? `${format(start, "d")}–${format(end, "d MMMM", { locale })}${year}`
      : `${format(start, "MMMM d", { locale })}–${format(end, "d")}${year ? "," + year : ""}`
  }
  return `${formatDay(start, language, today)} – ${formatDay(end, language, today)}`
}

// Upper-cases only the first letter — CSS `capitalize` upper-cases every
// word, which turned "8 ноября" into "8 Ноября".
export function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}
