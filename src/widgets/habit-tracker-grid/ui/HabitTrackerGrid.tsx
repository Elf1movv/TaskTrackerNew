import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Plus } from "lucide-react"
import { HabitForm } from "@/features/habit-form"
import { type Habit } from "@/entities/habit"
import { useLanguage } from "@/shared/lib/i18n"
import { monoFont } from "@/shared/lib/typography"
import { Button } from "@/shared/ui/button"
import { HabitGridItem } from "./components"

export function HabitTrackerGrid({ habits }: { habits: Habit[] }) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const { t } = useLanguage()

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div css={monoFont} className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground">
          {t("habits.sectionLabel")}
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs"
          onClick={() => {
            setEditingHabit(null)
            setIsAdding(v => !v)
          }}
        >
          <Plus size={13} />
          {t("habits.addHabit")}
        </Button>
      </div>

      <AnimatePresence>
        {(isAdding || editingHabit) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden mb-4"
          >
            <HabitForm
              habit={editingHabit ?? undefined}
              onDone={() => {
                setIsAdding(false)
                setEditingHabit(null)
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {habits.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {habits.map(habit => (
            <HabitGridItem key={habit.id} habit={habit} onEdit={() => setEditingHabit(habit)} />
          ))}
        </div>
      ) : (
        !isAdding && (
          <div className="text-center py-8 text-muted-foreground text-sm">{t("habits.noHabitsYet")}</div>
        )
      )}
    </div>
  )
}
