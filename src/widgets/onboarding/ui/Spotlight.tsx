import { useEffect, useId, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { motion, useReducedMotion } from "motion/react"
import { Button } from "@/shared/ui/button"

// Dims the whole screen except one element of the real interface and puts a
// short tip next to it. The element stays clickable: four transparent
// blockers cover everything around the "window", so only the highlighted
// thing reacts to clicks. Used for the finale (the new habit card on Today)
// and for the hint after a skip (the settings gear).

interface Rect {
  top: number
  left: number
  width: number
  height: number
}

const PAD = 6
const TIP_WIDTH = 280
const GAP = 12

// The element that actually scrolls around `el` (in this app it's <main>, the
// page itself never scrolls).
function scrollParentOf(el: Element | null): HTMLElement | null {
  for (let node = el?.parentElement; node; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node)
    if ((overflowY === "auto" || overflowY === "scroll") && node.scrollHeight > node.clientHeight) return node
  }
  return document.scrollingElement as HTMLElement | null
}

export function Spotlight({
  selector,
  round,
  title,
  body,
  actionLabel,
  onAction,
  onTargetClick,
}: {
  selector: string
  round?: boolean
  title: string
  body: string
  actionLabel: string
  onAction: () => void
  onTargetClick?: () => void
}) {
  const reduceMotion = useReducedMotion()
  const maskId = `spotlight-${useId().replace(/:/g, "")}`
  const [rect, setRect] = useState<Rect | null>(null)
  const tipRef = useRef<HTMLDivElement>(null)
  // Real height of the tip, measured after render — a guess (it used to be a
  // fixed 170 px) put the tip below the screen edge on some displays
  // (owner report, 2026-11-10).
  const [tipHeight, setTipHeight] = useState(160)
  const touchY = useRef<number | null>(null)
  const missingSince = useRef(0)
  const onActionRef = useRef(onAction)
  useEffect(() => {
    onActionRef.current = onAction
  }, [onAction])

  // Find the element, bring it into view once, then follow it (scrolling,
  // resizing, the page finishing its own enter animation) every frame.
  useLayoutEffect(() => {
    let frame = 0
    let scrolled = false
    missingSince.current = Date.now()
    const tick = () => {
      const el = document.querySelector(selector)
      if (el) {
        missingSince.current = Date.now()
        if (!scrolled) {
          el.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" })
          scrolled = true
        }
        const r = el.getBoundingClientRect()
        setRect(prev =>
          prev &&
          prev.top === r.top &&
          prev.left === r.left &&
          prev.width === r.width &&
          prev.height === r.height
            ? prev
            : { top: r.top, left: r.left, width: r.width, height: r.height },
        )
      } else if (Date.now() - missingSince.current > 2500) {
        // The element never showed up (e.g. the habit failed to save) —
        // don't leave the screen dimmed forever.
        onActionRef.current()
        return
      }
      frame = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(frame)
  }, [selector, reduceMotion])

  const found = rect !== null
  useEffect(() => {
    if (!onTargetClick || !found) return
    const el = document.querySelector(selector)
    el?.addEventListener("click", onTargetClick)
    return () => el?.removeEventListener("click", onTargetClick)
  }, [selector, onTargetClick, found])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onActionRef.current()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  useLayoutEffect(() => {
    const h = tipRef.current?.offsetHeight
    if (h && h !== tipHeight) setTipHeight(h)
  }, [rect, tipHeight])

  // The blockers around the window sit on top of the page, so the mouse
  // wheel or a finger swipe over them scrolled nothing — once the page moved
  // and the cursor ended up over the dim area, scrolling "stopped working"
  // (owner report, 2026-11-10). Pass the scroll on to the page.
  const scroller = () => scrollParentOf(document.querySelector(selector))
  const onWheel = (e: React.WheelEvent) => {
    const factor = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1
    scroller()?.scrollBy({ top: e.deltaY * factor, left: e.deltaX * factor })
  }
  const onTouchStart = (e: React.TouchEvent) => {
    touchY.current = e.touches[0]?.clientY ?? null
  }
  const onTouchMove = (e: React.TouchEvent) => {
    const y = e.touches[0]?.clientY
    if (y === undefined || touchY.current === null) return
    scroller()?.scrollBy({ top: touchY.current - y })
    touchY.current = y
  }
  const scrollPass = { onWheel, onTouchStart, onTouchMove }

  if (!rect) return null

  const hole = {
    top: rect.top - PAD,
    left: rect.left - PAD,
    width: rect.width + PAD * 2,
    height: rect.height + PAD * 2,
  }
  const vw = window.innerWidth
  const vh = window.innerHeight
  const tipWidth = Math.min(TIP_WIDTH, vw - 32)
  const tipLeft = Math.min(Math.max(16, hole.left + hole.width / 2 - tipWidth / 2), vw - tipWidth - 16)
  // Below the window if it fits, otherwise above; and always kept on screen
  // (the window itself can be partly off screen while the page scrolls).
  const below = hole.top + hole.height + GAP
  const above = hole.top - GAP - tipHeight
  const placeBelow = below + tipHeight + GAP <= vh || above < GAP
  const tipTop = Math.min(Math.max(GAP, placeBelow ? below : above), vh - tipHeight - GAP)
  const tipStyle = { top: tipTop }
  const radiusPx = round ? Math.min(hole.width, hole.height) / 2 : 16

  return createPortal(
    // The layer itself lets clicks through (pointer-events-none) — otherwise
    // it would swallow the click on the highlighted element too; only the
    // four blockers around the window and the tip catch them.
    <div className="pointer-events-none fixed inset-0 z-[60]">
      <div
        {...scrollPass}
        className="pointer-events-auto absolute inset-x-0 top-0"
        style={{ height: Math.max(0, hole.top) }}
      />
      <div
        {...scrollPass}
        className="pointer-events-auto absolute inset-x-0 bottom-0"
        style={{ top: hole.top + hole.height }}
      />
      <div
        {...scrollPass}
        className="pointer-events-auto absolute left-0"
        style={{ top: hole.top, height: hole.height, width: Math.max(0, hole.left) }}
      />
      <div
        {...scrollPass}
        className="pointer-events-auto absolute right-0"
        style={{ top: hole.top, height: hole.height, left: hole.left + hole.width }}
      />

      {/* The dim layer: a full-screen SVG with the window cut out by a mask
          (a huge box-shadow was tried first and barely dimmed in Chrome). */}
      <motion.svg
        aria-hidden
        className="absolute inset-0 h-full w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reduceMotion ? 0 : 0.3 }}
      >
        <defs>
          <mask id={maskId}>
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={hole.left}
              y={hole.top}
              width={hole.width}
              height={hole.height}
              rx={radiusPx}
              fill="black"
            />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="black" fillOpacity={0.7} mask={`url(#${maskId})`} />
      </motion.svg>
      <div
        aria-hidden
        className="absolute"
        style={{ ...hole, borderRadius: radiusPx, boxShadow: "0 0 0 2px var(--primary)" }}
      >
        {!reduceMotion && (
          <motion.span
            className="absolute -inset-1 border-2 border-primary"
            style={{ borderRadius: radiusPx + 4 }}
            initial={{ opacity: 0.9, scale: 1 }}
            animate={{ opacity: 0, scale: 1.06 }}
            transition={{ duration: 1.5, repeat: 1, ease: "easeOut" }}
          />
        )}
      </div>

      <motion.div
        ref={tipRef}
        role="dialog"
        aria-label={title}
        initial={{ opacity: 0, y: placeBelow ? -6 : 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: reduceMotion ? 0 : 0.2 }}
        className="pointer-events-auto absolute flex flex-col gap-2 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-raised"
        style={{ left: tipLeft, width: tipWidth, ...tipStyle }}
      >
        <div className="text-sm font-bold">{title}</div>
        <p className="text-meta text-muted-foreground">{body}</p>
        <Button size="sm" className="self-start" onClick={onAction} autoFocus>
          {actionLabel}
        </Button>
      </motion.div>
    </div>,
    document.body,
  )
}
