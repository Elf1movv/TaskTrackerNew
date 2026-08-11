import { forwardRef } from "react"
import styled from "@emotion/styled"
import { PRIORITY_COLORS, type Priority } from "../model/types"

const Dot = styled.div<{ color: string; size: number }>`
  border-radius: 9999px;
  background-color: ${p => p.color};
  width: ${p => p.size}px;
  height: ${p => p.size}px;
`

export const PriorityDot = forwardRef<HTMLDivElement, { priority: Priority; size?: number; colorOverride?: string }>(
  function PriorityDot({ priority, size = 6, colorOverride }, ref) {
    return <Dot ref={ref} className="shrink-0" color={colorOverride ?? PRIORITY_COLORS[priority]} size={size} />
  },
)
