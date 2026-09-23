import type { TranslationKey } from "@/shared/lib/i18n"
import type { HabitGroup } from "../model/habitGroup"

// The General group's title/icon coming from the server are placeholders
// (the server has no concept of the user's language) — the client always
// substitutes its own localized label and a fixed icon for it here,
// everywhere a group's name/icon is displayed.
const GENERAL_ICON = "📋"

export function getHabitGroupTitle(group: HabitGroup, t: (key: TranslationKey) => string): string {
  return group.isGeneral ? t("habits.group.generalTitle") : group.title
}

export function getHabitGroupIcon(group: HabitGroup): string {
  return group.isGeneral ? GENERAL_ICON : group.icon
}
