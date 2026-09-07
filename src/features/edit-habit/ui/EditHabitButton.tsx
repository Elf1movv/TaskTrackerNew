import { Pencil } from "lucide-react"

export function EditHabitButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={e => {
        e.stopPropagation()
        onClick()
      }}
      className="p-1 rounded text-muted-foreground hover:text-foreground transition-all"
      aria-label="Edit habit"
    >
      <Pencil size={12} />
    </button>
  )
}
