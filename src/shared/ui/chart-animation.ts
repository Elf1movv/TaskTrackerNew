// Recharts animates every series on mount for 1.5s by default — long enough
// that a screenshot taken a second after load shows a half-drawn line (that
// is how the "chart stops on Wednesday" false alarm happened, LEARNING.md
// 2026-11-08). Short fade-in instead; none when the OS asks for less motion.
export function chartAnimation() {
  const reduce =
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  return { isAnimationActive: !reduce, animationDuration: 300, animationEasing: "ease-out" as const }
}
