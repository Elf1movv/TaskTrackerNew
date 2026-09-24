import { useMemo } from "react"
import { AnimatePresence, motion } from "motion/react"
import { CalendarGrid } from "@/widgets/calendar-grid"
import { DayDetailPanel } from "@/widgets/day-detail-panel"
import type { Goal } from "@/entities/goal"
import type { Habit } from "@/entities/habit"
import type { Reminder } from "@/entities/reminder"
import type { Task } from "@/entities/task"
import { buildMonthGrid } from "@/shared/lib/calendarGrid"

// The original (and, until this feature, only) calendar view — extracted
// verbatim from CalendarPage.tsx's body when the page grew a view switcher,
// so month behaves exactly as it always did. Builds its own month grid
// from `anchorDate` (see shared/lib/calendarGrid.ts) instead of reading a
// pre-built one from context — every view does this now, the provider no
// longer picks a grid shape on views' behalf.
//
// Lives in pages/calendar, not widgets — it composes two sibling widgets
// (calendar-grid + day-detail-panel), and FSD forbids widget-to-widget
// imports; a component whose whole job is combining several widgets
// belongs at the page layer, which is allowed to depend on widgets freely
// (established precedent in this project — see GoalReminderSwapCard).
// Plain props, not context, since CalendarProvider's context is read by
// CalendarPage.tsx itself and threaded down from there.
export function CalendarMonthView({
  anchorDate,
  selectedDay,
  selectedTasks,
  selectedReminders,
  selectedGoals,
  selectedHabits,
  allTasks,
  allReminders,
  allGoals,
  allHabits,
  onSelectDay,
  onCloseDayPanel,
  onMoveTaskToDay,
  onMoveGoalToDay,
}: {
  anchorDate: Date
  selectedDay: Date | null
  selectedTasks: Task[]
  selectedReminders: Reminder[]
  selectedGoals: Goal[]
  selectedHabits: Habit[]
  allTasks: Task[]
  allReminders: Reminder[]
  allGoals: Goal[]
  allHabits: Habit[]
  onSelectDay: (day: Date, isCurrentMonth: boolean) => void
  onCloseDayPanel: () => void
  onMoveTaskToDay: (taskId: string, day: Date) => void
  onMoveGoalToDay: (goalId: string, day: Date) => void
}) {
  const monthGrid = useMemo(() => buildMonthGrid(anchorDate), [anchorDate])

  return (
    // justify-center + layout on the row below: with no reserved 260px
    // column, the row's width is just its actual content, so centering it
    // re-centers the calendar alone when the panel is closed, and
    // re-centers the calendar+panel pair together (calendar shifting
    // left) once it opens — with a smooth slide via `layout` instead of a
    // jump.
    <div className="flex justify-center">
      <motion.div layout className="flex flex-col lg:flex-row gap-5 items-start w-full lg:w-auto">
        <div className="w-full lg:w-[640px] shrink-0">
          <CalendarGrid
            days={monthGrid}
            tasks={allTasks}
            reminders={allReminders}
            goals={allGoals}
            habits={allHabits}
            selectedDay={selectedDay}
            onSelectDay={onSelectDay}
            onMoveTaskToDay={onMoveTaskToDay}
            onMoveGoalToDay={onMoveGoalToDay}
          />
        </div>
        <AnimatePresence>
          {selectedDay && (
            // No per-day `key` on purpose — switching between two already-
            // open days should just swap content, not replay the
            // enter/exit animation; that's reserved for null <-> a day.
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.2 }}
              className="w-full lg:w-[260px] shrink-0"
            >
              <DayDetailPanel
                day={selectedDay}
                tasks={selectedTasks}
                reminders={selectedReminders}
                goals={selectedGoals}
                habits={selectedHabits}
                onClose={onCloseDayPanel}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
