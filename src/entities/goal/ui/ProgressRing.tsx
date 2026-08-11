import styled from "@emotion/styled"
import { monoFont } from "@/shared/lib/typography"

const SIZE = 52
const RADIUS = 20
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const RotatedSvg = styled.svg`
  transform: rotate(-90deg);
`

const Label = styled.span<{ color: string }>`
  color: ${p => p.color};
`

export function ProgressRing({ progress, color }: { progress: number; color: string }) {
  return (
    <div className="shrink-0 relative w-[52px] h-[52px]">
      <RotatedSvg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" strokeWidth={3} stroke="var(--muted)" />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={3}
          stroke={color}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - progress / 100)}
          strokeLinecap="round"
        />
      </RotatedSvg>
      <Label
        css={monoFont}
        color={color}
        className="absolute inset-0 flex items-center justify-center text-[10px]"
      >
        {progress}%
      </Label>
    </div>
  )
}
