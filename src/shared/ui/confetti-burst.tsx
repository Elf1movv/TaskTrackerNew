import { useLayoutEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { motion, useReducedMotion } from "motion/react"

// A one-shot burst of confetti from wherever this component sits in the
// layout. Built on motion instead of the canvas-confetti package (removed in
// the 2026-11-09 audit): no extra dependency, and the pieces take the
// theme's own colors, so they work in dark mode too. Shared so the next
// iteration ("moments of joy": a goal closed, a perfect habit week) reuses it.
//
// With the system "reduce motion" setting on it renders nothing — the
// caller shows a still checkmark instead.

const COLORS = ["var(--primary)", "var(--success)", "var(--warning)", "var(--destructive)"]

interface Piece {
  dx: number
  dy: number
  rotate: number
  delay: number
  color: string
  wide: boolean
}

function makePieces(count: number): Piece[] {
  return Array.from({ length: count }, (_, i) => {
    // Fan upwards: angles between ~200° and ~340° (screen y grows downwards).
    const angle = ((200 + Math.random() * 140) * Math.PI) / 180
    const speed = 110 + Math.random() * 170
    return {
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      rotate: (Math.random() - 0.5) * 720,
      delay: Math.random() * 0.08,
      color: COLORS[i % COLORS.length],
      wide: i % 3 === 0,
    }
  })
}

export function ConfettiBurst({ count = 40 }: { count?: number }) {
  const reduceMotion = useReducedMotion()
  const anchorRef = useRef<HTMLSpanElement>(null)
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null)
  const pieces = useMemo(() => makePieces(count), [count])

  useLayoutEffect(() => {
    const rect = anchorRef.current?.getBoundingClientRect()
    if (rect) setOrigin({ x: rect.left + rect.width / 2, y: rect.top })
  }, [])

  return (
    <>
      <span ref={anchorRef} aria-hidden className="block h-0 w-full" />
      {!reduceMotion &&
        origin &&
        createPortal(
          <div aria-hidden className="pointer-events-none fixed inset-0 z-[70] overflow-hidden">
            {pieces.map((p, i) => (
              <motion.span
                key={i}
                className="absolute rounded-[2px]"
                style={{
                  left: origin.x,
                  top: origin.y,
                  width: p.wide ? 10 : 7,
                  height: p.wide ? 6 : 11,
                  backgroundColor: p.color,
                }}
                initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
                animate={{
                  x: [0, p.dx, p.dx * 1.25],
                  y: [0, p.dy, p.dy + 280],
                  rotate: [0, p.rotate / 2, p.rotate],
                  opacity: [1, 1, 0],
                }}
                transition={{ duration: 1.3, delay: p.delay, ease: [0.2, 0.7, 0.4, 1], times: [0, 0.4, 1] }}
              />
            ))}
          </div>,
          document.body,
        )}
    </>
  )
}
