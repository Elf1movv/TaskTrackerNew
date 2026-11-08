import { useCallback, useMemo, useState, type ReactNode } from "react"
import { en } from "./dictionaries/en"
import { ru } from "./dictionaries/ru"
import { LanguageContext, type Language, type TranslationKey } from "./languageContext"
import { translate } from "./translate"

const DICTIONARIES: Record<Language, Record<string, string>> = { en, ru }
const STORAGE_KEY = "mytracker-language"

function readStoredLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === "ru" ? "ru" : "en"
  } catch {
    return "en"
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(readStoredLanguage)

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // localStorage can throw in private/blocked-storage contexts — the
      // language still switches for this session, just won't persist.
    }
  }, [])

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) =>
      translate(DICTIONARIES[language][key] ?? key, language, vars),
    [language],
  )

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
