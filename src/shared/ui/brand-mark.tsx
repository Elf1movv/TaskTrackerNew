import { cn } from "./utils"

// The app's logo mark (checkmark in a rounded square) — used at three
// sizes: the sidebar (36px), auth pages (64px), and WelcomeModal (56px).
// Previously defined inline only in SidebarNav.tsx; extracted here so all
// three stay in sync from one place instead of copy-pasted SVG paths.
export function BrandMark({
  size = 36,
  iconSize = 20,
  radius = 10,
  className,
}: {
  size?: number
  iconSize?: number
  radius?: number
  className?: string
}) {
  return (
    <div
      className={cn(
        "shrink-0 bg-primary text-primary-foreground flex items-center justify-center shadow-raised",
        className,
      )}
      style={{ width: size, height: size, borderRadius: radius }}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.25}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M21 12a9 9 0 1 1-6.2-8.56" />
        <path d="m8.5 11.5 3 3L22 4" />
      </svg>
    </div>
  )
}
