import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Plus } from "lucide-react"
import { ReminderForm } from "@/features/reminder-form"
import { type Reminder } from "@/entities/reminder"
import { useLanguage } from "@/shared/lib/i18n"
import { monoFont } from "@/shared/lib/typography"
import { Button } from "@/shared/ui/button"
import { ReminderRow } from "./components/ReminderRow"

// The "reduced" reminders view on the Today page — see GoalReminderSwapCard,
// which swaps this in for GoalProgressSummary. Shows upcoming reminders
// (caller passes an already-filtered/sorted list, see
// selectUpcomingReminders) plus a quick-add form; not paginated or capped
// here — the calendar (this feature's home page) is where the full picture
// lives, this card is deliberately just a glance.
export function ReminderSummary({ reminders }: { reminders: Reminder[] }) {
  const [isAdding, setIsAdding] = useState(false)
  const { t } = useLanguage()

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div css={monoFont} className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground">
          {t("reminderSummary.title")}
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="rounded-lg h-6 w-6 text-muted-foreground hover:text-foreground -mr-1.5"
          onClick={() => setIsAdding(v => !v)}
          aria-label={t("reminders.addReminder")}
        >
          <Plus size={14} />
        </Button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden mb-5"
          >
            <ReminderForm onDone={() => setIsAdding(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {reminders.length > 0 ? (
        <div className="space-y-4">
          {reminders.map(reminder => (
            <ReminderRow key={reminder.id} reminder={reminder} />
          ))}
        </div>
      ) : (
        !isAdding && (
          <p className="text-sm text-muted-foreground py-4 text-center">{t("reminders.noRemindersYet")}</p>
        )
      )}
    </div>
  )
}
