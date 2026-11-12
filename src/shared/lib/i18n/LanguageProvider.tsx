import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import { en } from "./dictionaries/en"
import { ru } from "./dictionaries/ru"
import { LanguageContext, type Language, type TranslationKey } from "./languageContext"
import { translate } from "./translate"

const DICTIONARIES: Record<Language, Record<string, string>> = { en, ru }
const STORAGE_KEY = "mytracker-language"

// No saved choice yet: follow the browser's language (a Russian browser gets
// Russian). Before 2026-11-12 everyone started in English, and browsers
// auto-translated the page — which broke React (see the effect below).
function browserLanguage(): Language {
  return navigator.language?.toLowerCase().startsWith("ru") ? "ru" : "en"
}

function readStoredLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === "ru" || stored === "en") return stored
  } catch {
    // Storage blocked — fall through to the browser's language.
  }
  return browserLanguage()
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

  // <html lang> = the interface language. It used to be "en" always, so a
  // browser in Russian offered (or auto-ran) translation; the translator
  // swaps text nodes for its own elements and React then crashes on the next
  // update ("insertBefore … not a child", owner report 2026-11-12, typing a
  // password at registration). index.html also has translate="no".
  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
