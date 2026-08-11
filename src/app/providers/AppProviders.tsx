import { Global } from "@emotion/react"
import type { ReactNode } from "react"
import { TaskProvider } from "@/entities/task"
import { GoalProvider } from "@/entities/goal"
import { HabitProvider } from "@/entities/habit"
import { TooltipProvider } from "@/shared/ui/tooltip"
import { globalStyles } from "../styles/globalStyles"

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <TaskProvider>
      <GoalProvider>
        <HabitProvider>
          <TooltipProvider>
            <Global styles={globalStyles} />
            {children}
          </TooltipProvider>
        </HabitProvider>
      </GoalProvider>
    </TaskProvider>
  )
}
