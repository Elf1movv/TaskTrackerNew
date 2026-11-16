import { useEffect, type ReactNode } from "react"
import { ThemeProvider, useTheme } from "next-themes"
import { DndProvider } from "react-dnd"
import { MultiBackend } from "react-dnd-multi-backend"
import { HTML5toTouch } from "rdndmb-html5-to-touch"
import { useSession } from "@/shared/lib/auth"
import { LanguageProvider } from "@/shared/lib/i18n"
import { hideSplash, useThemeColorSync } from "@/shared/lib/pwa"
import { Toaster } from "@/shared/ui/sonner"
import { TooltipProvider } from "@/shared/ui/tooltip"

// HTML5toTouch: mouse keeps using HTML5Backend exactly as before, touch
// input switches to TouchBackend — native HTML5 drag-and-drop (what the
// old plain HTML5Backend-only setup used everywhere) fundamentally
// doesn't fire from touch input at all (see LEARNING.md, 2026-09-28).
// delayTouchStart overrides the touch step's default (undefined = 0ms):
// without it, a normal vertical scroll swipe starting on a draggable row
// (task/habit/goal list) gets misread as the start of a drag instead of a
// page scroll.
const dndOptions = {
  ...HTML5toTouch,
  backends: HTML5toTouch.backends.map(step =>
    // step.options is typed `unknown` upstream — written out explicitly
    // rather than spread, since we already know its one existing key
    // (enableMouseEvents) from rdndmb-html5-to-touch's own source.
    step.id === "touch" ? { ...step, options: { enableMouseEvents: true, delayTouchStart: 200 } } : step,
  ),
}

// Entity providers (Task/Goal/Habit/Category) are NOT mounted here on
// purpose — they live inside RootLayout, below its session check, so they
// only fetch once a session actually exists. This wraps the whole app,
// login screens included, with what those don't need a session for:
// theme, language, drag-and-drop, tooltips, toasts.
// Inside ThemeProvider so it sees the current theme.
function ThemeColorSync() {
  useThemeColorSync(useTheme().resolvedTheme)
  return null
}

// The splash in index.html stays until the login check is answered — until
// then RootLayout draws nothing, and the screen would be blank (2026-11-15).
function HideSplashWhenReady() {
  const { isPending } = useSession()
  useEffect(() => {
    if (!isPending) hideSplash()
  }, [isPending])
  return null
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    // enableSystem={false} — the theme toggle is a plain binary
    // light/dark switch, not a three-way "match OS" option.
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <ThemeColorSync />
      <HideSplashWhenReady />
      <LanguageProvider>
        <DndProvider backend={MultiBackend} options={dndOptions}>
          <TooltipProvider>
            {/* Bottom-right, not top-right: the top-right corner holds the
                fixed settings gear / reminder bell and each page's "Add"
                button, and a toast there covered them. mobileOffset keeps
                toasts above MobileNav on phones. */}
            <Toaster
              richColors
              position="bottom-right"
              mobileOffset={{ bottom: "calc(80px + env(safe-area-inset-bottom))" }}
            />
            {children}
          </TooltipProvider>
        </DndProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}
