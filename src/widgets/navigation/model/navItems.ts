import { CalendarDays, Flame, Layers, Target, type LucideIcon } from "lucide-react"

export interface NavItem {
  path: string
  label: string
  Icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { path: "/today", label: "Today", Icon: Flame },
  { path: "/tasks", label: "Tasks", Icon: Layers },
  { path: "/goals", label: "Goals", Icon: Target },
  { path: "/calendar", label: "Calendar", Icon: CalendarDays },
]
