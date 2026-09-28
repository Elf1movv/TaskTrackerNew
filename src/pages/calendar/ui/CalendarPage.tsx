import { useEffect, useRef } from "react"
import { format, isSameDay, isSameMonth, isSameWeek, type Locale } from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useSearchParams } from "react-router"
import { buildWeekRange } from "@/shared/lib/calendarGrid"
import { formatDateKey } from "@/shared/lib/date"
import { getDateLocale, useLanguage, type TranslationKey } from "@/shared/lib/i18n"
import { displayFont, monoFont } from "@/shared/lib/typography"
import { Button } from "@/shared/ui/button"
import { useIsMobile } from "@/shared/ui/use-mobile"
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
    // Agenda's own visible window is dynamic now (starts at 6 days, grows
    // via its own "show more" state) — no fixed end date to show here
    // (see CalendarAgendaView.tsx), so this just shows the starting date,
    // same as the "day"/default case below.
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
  const isMobile = useIsMobile()

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
      // Week's 7-day hourly grid doesn't fit a phone screen, and the swipe
      // needed to scroll to the rest of the days conflicts with the
      // existing press-and-drag-down "create a task" gesture on the grid
      // (see HourGrid.tsx) — confirmed with the user, 2026-09-28: on
      // mobile, Week opens Day instead. Read window.innerWidth directly
      // here rather than the isMobile hook above — that hook's own
      // detection runs one render behind on first mount, which would let a
      // direct/bookmarked `?view=week` link slip through unredirected on
      // the very first load.
      const isMobileWidth = window.innerWidth < 768
      setView(viewParam === "week" && isMobileWidth ? "day" : (viewParam as CalendarView))
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
    <div className="p-4 md:p-6">
      {/* mr-24 below md: below that width the sidebar is hidden (see
          SidebarNav's own md:flex) and this row runs the full width of the
          page, reaching the same top-right corner the page-shell's
          fixed notification/settings buttons occupy — without this
          clearance the row's own overflow-x-auto scrolling just moves
          which tab sits UNDER those buttons, never actually revealing
          "Год" from behind them. At md and up the sidebar already keeps
          this row well clear of that corner, so no margin is needed. */}
      <div className="flex gap-0.5 bg-fill rounded-[10px] p-0.5 w-fit mb-5 overflow-x-auto mr-24 md:mr-0">
        {BUILT_VIEWS.map(v => (
          <button
            key={v}
            onClick={() => setView(v === "week" && isMobile ? "day" : v)}
            className={`h-8 px-3 rounded-lg text-xs transition-all shrink-0 ${
              view === v
                ? "bg-seg text-foreground font-bold shadow-card"
                : "text-muted-foreground font-medium hover:text-foreground"
            }`}
          >
            {t(`calendar.view.${v}` as TranslationKey)}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
        <h1
          css={displayFont}
          className="text-[40px] leading-[1.1] font-extrabold tracking-[-0.03em] capitalize"
        >
          {formatPeriodTitle(view, anchorDate, getDateLocale(language))}
        </h1>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPrev}
            className="rounded-[10px] text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={goToToday}
            css={monoFont}
            className="rounded-[10px] h-9 px-4 text-xs font-semibold shadow-card bg-card text-foreground hover:bg-card"
          >
            {isViewingCurrentPeriod(view, anchorDate) ? t("common.today") : t("calendar.backToToday")}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNext}
            className="rounded-[10px] text-muted-foreground hover:text-foreground"
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
