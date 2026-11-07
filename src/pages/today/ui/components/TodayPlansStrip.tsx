import { CalendarClock } from "lucide-react"
import { Link } from "react-router"
import { usePlans } from "@/entities/calendar-plan"
import { PlanToggleCheckbox } from "@/features/toggle-plan"
import { formatDateKey } from "@/shared/lib/date"
import { useLanguage } from "@/shared/lib/i18n"
import { monoFont } from "@/shared/lib/typography"
import { selectTodayPlans } from "../../lib/selectTodayPlans"

// "Today's plan" (iteration 3): a compact, read-only look at today's
// calendar schedule, so the day plan is in front of you without opening the
// calendar. Only completion is editable here; everything else (moving,
// resizing, On hold) stays in the calendar the row links to.
const MAX_VISIBLE = 5

export function TodayPlansStrip() {
  const { plans, isLoaded } = usePlans()
  const { t } = useLanguage()
  const todayKey = formatDateKey(new Date())
  const todayPlans = selectTodayPlans(plans, todayKey)
  const calendarLink = `/calendar?view=day&date=${todayKey}`
  if (!isLoaded) return null
  return (
    <section
      aria-label={t("today.plansTitle")}
      className="bg-card border border-card-border rounded-xl shadow-card px-5 py-4 mb-5"
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <h2 className="font-bold text-base flex gap-2 items-center">
          <CalendarClock size={17} className="text-primary" />
          {t("today.plansTitle")}
        </h2>
        <Link to={calendarLink} className="text-sm font-semibold text-primary hover:underline shrink-0">
          {t("today.openCalendar")}
        </Link>
      </div>
      {todayPlans.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("today.noPlans")}</p>
      ) : (
        <ul className="divide-y divide-border">
          {todayPlans.slice(0, MAX_VISIBLE).map(plan => (
            <li key={plan.id} data-today-plan={plan.id} className="flex items-center gap-3 py-2">
              <PlanToggleCheckbox taskId={plan.id} completed={plan.completed} size={20} />
              <span css={monoFont} className="text-xs font-bold text-muted-foreground w-[92px] shrink-0">
                {plan.time ? `${plan.time}${plan.endTime ? `–${plan.endTime}` : ""}` : t("plans.untimed")}
              </span>
              <Link
                to={calendarLink}
                className={`text-sm font-semibold truncate hover:underline ${
                  plan.completed ? "line-through text-tertiary" : ""
                }`}
              >
                {plan.title}
              </Link>
            </li>
          ))}
          {todayPlans.length > MAX_VISIBLE && (
            <li className="pt-2 text-xs text-muted-foreground">
              <Link to={calendarLink} className="hover:underline">
                +{todayPlans.length - MAX_VISIBLE}
              </Link>
            </li>
          )}
        </ul>
      )}
    </section>
  )
}
