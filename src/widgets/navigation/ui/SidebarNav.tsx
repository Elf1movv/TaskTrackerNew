import { format } from "date-fns"
import { NavLink } from "react-router"
import { selectTodayTasks, useTasks } from "@/entities/task"
import { useGoals } from "@/entities/goal"
import { useHabits } from "@/entities/habit"
import { getTodayKey } from "@/shared/lib/date"
import { getDateLocale, useLanguage, type TranslationKey } from "@/shared/lib/i18n"
import { displayFont, monoFont } from "@/shared/lib/typography"
import { NAV_ITEMS } from "../model/navItems"

export function SidebarNav() {
  const { tasks } = useTasks()
  const { habits } = useHabits()
  const { goals } = useGoals()
  const { language, t } = useLanguage()

  const today = getTodayKey()
  const todayTasks = selectTodayTasks(tasks)

  const stats: { labelKey: TranslationKey; value: string }[] = [
    {
      labelKey: "sidebar.statTasksDone",
      value: `${todayTasks.filter(t => t.completed).length} / ${todayTasks.length}`,
    },
    {
      labelKey: "sidebar.statHabits",
      value: `${habits.filter(h => h.completedDates.includes(today)).length} / ${habits.length}`,
    },
    { labelKey: "sidebar.statActiveGoals", value: String(goals.length) },
  ]

  return (
    <aside className="hidden md:flex w-56 lg:w-60 shrink-0 flex-col border-r border-border bg-card">
      <div className="px-5 py-5 border-b border-border">
        <div css={monoFont} className="text-[10px] tracking-[0.22em] uppercase text-muted-foreground mb-1.5">
          MyTracker
        </div>
        <div css={displayFont} className="text-lg leading-tight">
          {format(new Date(), "MMMM yyyy", { locale: getDateLocale(language) })}
        </div>
      </div>

      <nav className="flex-1 p-2.5 space-y-0.5">
        {NAV_ITEMS.map(({ path, labelKey, Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`
            }
          >
            <Icon size={15} />
            <span>{t(labelKey)}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-border space-y-2">
        <div css={monoFont} className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-3">
          {t("common.today")}
        </div>
        {stats.map(({ labelKey, value }) => (
          <div key={labelKey} className="flex justify-between items-center py-0.5">
            <span className="text-xs text-muted-foreground">{t(labelKey)}</span>
            <span css={monoFont} className="text-xs">
              {value}
            </span>
          </div>
        ))}
      </div>
    </aside>
  )
}
