import { useCallback, useState } from "react"
import { ChevronDown, GripVertical, Trash2 } from "lucide-react"
import { GoalProgressBar, subgoalFraction, useGoals, type Subgoal } from "@/entities/goal"
import { useDragReorder } from "@/shared/lib/dnd"
import { useLanguage } from "@/shared/lib/i18n"
import { ConfirmAction } from "@/shared/ui/confirm-action"
import { Input } from "@/shared/ui/input"
import { AddMilestoneForm } from "./AddMilestoneForm"
import { MilestoneRow } from "./MilestoneRow"

// One subgoal inside an open goal (two-level tree, iteration 3.1): its own
// progress bar, a collapsible list of its own steps, inline rename and a
// confirmed delete. Reordered by the grip handle among the goal's own steps
// and other subgoals (shared top-level drag type), within its goal only.
export function SubgoalItem({ goalId, subgoal, color }: { goalId: string; subgoal: Subgoal; color: string }) {
  const { renameSubgoal, deleteSubgoal, reorderGoalItems } = useGoals()
  const { t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [draftTitle, setDraftTitle] = useState(subgoal.title)
  const percent = Math.round(subgoalFraction(subgoal) * 100)
  const done = subgoal.milestones.filter(m => m.completed).length

  const onHoverMove = useCallback(
    (draggedId: string, targetId: string) => reorderGoalItems(goalId, draggedId, targetId),
    [reorderGoalItems, goalId],
  )
  const { dropRef, handleRef, isDragging } = useDragReorder<HTMLDivElement>({
    type: `goal-item-${goalId}`,
    id: subgoal.id,
    onHoverMove,
  })

  function commitEdit() {
    const title = draftTitle.trim()
    if (title) renameSubgoal(goalId, subgoal.id, title)
    else setDraftTitle(subgoal.title)
    setIsEditing(false)
  }

  return (
    <div
      ref={dropRef}
      data-subgoal-id={subgoal.id}
      className="rounded-[10px] bg-card shadow-card"
      style={{ opacity: isDragging ? 0.4 : 1 }}
    >
      <div className="flex items-center gap-2 min-h-12 pl-1.5 pr-2 group">
        <button
          ref={handleRef}
          type="button"
          className="shrink-0 p-1 text-tertiary cursor-grab active:cursor-grabbing touch-none"
          aria-label={t("goals.reorderSubgoal")}
        >
          <GripVertical size={14} />
        </button>
        <button
          type="button"
          onClick={() => setIsOpen(v => !v)}
          aria-expanded={isOpen}
          aria-label={t(isOpen ? "goals.collapseSubgoal" : "goals.expandSubgoal")}
          className="shrink-0 p-1 text-tertiary"
        >
          <ChevronDown size={15} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>
        <div className="flex-1 min-w-0 flex flex-col gap-1 py-2">
          {isEditing ? (
            <Input
              autoFocus
              value={draftTitle}
              onChange={e => setDraftTitle(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={e => {
                if (e.key === "Enter") commitEdit()
                if (e.key === "Escape") {
                  setDraftTitle(subgoal.title)
                  setIsEditing(false)
                }
              }}
              className="text-sm h-7 bg-muted border-0"
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="text-sm font-semibold text-left leading-snug truncate"
            >
              {subgoal.title}
            </button>
          )}
          <GoalProgressBar percent={percent} color={color} />
        </div>
        <span className="text-xs font-semibold text-tertiary shrink-0">
          {done}/{subgoal.milestones.length} · {percent}%
        </span>
        <ConfirmAction
          title={t("goals.deleteSubgoalTitle")}
          description={t("goals.deleteSubgoalBody", { title: subgoal.title })}
          confirmLabel={t("common.delete")}
          onConfirm={() => deleteSubgoal(goalId, subgoal.id)}
        >
          <button
            type="button"
            className="shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 rounded-lg text-muted-foreground hover:text-destructive transition-all"
            aria-label={t("goals.deleteSubgoalTitle")}
          >
            <Trash2 size={13} />
          </button>
        </ConfirmAction>
      </div>
      {isOpen && (
        <div className="px-3 pb-3 flex flex-col gap-1">
          {subgoal.milestones.map((milestone, index) => (
            <MilestoneRow
              key={milestone.id}
              goalId={goalId}
              subgoalId={subgoal.id}
              milestone={milestone}
              color={color}
              index={index}
            />
          ))}
          {subgoal.milestones.length === 0 && (
            <p className="text-sm text-tertiary px-1">{t("goals.noMilestonesYet")}</p>
          )}
          <AddMilestoneForm goalId={goalId} subgoalId={subgoal.id} />
        </div>
      )}
    </div>
  )
}
