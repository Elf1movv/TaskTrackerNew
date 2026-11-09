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
// ("tap a goal there, land here with it expanded and scrolled into view").
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
  const { isLoaded } = useGoals()
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const { t } = useLanguage()

  // A plain lazy initializer is safe here (unlike the reminders-card race
  // — see LEARNING.md, 2026-09-22): this only has to equal the id of
  // whichever AccordionItem eventually renders with that value, whenever
  // `goals` actually finishes loading — no data needs to already be
  // present at construction time for it to end up correct.
  const [openGoalId, setOpenGoalId] = useState(() => initialGoalId ?? goals[0]?.id ?? "")

  // …except the default "first goal open" does need data: on a plain reload
  // of /goals the list is still loading at mount, so the initializer above
  // gets "" and every goal stayed collapsed. Open the first goal once, when
  // loading finishes — keyed on isLoaded, not on goals appearing, so
  // creating the very first goal on an empty page doesn't auto-open it.
  // Adjusted during render (React's "storing information from previous
  // renders" pattern), not in an effect — no extra render pass.
  const [hasDefaultOpen, setHasDefaultOpen] = useState(isLoaded || Boolean(initialGoalId))
  if (!hasDefaultOpen && isLoaded) {
    setHasDefaultOpen(true)
    if (goals.length > 0 && !openGoalId) setOpenGoalId(goals[0].id)
  }

  // Scrolls to the deep-linked goal once it has rendered. The order is left
  // alone (audit П5, decision 6, 2026-11-09): this used to move the goal to
  // the top and save that, so just looking at a goal from Today reshuffled
  // the shared goal order.
  const hasScrolled = useRef(false)
  useEffect(() => {
    if (!initialGoalId || hasScrolled.current) return
    if (!goals.some(g => g.id === initialGoalId)) return
    hasScrolled.current = true
    document.querySelector(`[data-goal-id="${initialGoalId}"]`)?.scrollIntoView({ block: "center" })
  }, [initialGoalId, goals])

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
            <span className="size-[52px] rounded-lg bg-primary-soft text-primary flex items-center justify-center">
              <Target size={24} strokeWidth={1.75} />
            </span>
            <span className="text-title font-bold">{t("goals.noGoalsYet")}</span>
          </div>
        )
      )}
    </div>
  )
}
