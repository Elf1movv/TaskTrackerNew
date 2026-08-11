import styled from "@emotion/styled"

const Track = styled.div`
  height: 2px;
  background-color: var(--muted);
  border-radius: 9999px;
  overflow: hidden;
`

const Fill = styled.div<{ color: string; percent: number }>`
  height: 100%;
  border-radius: 9999px;
  transition: width 0.7s ease;
  background-color: ${p => p.color};
  width: ${p => p.percent}%;
`

export function GoalProgressBar({ percent, color }: { percent: number; color: string }) {
  return (
    <Track>
      <Fill color={color} percent={percent} />
    </Track>
  )
}
