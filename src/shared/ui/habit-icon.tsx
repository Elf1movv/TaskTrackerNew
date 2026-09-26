import type { SVGProps } from "react"
import { getHabitIconMeta } from "../lib/habitIconPaths"

// Renders the line icon for a habit/block emoji (see ../lib/habitIconPaths.ts).

type HabitIconProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  emoji: string
  size?: number
  /** Accessible name; omit when the icon sits next to visible text. */
  label?: string
}

export function HabitIcon({ emoji, size = 20, label, strokeWidth = 1.75, ...rest }: HabitIconProps) {
  const meta = getHabitIconMeta(emoji)
  // Unknown value (a custom emoji from older data): fall back to the emoji itself.
  if (!meta) {
    return (
      <span
        role={label ? "img" : undefined}
        aria-label={label}
        aria-hidden={label ? undefined : true}
        style={{ fontSize: size * 0.9, lineHeight: 1 }}
      >
        {emoji}
      </span>
    )
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      {...rest}
    >
      <path d={meta.d} />
    </svg>
  )
}
