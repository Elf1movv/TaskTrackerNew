import { format } from "date-fns"
import { AnimatePresence, motion } from "motion/react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { CalendarGrid } from "@/widgets/calendar-grid"
import { DayDetailPanel } from "@/widgets/day-detail-panel"
import { getDateLocale, useLanguage } from "@/shared/lib/i18n"
import { displayFont, monoFont } from "@/shared/lib/typography"
import { Button } from "@/shared/ui/button"
import { CalendarProvider, useCalendarContext } from "../connectors"

function CalendarPageContent() {
  const {
    calMonth,
    monthGrid,
    selectedDay,
    selectedTasks,
    allTasks,
    selectDay,
    goToPrevMonth,
    goToNextMonth,
    goToToday,
    moveTaskToDay,
  } = useCalendarContext()
  const { language, t } = useLanguage()

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 css={displayFont} className="text-3xl">
          {format(calMonth, "MMMM yyyy", { locale: getDateLocale(language) })}
        </h1>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPrevMonth}
            className="rounded-xl text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={goToToday}
            css={monoFont}
            className="rounded-xl text-xs text-muted-foreground hover:text-foreground"
          >
            {t("common.today")}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNextMonth}
            className="rounded-xl text-muted-foreground hover:text-foreground"
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5">
        <CalendarGrid
          days={monthGrid.days}
          startPad={monthGrid.startPad}
          tasks={allTasks}
          selectedDay={selectedDay}
          onSelectDay={selectDay}
          onMoveTaskToDay={moveTaskToDay}
        />
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
            >
              <DayDetailPanel day={selectedDay} tasks={selectedTasks} onClose={() => selectDay(null)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export function CalendarPage() {
  return (
    <CalendarProvider>
      <CalendarPageContent />
    </CalendarProvider>
  )
}
