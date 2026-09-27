import { Pencil } from "lucide-react"

export function EditGoalButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={e => {
        e.stopPropagation()
        onClick()
      }}
      className="p-2 rounded-[10px] text-tertiary hover:text-foreground hover:bg-fill transition-all"
      aria-label="Edit goal"
    >
      <Pencil size={16} strokeWidth={1.75} />
    </button>
  )
}
