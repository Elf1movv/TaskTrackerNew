import { format } from "date-fns"

export interface HeroDate {
  weekday: string
  day: string
  monthYear: string
}

export function formatHeroDate(date: Date): HeroDate {
  return {
    weekday: format(date, "EEEE"),
    day: format(date, "d"),
    monthYear: format(date, "MMMM yyyy"),
  }
}
