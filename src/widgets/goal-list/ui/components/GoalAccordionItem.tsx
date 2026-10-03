import { useState } from "react"
import { useTasks } from "@/entities/task"
import { TaskForm } from "@/features/task-form"
import { TaskToggleCheckbox } from "@/features/toggle-task"
import { TaskPlanning } from "@/features/plan-form"
import { Button } from "@/shared/ui/button"
import { ConfirmAction } from "@/shared/ui/confirm-action"
import { CalendarDays } from "lucide-react"
import styled from "@emotion/styled"
import { DeleteGoalButton } from "@/features/delete-goal"
import { EditGoalButton } from "@/features/edit-goal"
import { ProgressRing, useGoals } from "@/entities/goal"
import { useDragReorder } from "@/shared/lib/dnd"
import { useLanguage } from "@/shared/lib/i18n"
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/shared/ui/accordion"
import type { GoalListItem } from "../GoalList"

const StyledAccordionItem = styled(AccordionItem)<{ color: string }>`
  border-radius: 0.75rem;
  overflow: hidden;
  background-color: var(--card);
  border: 1px solid var(--card-border);
  box-shadow: var(--shadow-card);

  &[data-state="open"] {
    border-color: color-mix(in srgb, ${p => p.color} 45%, transparent);
    box-shadow: var(--shadow-raised);
  }
`

export function GoalAccordionItem({ goal, onEdit }: { goal: GoalListItem; onEdit: () => void }) {
  const { reorderGoals, updateGoal } = useGoals()
  const { t } = useLanguage()
  const { ref, isDragging } = useDragReorder<HTMLDivElement>({
    type: "goal",
    id: goal.id,
    onHoverMove: reorderGoals,
  })
  const { tasks } = useTasks()
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const linked = tasks.filter(task => task.goalId === goal.id && !task.legacyPending)
  const completedCount = linked.filter(task => task.completed).length

  return (
    // `AccordionItem` (shared/ui, vendored shadcn output) is a plain function
    // component without forwardRef, so the drag ref is attached to this
    // plain wrapper div instead of the accordion item itself.
    <div
      ref={ref}
      className="cursor-grab active:cursor-grabbing select-none"
      style={{ opacity: isDragging ? 0.4 : 1 }}
    >
      <StyledAccordionItem value={goal.id} color={goal.color} className="!border-b-0">
        <div className="flex items-center gap-1 pl-6 pr-5 py-5">
          {/* flex-1 on this wrapper, not directly on AccordionTrigger —
              Radix wraps every trigger in its own <h3 class="flex">
              (shared/ui/accordion.tsx), a plain flex item with no grow of
              its own; putting flex-1 only on the Trigger inside it (as
              before) had nothing to stretch AGAINST, so it hugged its own
              content width and left edit/delete stranded mid-row instead
              of at the card's edge (direct feedback, 2026-09-28). This
              wrapper is the thing that actually sits in the outer flex
              row, so it's the one that needs flex-1 — its sole child
              (the <h3>, block-level by default) then fills it the normal
              way, no extra classes needed on the trigger itself. */}
          <div className="flex-1 min-w-0">
            <AccordionTrigger className="hover:no-underline [&>svg]:mt-1 !py-0">
              <div className="flex items-start gap-[18px] flex-1">
                <ProgressRing progress={goal.progress} color={goal.color} />
                <div className="flex-1 min-w-0 text-left">
                  <h3 className="text-lg font-bold tracking-[-0.01em] leading-snug pr-2">{goal.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{goal.description}</p>
                  <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-2">
                    <span className="flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground whitespace-nowrap">
                      <span className="size-2 rounded-full shrink-0" style={{ background: goal.color }} />
                      {t("goals.taskProgress", {
                        done: completedCount,
                        total: linked.length,
                      })}
                    </span>
                    <span className="flex items-center gap-1.5 text-[13px] font-semibold text-tertiary whitespace-nowrap">
                      <CalendarDays size={14} strokeWidth={1.75} />
                      {goal.dueLabel ? t("goals.due", { date: goal.dueLabel }) : t("goalForm.noTargetDate")}
                    </span>
                  </div>
                </div>
              </div>
            </AccordionTrigger>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <EditGoalButton onClick={onEdit} />
            <DeleteGoalButton goalId={goal.id} goalTitle={goal.title} />
          </div>
        </div>
        <AccordionContent className="px-5 pb-5">
          <div className="bg-sunken rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-muted-foreground">{t("tasks.title")}</h4>
            {linked.map(task =>
              editingId === task.id ? (
                <TaskForm key={task.id} task={task} embedded onDone={() => setEditingId(null)} />
              ) : (
                <div key={task.id} className="rounded-lg bg-card p-3">
                  <div className="flex gap-2 items-start">
                    <TaskToggleCheckbox taskId={task.id} completed={task.completed} />
                    <button
                      className={`flex-1 text-left text-sm [overflow-wrap:anywhere] ${task.completed ? "line-through text-muted-foreground" : ""}`}
                      onClick={() => setEditingId(task.id)}
                    >
                      {task.title}
                    </button>
                  </div>
                  <TaskPlanning task={task} />
                </div>
              ),
            )}
            {!linked.length && <p className="text-sm text-muted-foreground">{t("goals.noLinkedTasks")}</p>}
            {adding ? (
              <TaskForm defaultGoalId={goal.id} embedded onDone={() => setAdding(false)} />
            ) : (
              <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
                {t("tasks.addTask")}
              </Button>
            )}
            <div className="pt-3 border-t border-border">
              {goal.achievedAt ? (
                <Button size="sm" variant="outline" onClick={() => updateGoal(goal.id, { achievedAt: null })}>
                  {t("goals.reactivate")}
                </Button>
              ) : (
                <ConfirmAction
                  confirmLabel={t("goals.achieve")}
                  title={t("goals.achieve")}
                  description={t("goals.achieveBody")}
                  onConfirm={() => updateGoal(goal.id, { achievedAt: new Date().toISOString() })}
                >
                  <Button size="sm">{t("goals.achieve")}</Button>
                </ConfirmAction>
              )}
            </div>
          </div>
        </AccordionContent>
      </StyledAccordionItem>
    </div>
  )
}
