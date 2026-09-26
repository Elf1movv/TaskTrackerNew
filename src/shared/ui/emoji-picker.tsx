import { useState } from "react"
import { HabitIcon } from "./habit-icon"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"

// A trigger button showing the current emoji, opening a popover grid to
// pick another — extracted out of HabitForm (its icon picker) so
// HabitGroupForm can use the exact same widget for a block's emoji.
export function EmojiPicker({
  value,
  onChange,
  options,
  label = "Choose icon",
}: {
  value: string
  onChange: (emoji: string) => void
  options: readonly string[]
  label?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="w-14 h-10 shrink-0 rounded-md bg-muted flex items-center justify-center hover:bg-accent transition-colors"
          aria-label={label}
        >
          <HabitIcon emoji={value} size={20} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2">
        <div className="grid grid-cols-8 gap-1">
          {options.map(emoji => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                onChange(emoji)
                setOpen(false)
              }}
              aria-label={`Icon ${emoji}`}
              aria-pressed={value === emoji}
              className={`size-8 flex items-center justify-center rounded-md transition-colors ${
                value === emoji ? "bg-primary-soft text-primary" : "hover:bg-accent"
              }`}
            >
              <HabitIcon emoji={emoji} size={18} />
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
