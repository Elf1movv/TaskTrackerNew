import { useState } from "react"
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
          className="w-14 h-10 shrink-0 rounded-md bg-muted text-lg hover:bg-accent transition-colors"
          aria-label={label}
        >
          {value}
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
              className={`size-7 flex items-center justify-center rounded text-lg hover:bg-accent transition-colors ${
                value === emoji ? "bg-accent" : ""
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
