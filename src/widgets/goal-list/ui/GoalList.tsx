import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Target } from "lucide-react"
import { GoalForm } from "@/features/goal-form"
import { useGoals, type Goal } from "@/entities/goal"
import { useLanguage } from "@/shared/lib/i18n"
import { Accordion } from "@/shared/ui/accordion"
import { GoalAccordionItem } from "./components"

export interface GoalListItem extends Goal {
  dueLabel: string | null
}

// `initialGoalId` — deep link from the Today page's goal-progress card
// ("tap a goal there, land here with it expanded and moved to the top").
// Read once on mount; the page that owns the URL is responsible for
// clearing the query param, this just consumes the id it's handed.
// `isAdding`/`onCloseAdding` — the "Add goal" toggle itself lives in
// GoalsPage's header (next to the title, matching Tasks/Today), this just
// renders the form when it's open and tells the header to close it again
// once a goal's actually added, or when the user starts editing an
// existing one instead (mutually exclusive with adding a new one).
export function GoalList({
  goals,
  initialGoalId,
  isAdding,
  onCloseAdding,
}: {
  goals: GoalListItem[]
  initialGoalId?: string
  isAdding: boolean
  onCloseAdding: () => void
}) {
  const { reorderGoals } = useGoals()
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
                onCloseAdding()
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
          className="space-y-3.5"
        >
          {goals.map(goal => (
            <GoalAccordionItem
              key={goal.id}
              goal={goal}
              onEdit={() => {
                onCloseAdding()
                setEditingGoal(goal)
              }}
            />
          ))}
        </Accordion>
      ) : (
        !isAdding && (
          <div className="bg-card border border-dashed border-border-strong rounded-xl px-6 py-14 flex flex-col items-center gap-3 text-center">
            <span className="size-[52px] rounded-[14px] bg-primary-soft text-primary flex items-center justify-center">
              <Target size={24} strokeWidth={1.75} />
            </span>
            <span className="text-[17px] font-bold">{t("goals.noGoalsYet")}</span>
          </div>
        )
      )}
    </div>
  )
}
