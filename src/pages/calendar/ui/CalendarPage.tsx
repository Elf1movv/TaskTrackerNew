import { format } from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { CalendarGrid } from "@/widgets/calendar-grid"
import { DayDetailPanel } from "@/widgets/day-detail-panel"
import { displayFont, monoFont } from "@/shared/lib/typography"
import { Button } from "@/shared/ui/button"
import { CalendarProvider, useCalendarContext } from "../connectors/CalendarContext"

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
  } = useCalendarContext()

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 css={displayFont} className="text-3xl">
          {format(calMonth, "MMMM yyyy")}
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
            Today
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
        />
        <DayDetailPanel day={selectedDay} tasks={selectedTasks} />
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
