import { Global } from "@emotion/react"
import type { ReactNode } from "react"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { TaskProvider } from "@/entities/task"
import { GoalProvider } from "@/entities/goal"
import { HabitProvider } from "@/entities/habit"
import { Toaster } from "@/shared/ui/sonner"
import { TooltipProvider } from "@/shared/ui/tooltip"
import { globalStyles } from "../styles/globalStyles"

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <DndProvider backend={HTML5Backend}>
      <TaskProvider>
        <GoalProvider>
          <HabitProvider>
            <TooltipProvider>
              <Global styles={globalStyles} />
              <Toaster richColors position="top-right" />
              {children}
            </TooltipProvider>
          </HabitProvider>
        </GoalProvider>
      </TaskProvider>
    </DndProvider>
  )
}
