import { useTasks } from "@/entities/task"
import { PlanShelf } from "@/widgets/calendar-timeline"
import { useEffect, useRef, useState } from "react"
import { format, isSameDay, isSameMonth, isSameWeek } from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { useSearchParams } from "react-router"
import { buildWeekRange } from "@/shared/lib/calendarGrid"
import { formatDateKey } from "@/shared/lib/date"
import {
  capitalizeFirst,
  formatDay,
  formatDayRange,
  getDateLocale,
  useLanguage,
  type Language,
  type TranslationKey,
} from "@/shared/lib/i18n"
import { Button } from "@/shared/ui/button"
import { CalendarYear } from "@/widgets/calendar-year"
import { CalendarProvider, useCalendarContext, type CalendarView } from "../connectors"
import { CalendarAgendaView } from "./CalendarAgendaView"
import { CalendarDayView } from "./CalendarDayView"
import { CalendarMonthView } from "./CalendarMonthView"
import { CalendarWeekView } from "./CalendarWeekView"

// All five views from the plan are now built. Kept in this exact
// declaration order (matches TickTick's own tab order) for both the
// switcher UI and validating an incoming `?view=` URL param.
const BUILT_VIEWS: CalendarView[] = ["agenda", "day", "week", "month", "year"]

// Whether the "Today" button should read as "Today" (already there) or
// "Back to today" (browsed away) — Agenda is always "current" (its window
// starts at anchorDate, "today" just resets that window rather than
// landing inside a fixed range). Extend the switch per-view
// (isSameDay/isSameWeek/isSameYear) as each one gets built.
function isViewingCurrentPeriod(view: CalendarView, anchorDate: Date): boolean {
  if (view === "month") return isSameMonth(anchorDate, new Date())
  if (view === "day") return isSameDay(anchorDate, new Date())
  if (view === "week") return isSameWeek(anchorDate, new Date(), { weekStartsOn: 1 })
  if (view === "year") return anchorDate.getFullYear() === new Date().getFullYear()
  return true
}

function formatPeriodTitle(view: CalendarView, anchorDate: Date, language: Language): string {
  const locale = getDateLocale(language)
  switch (view) {
    case "month":
      return capitalizeFirst(format(anchorDate, "LLLL yyyy", { locale }))
    case "year":
      return format(anchorDate, "yyyy", { locale })
    case "day":
      return `${capitalizeFirst(format(anchorDate, "EEEE", { locale }))}, ${formatDay(anchorDate, language)}`
    // Agenda's own visible window is dynamic now (starts at 6 days, grows
    // via its own "show more" state) — no fixed end date to show here
    // (see CalendarAgendaView.tsx), so this just shows the starting date,
    // same as the "day"/default case below.
    case "week": {
      const range = buildWeekRange(anchorDate)
      return formatDayRange(range[0], range[range.length - 1], language)
    }
    default:
      return formatDay(anchorDate, language)
  }
}

function CalendarPageContent() {
  const { tasks: canonicalTasks } = useTasks()
  const {
    view,
    setView,
    anchorDate,
    selectedDay,
    selectedPlans,
    selectedReminders,
    selectedGoals,
    selectedHabits,
    allPlans,
    allDeadlines,
    selectedDeadlines,
    allReminders,
    allGoals,
    allHabits,
    selectDay,
    goToPrev,
    goToNext,
    goToToday,
    goToDate,
    movePlanToDay,
    reschedulePlanTime,
    resizePlan,
  } = useCalendarContext()
  const { language, t } = useLanguage()
  const [searchParams, setSearchParams] = useSearchParams()
  const hasConsumedInitialParams = useRef(false)
  const reduceMotion = useReducedMotion()
  // Where the Day view grows from after a tap on a day in Week (percent of
  // the page width); null — an ordinary switch, a soft fade.
  const [zoomFromX, setZoomFromX] = useState<number | null>(null)

  // One-time reconciliation of the URL the page was opened with — either an
  // external deep link (Today's reminder card sends `?date=`, no `?view=`,
  // implying month) or a previously-shared/bookmarked calendar URL
  // (`?view=week&date=...`). Deliberately empty deps: this must run only
  // once, against whatever the URL was at mount, not on every subsequent
  // param change (the effect below writes those, and re-running this one
  // in response would fight it).
  useEffect(() => {
    if (hasConsumedInitialParams.current) return
    hasConsumedInitialParams.current = true

    const viewParam = searchParams.get("view")
    if (viewParam && (BUILT_VIEWS as string[]).includes(viewParam)) {
      // Until 2026-11-15 a phone opened Day instead of Week (the 7-column
      // grid didn't fit). Week now has a compact phone layout
      // (CalendarWeekView), so every view opens as asked.
      setView(viewParam as CalendarView)
    }

    const dateParam = searchParams.get("date")
    if (dateParam) {
      const day = new Date(dateParam)
      goToDate(day)
      selectDay(day)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Continuously reflects the current view+anchor into the URL (not
  // selectedDay — that's the month view's own day-panel concern, not part
  // of "where in the calendar am I browsing"). `replace`, not push: prev/
  // next clicking would otherwise spam browser history into uselessness.
  useEffect(() => {
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev)
        next.set("view", view)
        next.set("date", formatDateKey(anchorDate))
        return next
      },
      { replace: true },
    )
  }, [view, anchorDate, setSearchParams])

  function handleSelectDay(day: Date, isCurrentMonth: boolean) {
    if (!isCurrentMonth) goToDate(day)
    selectDay(day)
  }

  return (
    <div className="px-4 pt-3 pb-4 md:px-6 md:pt-0 md:pb-6">
      {/* Phones: the switcher takes its own full-width row; from md it
          shrinks back to its own width. (The bell and gear moved into the top
          bar on 2026-11-18, so this row no longer has to dodge them.) */}
      <div className="flex gap-0.5 bg-fill rounded-md p-0.5 mb-5 w-full md:w-fit">
        {BUILT_VIEWS.map(v => (
          <button
            key={v}
            onClick={() => {
              setZoomFromX(null)
              setView(v)
            }}
            className={`h-8 flex-1 md:flex-none px-1 md:px-3 rounded-lg text-xs transition truncate ${
              view === v
                ? "bg-seg text-foreground font-bold shadow-card"
                : "text-muted-foreground font-medium hover:text-foreground"
            }`}
          >
            {t(`calendar.view.${v}` as TranslationKey)}
          </button>
        ))}
      </div>

      {/* Everything under the view switcher changes with the view, so it all
          animates together: a soft fade between views, and a day opened from
          Week grows out of the tapped day's column (owner, 2026-11-15:
          "открывается через анимацию"). "Reduce motion": fade only. */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={view}
          style={zoomFromX !== null ? { transformOrigin: `${zoomFromX}% 35%` } : undefined}
          initial={
            reduceMotion
              ? { opacity: 0 }
              : zoomFromX !== null && view === "day"
                ? { opacity: 0, scale: 0.3 }
                : { opacity: 0, scale: 0.97 }
          }
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.1 } }}
          transition={
            zoomFromX !== null && view === "day"
              ? { duration: 0.45, ease: [0.22, 1, 0.36, 1] }
              : { duration: 0.18 }
          }
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
            <h1 className="text-page-sm sm:text-page">{formatPeriodTitle(view, anchorDate, language)}</h1>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={goToPrev}
                className="rounded-md text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft size={16} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={goToToday}
                className="tabular-nums rounded-md h-9 px-4 text-xs font-semibold shadow-card bg-card text-foreground hover:bg-card"
              >
                {isViewingCurrentPeriod(view, anchorDate) ? t("common.today") : t("calendar.backToToday")}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={goToNext}
                className="rounded-md text-muted-foreground hover:text-foreground"
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>

          <PlanShelf
            anchorDate={formatDateKey(anchorDate)}
            days={
              view === "day"
                ? [formatDateKey(anchorDate)]
                : view === "week"
                  ? buildWeekRange(anchorDate).map(formatDateKey)
                  : []
            }
            onReschedule={reschedulePlanTime}
          />

          {view === "month" && (
            <CalendarMonthView
              anchorDate={anchorDate}
              selectedDay={selectedDay}
              selectedPlans={selectedPlans}
              selectedReminders={selectedReminders}
              selectedGoals={selectedGoals}
              selectedHabits={selectedHabits}
              allPlans={allPlans}
              allDeadlines={allDeadlines}
              selectedDeadlines={selectedDeadlines}
              allReminders={allReminders}
              allGoals={allGoals}
              onSelectDay={handleSelectDay}
              onCloseDayPanel={() => selectDay(null)}
              onMovePlanToDay={movePlanToDay}
            />
          )}

          {view === "agenda" && (
            <CalendarAgendaView
              anchorDate={anchorDate}
              allPlans={allPlans}
              allDeadlines={allDeadlines}
              allReminders={allReminders}
              allGoals={allGoals}
            />
          )}

          {view === "day" && (
            <CalendarDayView
              anchorDate={anchorDate}
              allPlans={allPlans}
              allReminders={allReminders}
              allDeadlines={allDeadlines}
              allGoals={allGoals}
              onRescheduleTaskTime={reschedulePlanTime}
              onResizePlan={resizePlan}
            />
          )}

          {view === "week" && (
            <CalendarWeekView
              anchorDate={anchorDate}
              allPlans={allPlans}
              allReminders={allReminders}
              allDeadlines={allDeadlines}
              allGoals={allGoals}
              onRescheduleTaskTime={reschedulePlanTime}
              onResizePlan={resizePlan}
              onOpenDay={(day, from) => {
                const pageWidth = document.documentElement.clientWidth || 1
                setZoomFromX(Math.round(((from.left + from.width / 2) / pageWidth) * 100))
                goToDate(day)
                setView("day")
              }}
            />
          )}

          {view === "year" && (
            <CalendarYear
              year={anchorDate}
              tasks={canonicalTasks}
              plans={allPlans}
              goals={allGoals}
              habits={allHabits}
              onSelectDay={day => {
                goToDate(day)
                setView("day")
              }}
            />
          )}
        </motion.div>
      </AnimatePresence>
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
