import { useEffect, useRef } from "react"
import { format, isSameDay, isSameMonth, isSameWeek, type Locale } from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useSearchParams } from "react-router"
import { buildAgendaRange, buildWeekRange } from "@/shared/lib/calendarGrid"
import { formatDateKey } from "@/shared/lib/date"
import { getDateLocale, useLanguage, type TranslationKey } from "@/shared/lib/i18n"
import { displayFont, monoFont } from "@/shared/lib/typography"
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

function formatPeriodTitle(view: CalendarView, anchorDate: Date, locale: Locale): string {
  switch (view) {
    case "month":
      return format(anchorDate, "MMMM yyyy", { locale })
    case "year":
      return format(anchorDate, "yyyy", { locale })
    case "day":
      return format(anchorDate, "EEEE, d MMMM yyyy", { locale })
    case "agenda": {
      const range = buildAgendaRange(anchorDate)
      const last = range[range.length - 1]
      return `${format(anchorDate, "d MMM", { locale })} – ${format(last, "d MMM yyyy", { locale })}`
    }
    case "week": {
      const range = buildWeekRange(anchorDate)
      const last = range[range.length - 1]
      return `${format(range[0], "d MMM", { locale })} – ${format(last, "d MMM yyyy", { locale })}`
    }
    default:
      return format(anchorDate, "d MMMM yyyy", { locale })
  }
}

function CalendarPageContent() {
  const {
    view,
    setView,
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
    selectDay,
    goToPrev,
    goToNext,
    goToToday,
    goToDate,
    moveTaskToDay,
    moveGoalDeadline,
    rescheduleTaskTime,
    resizeTask,
  } = useCalendarContext()
  const { language, t } = useLanguage()
  const [searchParams, setSearchParams] = useSearchParams()
  const hasConsumedInitialParams = useRef(false)

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
    if (viewParam && (BUILT_VIEWS as string[]).includes(viewParam)) setView(viewParam as CalendarView)

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
    <div className="p-4 md:p-6">
      <div className="flex gap-0.5 bg-muted rounded-lg p-0.5 w-fit mb-5">
        {BUILT_VIEWS.map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-3 py-1 rounded-md text-xs transition-all ${
              view === v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t(`calendar.view.${v}` as TranslationKey)}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-8">
        <h1 css={displayFont} className="text-3xl capitalize">
          {formatPeriodTitle(view, anchorDate, getDateLocale(language))}
        </h1>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPrev}
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
            {isViewingCurrentPeriod(view, anchorDate) ? t("common.today") : t("calendar.backToToday")}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNext}
            className="rounded-xl text-muted-foreground hover:text-foreground"
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      {view === "month" && (
        <CalendarMonthView
          anchorDate={anchorDate}
          selectedDay={selectedDay}
          selectedTasks={selectedTasks}
          selectedReminders={selectedReminders}
          selectedGoals={selectedGoals}
          selectedHabits={selectedHabits}
          allTasks={allTasks}
          allReminders={allReminders}
          onSelectDay={handleSelectDay}
          onCloseDayPanel={() => selectDay(null)}
          onMoveTaskToDay={moveTaskToDay}
          onMoveGoalToDay={moveGoalDeadline}
        />
      )}

      {view === "agenda" && (
        <CalendarAgendaView
          anchorDate={anchorDate}
          allTasks={allTasks}
          allReminders={allReminders}
          allGoals={allGoals}
          allHabits={allHabits}
        />
      )}

      {view === "day" && (
        <CalendarDayView
          anchorDate={anchorDate}
          allTasks={allTasks}
          allReminders={allReminders}
          onRescheduleTaskTime={rescheduleTaskTime}
          onResizeTask={resizeTask}
        />
      )}

      {view === "week" && (
        <CalendarWeekView
          anchorDate={anchorDate}
          allTasks={allTasks}
          allReminders={allReminders}
          onRescheduleTaskTime={rescheduleTaskTime}
          onResizeTask={resizeTask}
        />
      )}

      {view === "year" && (
        <CalendarYear
          year={anchorDate}
          tasks={allTasks}
          reminders={allReminders}
          goals={allGoals}
          habits={allHabits}
          onSelectDay={day => {
            goToDate(day)
            setView("day")
          }}
        />
      )}
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
