import { css } from "@emotion/react"

// Numbers that line up (counters, times, percentages, chart ticks) — the
// app's own font with equal-width digits. Used to be a monospace font;
// dropped in the unslop pass 2026-11-08 (looked foreign next to the text).
export const numericFont = css`
  font-variant-numeric: tabular-nums;
`

export const displayFont = css`
  font-family: var(--font-display);
`
