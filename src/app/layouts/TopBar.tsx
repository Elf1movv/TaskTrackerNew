import type { ReactNode } from "react"
import { BrandMark } from "@/shared/ui/brand-mark"

// The bar at the top of every screen (owner, 2026-11-18): the reminder bell
// and the settings gear used to float over the page (`fixed`), slid over the
// content while scrolling and, on phones, overlapped each other by 2 px. Now
// they sit in this bar, which stays put while the page scrolls under it.
// On phones it also carries the logo (the desktop sidebar has its own).
export function TopBar({ children }: { children: ReactNode }) {
  return (
    <div className="sticky top-0 z-30 flex h-[60px] items-center gap-2 border-b border-border/60 bg-background/90 px-4 backdrop-blur md:h-[68px] md:px-6">
      <div className="flex flex-1 items-center gap-2.5 md:invisible">
        <BrandMark size={30} iconSize={16} radius={9} />
        <span className="text-body font-bold">MyTracker</span>
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  )
}
