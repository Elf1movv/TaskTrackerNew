import { Global } from "@emotion/react"
import type { ReactNode } from "react"
import { ThemeProvider } from "next-themes"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { LanguageProvider } from "@/shared/lib/i18n"
import { Toaster } from "@/shared/ui/sonner"
import { TooltipProvider } from "@/shared/ui/tooltip"
import { globalStyles } from "../styles/globalStyles"

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
        <DndProvider backend={HTML5Backend}>
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
