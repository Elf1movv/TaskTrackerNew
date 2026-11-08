import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// The app's own type scale (theme.css → text-caption/meta/body/title/page)
// must be registered as font SIZES. Unregistered, tailwind-merge reads
// `text-body` as a text COLOR and drops the button's `text-primary-foreground`
// — dark text on the dark primary button (caught on the unslop screenshots,
// 2026-11-08).
const twMerge = extendTailwindMerge({
  extend: { theme: { text: ["caption", "meta", "body", "title", "page"] } },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
