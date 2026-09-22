import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Plus } from "lucide-react"
import { GoalForm } from "@/features/goal-form"
import { useGoals, type Goal } from "@/entities/goal"
import { useLanguage } from "@/shared/lib/i18n"
import { Accordion } from "@/shared/ui/accordion"
import { Button } from "@/shared/ui/button"
import { GoalAccordionItem } from "./components"

export interface GoalListItem extends Goal {
  dueLabel: string | null
}

// `initialGoalId` — deep link from the Today page's goal-progress card
// ("tap a goal there, land here with it expanded and moved to the top").
// Read once on mount; the page that owns the URL is responsible for
// clearing the query param, this just consumes the id it's handed.
export function GoalList({ goals, initialGoalId }: { goals: GoalListItem[]; initialGoalId?: string }) {
  const { reorderGoals } = useGoals()
  const [isAdding, setIsAdding] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const { t } = useLanguage()

  // A plain lazy initializer is safe here (unlike the reminders-card race
  // — see LEARNING.md, 2026-09-22): this only has to equal the id of
  // whichever AccordionItem eventually renders with that value, whenever
  // `goals` actually finishes loading — no data needs to already be
  // present at construction time for it to end up correct.
  const [openGoalId, setOpenGoalId] = useState(() => initialGoalId ?? goals[0]?.id ?? "")

  // Moves the deep-linked goal to the top of the list, once, as soon as
  // `goals` actually contains it — separate from `openGoalId` above
  // because this needs real loaded data to act on (reorderGoals sends the
  // whole new order to the server).
  const hasReordered = useRef(false)
  useEffect(() => {
    if (!initialGoalId || hasReordered.current) return
    const goal = goals.find(g => g.id === initialGoalId)
    if (!goal) return
    hasReordered.current = true
    if (goals[0]?.id !== initialGoalId) reorderGoals(initialGoalId, goals[0].id)
  }, [initialGoalId, goals, reorderGoals])

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
        <Accordion
          type="single"
          collapsible
          value={openGoalId}
          onValueChange={setOpenGoalId}
          className="space-y-4"
        >
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
