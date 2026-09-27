import type { ReactNode } from "react"
import { displayFont, monoFont } from "@/shared/lib/typography"
import { BrandMark } from "@/shared/ui/brand-mark"

// Shared shell for every unauthenticated screen (login, register, forgot/
// reset password) — these render outside RootLayout (no sidebar, no
// authenticated data), so they need their own minimal page chrome.
// `icon` defaults to the app's own logo (Login/Register just want that) —
// Forgot/Reset pass their own neutral status icon instead (a locked
// padlock / key square), same icon across both of a page's own states
// (form vs. "check your email"/"invalid link"), only the heading differs.
export function AuthLayout({
  title,
  icon,
  children,
}: {
  title: string
  icon?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-4 mb-7">
          {icon ?? <BrandMark size={64} iconSize={34} radius={18} />}
          <div className="text-center flex flex-col gap-1">
            <div
              css={monoFont}
              className="text-xs font-bold tracking-[0.16em] uppercase text-muted-foreground"
            >
              MyTracker
            </div>
            <h1 css={displayFont} className="text-[34px] font-extrabold tracking-[-0.025em]">
              {title}
            </h1>
          </div>
        </div>
        <div className="bg-card border border-card-border rounded-[20px] shadow-raised p-7 space-y-[18px]">
          {children}
        </div>
      </div>
    </div>
  )
}
