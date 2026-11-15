import { useEffect } from "react"
import { useRouteError } from "react-router"

// Our own page when something crashes while drawing a page (React Router's
// `errorElement`), instead of the library's English "Unexpected Application
// Error" with a stack trace (owner, 2026-11-12 — seen after the browser
// translator crash). On purpose it needs nothing from the app's providers —
// one of them may be what broke: the language comes from <html lang> (kept
// in step by LanguageProvider), the theme from the class already on <html>.
const TEXT = {
  ru: {
    title: "Что-то пошло не так",
    body: "Страница не смогла открыться. Обычно помогает обновить её — ваши данные сохранены на сервере.",
    reload: "Обновить",
    home: "На «Сегодня»",
  },
  en: {
    title: "Something went wrong",
    body: "This page couldn't open. Reloading usually helps — your data is safe on the server.",
    reload: "Reload",
    home: "Go to Today",
  },
} as const

export function RouteErrorPage() {
  const error = useRouteError()
  const text = document.documentElement.lang === "en" ? TEXT.en : TEXT.ru

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-dvh flex items-center justify-center bg-background text-foreground p-6">
      <div className="max-w-sm w-full rounded-[24px] border border-card-border bg-card p-6 shadow-raised text-center">
        <h1 className="text-xl font-bold mb-2">{text.title}</h1>
        <p className="text-sm text-muted-foreground mb-6">{text.body}</p>
        <div className="flex flex-col gap-2">
          {/* Plain elements, not the app's Button: the page must render even
              if a shared component is what failed. */}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="h-10 rounded-md bg-primary text-primary-foreground text-sm font-semibold"
          >
            {text.reload}
          </button>
          {/* A full page load (not router navigation) — starts the app afresh. */}
          <a
            href="/today"
            className="h-10 leading-10 rounded-md text-sm text-muted-foreground hover:text-foreground"
          >
            {text.home}
          </a>
        </div>
      </div>
    </div>
  )
}
