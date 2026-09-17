import { Global } from "@emotion/react"
import type { ReactNode } from "react"
import { ThemeProvider } from "next-themes"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { TaskProvider } from "@/entities/task"
import { GoalProvider } from "@/entities/goal"
import { HabitProvider } from "@/entities/habit"
import { CategoryProvider } from "@/entities/category"
import { LanguageProvider } from "@/shared/lib/i18n"
import { Toaster } from "@/shared/ui/sonner"
import { TooltipProvider } from "@/shared/ui/tooltip"
import { globalStyles } from "../styles/globalStyles"

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    // enableSystem={false} — the theme toggle is a plain binary
    // light/dark switch, not a three-way "match OS" option.
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      {/* Above the entity providers — usePersistedCollection's error toasts
          call useLanguage() to translate, so it needs LanguageProvider as
          an ancestor of TaskProvider/GoalProvider/HabitProvider/CategoryProvider. */}
      <LanguageProvider>
        <DndProvider backend={HTML5Backend}>
          <TaskProvider>
            <GoalProvider>
              <HabitProvider>
                <CategoryProvider>
                  <TooltipProvider>
                    <Global styles={globalStyles} />
                    <Toaster richColors position="top-right" />
                    {children}
                  </TooltipProvider>
                </CategoryProvider>
              </HabitProvider>
            </GoalProvider>
          </TaskProvider>
        </DndProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}
