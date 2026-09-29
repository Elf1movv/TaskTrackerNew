import { Global } from "@emotion/react"
import type { ReactNode } from "react"
import { ThemeProvider } from "next-themes"
import { DndProvider } from "react-dnd"
import { MultiBackend } from "react-dnd-multi-backend"
import { HTML5toTouch } from "rdndmb-html5-to-touch"
import { LanguageProvider } from "@/shared/lib/i18n"
import { Toaster } from "@/shared/ui/sonner"
import { TooltipProvider } from "@/shared/ui/tooltip"
import { globalStyles } from "../styles/globalStyles"

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
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    // enableSystem={false} — the theme toggle is a plain binary
    // light/dark switch, not a three-way "match OS" option.
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <LanguageProvider>
        <DndProvider backend={MultiBackend} options={dndOptions}>
          <TooltipProvider>
            <Global styles={globalStyles} />
            <Toaster richColors position="top-right" />
            {children}
          </TooltipProvider>
        </DndProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}
