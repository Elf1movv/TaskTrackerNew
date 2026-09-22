import { useEffect } from "react"
import { format, isSameMonth, parseISO } from "date-fns"
import { AnimatePresence, motion } from "motion/react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useSearchParams } from "react-router"
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
    selectedReminders,
    allTasks,
    allReminders,
    selectDay,
    goToPrevMonth,
    goToNextMonth,
    goToToday,
    goToMonth,
    moveTaskToDay,
  } = useCalendarContext()
  const { language, t } = useLanguage()
  const isViewingCurrentMonth = isSameMonth(calMonth, new Date())
  const [searchParams, setSearchParams] = useSearchParams()

  // One-shot deep link from the reminders summary card on Today ("open
  // this reminder's day on the calendar") — consumed once on mount, then
  // stripped from the URL so it doesn't re-fire on a later re-render.
  useEffect(() => {
    const dateParam = searchParams.get("date")
    if (!dateParam) return
    const day = parseISO(dateParam)
    goToMonth(day)
    selectDay(day)
    // Clears the param, which re-runs this effect once more — that second
    // run finds no `date` param and no-ops, so this only ever acts once.
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev)
        next.delete("date")
        return next
      },
      { replace: true },
    )
  }, [searchParams, goToMonth, selectDay, setSearchParams])

  function handleSelectDay(day: Date, isCurrentMonth: boolean) {
    if (!isCurrentMonth) goToMonth(day)
    selectDay(day)
  }

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
            {isViewingCurrentMonth ? t("common.today") : t("calendar.backToToday")}
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

      {/* justify-center + layout on the row below: with no reserved
          260px column, the row's width is just its actual content, so
          centering it re-centers the calendar alone when the panel is
          closed, and re-centers the calendar+panel pair together (calendar
          shifting left) once it opens — with a smooth slide via `layout`
          instead of a jump. */}
      <div className="flex justify-center">
        <motion.div layout className="flex flex-col lg:flex-row gap-5 items-start w-full lg:w-auto">
          <div className="w-full lg:w-[640px] shrink-0">
            <CalendarGrid
              days={monthGrid}
              tasks={allTasks}
              reminders={allReminders}
              selectedDay={selectedDay}
              onSelectDay={handleSelectDay}
              onMoveTaskToDay={moveTaskToDay}
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
                  onClose={() => selectDay(null)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
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
