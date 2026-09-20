import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Plus } from "lucide-react"
import { GoalForm } from "@/features/goal-form"
import { type Goal } from "@/entities/goal"
import { useLanguage } from "@/shared/lib/i18n"
import { Accordion } from "@/shared/ui/accordion"
import { Button } from "@/shared/ui/button"
import { GoalAccordionItem } from "./components"

export interface GoalListItem extends Goal {
  dueLabel: string | null
}

export function GoalList({ goals }: { goals: GoalListItem[] }) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const { t } = useLanguage()

  return (
    <div>
      <div className="flex justify-end mb-5">
        <Button
          size="sm"
          onClick={() => {
            setEditingGoal(null)
            setIsAdding(v => !v)
          }}
        >
          <Plus size={14} />
          {t("goals.addGoal")}
        </Button>
      </div>

      <AnimatePresence>
        {(isAdding || editingGoal) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden mb-5"
          >
            <GoalForm
              goal={editingGoal ?? undefined}
              onDone={() => {
                setIsAdding(false)
                setEditingGoal(null)
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {goals.length > 0 ? (
        <Accordion type="single" collapsible defaultValue={goals[0]?.id} className="space-y-4">
          {goals.map(goal => (
            <GoalAccordionItem key={goal.id} goal={goal} onEdit={() => setEditingGoal(goal)} />
          ))}
        </Accordion>
      ) : (
        !isAdding && (
          <div className="text-center py-16 text-muted-foreground text-sm">{t("goals.noGoalsYet")}</div>
        )
      )}
    </div>
  )
}
