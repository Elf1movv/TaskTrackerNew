import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { BellRing, Plus } from "lucide-react"
import { ReminderForm } from "@/features/reminder-form"
import { type Reminder } from "@/entities/reminder"
import { useLanguage, type TranslationKey } from "@/shared/lib/i18n"
import { ReminderRow } from "./components/ReminderRow"

// The "reduced" reminders view on the Today page — see GoalReminderSwapCard,
// which swaps this in for GoalProgressSummary. Shows upcoming reminders
// (caller passes an already-filtered/sorted list, see
// selectUpcomingReminders) plus a quick-add form; not paginated or capped
// here — the calendar (this feature's home page) is where the full picture
// lives, this card is deliberately just a glance.
const PRIORITY_FILTERS = ["all", "critical"] as const
type PriorityFilter = (typeof PRIORITY_FILTERS)[number]
const PRIORITY_FILTER_LABEL_KEYS: Record<PriorityFilter, TranslationKey> = {
  all: "reminders.filterAll",
  critical: "reminders.filterCritical",
}

export function ReminderSummary({ reminders }: { reminders: Reminder[] }) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingReminderId, setEditingReminderId] = useState<string | null>(null)
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all")
  const { t } = useLanguage()
  const visibleReminders =
    priorityFilter === "critical" ? reminders.filter(r => r.priority === "critical") : reminders

  return (
    <div className="min-h-[300px] bg-card border border-border rounded-2xl shadow-raised px-5 py-5 pr-9 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <h2 className="flex-1 text-xl font-bold tracking-[-0.015em]">{t("reminderSummary.title")}</h2>
        <button
          type="button"
          onClick={() => {
            setEditingReminderId(null)
            setIsAdding(v => !v)
          }}
          aria-label={t("reminders.addReminder")}
          aria-expanded={isAdding}
          className="size-8 rounded-full bg-primary-soft text-primary flex items-center justify-center transition-colors hover:bg-primary/15"
        >
          <Plus size={16} />
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <ReminderForm onDone={() => setIsAdding(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {reminders.length > 0 && (
        <div className="grid grid-cols-2 gap-0.5 p-0.5 rounded-[9px] bg-fill">
          {PRIORITY_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setPriorityFilter(f)}
              className={`h-[30px] rounded-lg text-[13px] transition-all ${
                priorityFilter === f
                  ? "bg-seg text-foreground font-bold shadow-card"
                  : "text-muted-foreground font-medium"
              }`}
            >
              {t(PRIORITY_FILTER_LABEL_KEYS[f])}
            </button>
          ))}
        </div>
      )}

      {visibleReminders.length > 0 ? (
        <div className="flex flex-col">
          {visibleReminders.map((reminder, i) => (
            <div key={reminder.id} className={i ? "pt-3 mt-3 border-t border-border" : ""}>
              {editingReminderId === reminder.id ? (
                <ReminderForm reminder={reminder} onDone={() => setEditingReminderId(null)} />
              ) : (
                <ReminderRow
                  reminder={reminder}
                  onEdit={() => {
                    setIsAdding(false)
                    setEditingReminderId(reminder.id)
                  }}
                />
              )}
            </div>
          ))}
        </div>
      ) : (
        !isAdding && (
          <div className="flex-1 py-7 px-2 flex flex-col items-center gap-2 text-center">
            <span className="size-11 rounded-[13px] bg-primary-soft text-primary flex items-center justify-center">
              <BellRing size={20} strokeWidth={1.75} />
            </span>
            <span className="text-[15px] font-bold">{t("reminders.noRemindersYet")}</span>
            <span className="text-[13px] text-muted-foreground">{t("reminders.addHint")}</span>
          </div>
        )
      )}
    </div>
  )
}
