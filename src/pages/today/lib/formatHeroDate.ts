import { format } from "date-fns"
import { getDateLocale, type Language } from "@/shared/lib/i18n"

export interface HeroDate {
  weekday: string
  day: string
  monthYear: string
}

export function formatHeroDate(date: Date, language: Language): HeroDate {
  const locale = getDateLocale(language)
  return {
    weekday: format(date, "EEEE", { locale }),
    day: format(date, "d"),
    monthYear: format(date, "MMMM yyyy", { locale }),
  }
}
