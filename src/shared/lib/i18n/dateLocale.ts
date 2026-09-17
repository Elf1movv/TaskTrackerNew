import { enUS, ru } from "date-fns/locale"
import type { Language } from "./languageContext"

// date-fns formats like "MMMM"/"EEEE" render English month/weekday names
// unless a Locale object is passed explicitly — this is that mapping,
// kept separate from the string dictionaries since it's a date-fns object,
// not one of our own translated strings.
const DATE_LOCALES = { en: enUS, ru }

export function getDateLocale(language: Language) {
  return DATE_LOCALES[language]
}

const WEEKDAY_LABELS: Record<Language, string[]> = {
  en: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
  ru: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
}

export function getWeekdayLabels(language: Language): string[] {
  return WEEKDAY_LABELS[language]
}
