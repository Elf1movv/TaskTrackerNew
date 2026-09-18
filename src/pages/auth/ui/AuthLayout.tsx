import type { ReactNode } from "react"
import { displayFont, monoFont } from "@/shared/lib/typography"

// Shared shell for every unauthenticated screen (login, register, forgot/
// reset password) — these render outside RootLayout (no sidebar, no
// authenticated data), so they need their own minimal page chrome.
export function AuthLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div
            css={monoFont}
            className="text-[10px] tracking-[0.22em] uppercase text-muted-foreground mb-1.5"
          >
            MyTracker
          </div>
          <h1 css={displayFont} className="text-2xl">
            {title}
          </h1>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">{children}</div>
      </div>
    </div>
  )
}
