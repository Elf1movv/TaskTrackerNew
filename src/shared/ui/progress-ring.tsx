import { monoFont } from "@/shared/lib/typography"

const VIEWBOX = 52
const RADIUS = 20
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

// Percent-complete ring with the number in the middle. Sized entirely by
// its parent (renders at 100%/100% via SVG's viewBox scaling) — wrap it in
// a container with an explicit size (e.g. `w-[52px] h-[52px]`, or let a
// CSS Grid cell size it) rather than passing a size prop here.
export function ProgressRing({
  progress,
  color,
  strokeWidth = 3,
  showLabel = true,
}: {
  progress: number
  color: string
  strokeWidth?: number
  showLabel?: boolean
}) {
  return (
    <div className="relative w-full h-full">
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
        style={{ transform: "rotate(-90deg)" }}
      >
        <circle
          cx={VIEWBOX / 2}
          cy={VIEWBOX / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={strokeWidth}
          stroke="var(--muted)"
        />
        <circle
          cx={VIEWBOX / 2}
          cy={VIEWBOX / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={strokeWidth}
          stroke={color}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - progress / 100)}
          strokeLinecap="round"
        />
      </svg>
      {showLabel && (
        <span
          css={monoFont}
          className="absolute inset-0 flex items-center justify-center text-[10px]"
          style={{ color }}
        >
          {progress}%
        </span>
      )}
    </div>
  )
}
