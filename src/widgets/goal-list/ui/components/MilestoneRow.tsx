import { useCallback, useState } from "react"
import { Check, Trash2 } from "lucide-react"
import styled from "@emotion/styled"
import { useGoals, type Milestone } from "@/entities/goal"
import { useDragReorder } from "@/shared/lib/dnd"
import { numericFont } from "@/shared/lib/typography"
import { Input } from "@/shared/ui/input"

const Circle = styled.div<{ completed: boolean; color: string }>`
  border-radius: 9999px;
  border-width: 2px;
  border-style: solid;
  transition: all 0.15s;
  border-color: ${p => (p.completed ? p.color : "var(--border)")};
  background-color: ${p => (p.completed ? p.color : "transparent")};
`

// One step — either the goal's own (no `subgoalId`) or a subgoal's. The
// goal's own steps share one drag type with its subgoals, so they reorder
// among each other (top-level order, entities/goal/lib/goalItems.ts); a
// subgoal's steps reorder only inside that subgoal. A step can't move into
// a different goal or subgoal.
export function MilestoneRow({
  goalId,
  subgoalId,
  milestone,
  color,
  index,
}: {
  goalId: string
  subgoalId?: string
  milestone: Milestone
  color: string
  index: number
}) {
  const { toggleMilestone, updateMilestone, deleteMilestone, reorderMilestones, reorderGoalItems } =
    useGoals()
  const [isEditing, setIsEditing] = useState(false)
  const [draftTitle, setDraftTitle] = useState(milestone.title)

  const onHoverMove = useCallback(
    (draggedId: string, targetId: string) =>
      subgoalId
        ? reorderMilestones(goalId, draggedId, targetId, subgoalId)
        : reorderGoalItems(goalId, draggedId, targetId),
    [reorderMilestones, reorderGoalItems, goalId, subgoalId],
  )
  const { ref, isDragging } = useDragReorder<HTMLDivElement>({
    type: subgoalId ? `milestone-${goalId}-${subgoalId}` : `goal-item-${goalId}`,
    id: milestone.id,
    onHoverMove,
  })

  function commitEdit() {
    const title = draftTitle.trim()
    if (title) updateMilestone(goalId, milestone.id, title, subgoalId)
    else setDraftTitle(milestone.title)
    setIsEditing(false)
  }

  return (
    <div
      ref={ref}
      className="w-full flex items-center gap-3 min-h-11 pl-3 pr-2 rounded-md bg-card shadow-card group cursor-grab active:cursor-grabbing select-none"
      style={{ opacity: isDragging ? 0.4 : 1 }}
    >
      <button
        onClick={() => toggleMilestone(goalId, milestone.id, subgoalId)}
        className="shrink-0"
        aria-label={milestone.completed ? "Mark milestone as not done" : "Mark milestone as done"}
        aria-pressed={milestone.completed}
      >
        <Circle
          completed={milestone.completed}
          color={color}
          className="w-[22px] h-6 flex items-center justify-center"
        >
          {milestone.completed && <Check size={12} strokeWidth={3} className="text-white" />}
        </Circle>
      </button>

      {isEditing ? (
        <Input
          autoFocus
          value={draftTitle}
          onChange={e => setDraftTitle(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={e => {
            if (e.key === "Enter") commitEdit()
            if (e.key === "Escape") {
              setDraftTitle(milestone.title)
              setIsEditing(false)
            }
          }}
          className="text-sm h-7 flex-1 bg-muted border-0"
        />
      ) : (
        <button
          onClick={() => setIsEditing(true)}
          className={`text-sm font-medium flex-1 leading-snug text-left ${
            milestone.completed ? "line-through text-tertiary" : ""
          }`}
        >
          {milestone.title}
        </button>
      )}

      <span css={numericFont} className="text-xs font-semibold text-tertiary">
        #{index + 1}
      </span>

      <button
        onClick={() => deleteMilestone(goalId, milestone.id, subgoalId)}
        className="shrink-0 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted-foreground hover:text-destructive transition"
        aria-label="Delete milestone"
      >
        <Trash2 size={13} />
      </button>
    </div>
  )
}
