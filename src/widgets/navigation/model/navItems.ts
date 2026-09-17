import { CalendarDays, Flame, Layers, Target, type LucideIcon } from "lucide-react"
import type { TranslationKey } from "@/shared/lib/i18n"

export interface NavItem {
  path: string
  labelKey: TranslationKey
  Icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { path: "/today", labelKey: "nav.today", Icon: Flame },
  { path: "/tasks", labelKey: "nav.tasks", Icon: Layers },
  { path: "/goals", labelKey: "nav.goals", Icon: Target },
  { path: "/calendar", labelKey: "nav.calendar", Icon: CalendarDays },
]
