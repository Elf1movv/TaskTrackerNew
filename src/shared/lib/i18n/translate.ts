import type { Language } from "./languageContext"

// Fills {name} placeholders. A template with "|" holds plural forms
// (ru: one|few|many, en: one|other), picked by the numeric `count` var via
// Intl.PluralRules — "2 привычки", "5 привычек" instead of "2 привычек".
const FORM_ORDER: Record<Language, Intl.LDMLPluralRule[]> = {
  ru: ["one", "few", "many"],
  en: ["one", "other"],
}

export function translate(
  template: string,
  language: Language,
  vars?: Record<string, string | number>,
): string {
  let text = template
  if (text.includes("|") && typeof vars?.count === "number") {
    const forms = text.split("|")
    const rule = new Intl.PluralRules(language).select(vars.count)
    const index = FORM_ORDER[language].indexOf(rule)
    text = forms[index >= 0 ? index : forms.length - 1] ?? forms[forms.length - 1]
  }
  if (!vars) return text
  return Object.entries(vars).reduce(
    (result, [name, value]) => result.split(`{${name}}`).join(String(value)),
    text,
  )
}
