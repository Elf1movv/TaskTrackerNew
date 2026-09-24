import type { TranslationKey } from "@/shared/lib/i18n"
import type { HabitGroup } from "../model/habitGroup"

// The General group's title/icon coming from the server are placeholders
// (the server has no concept of the user's language) — substituted with a
// localized label/icon ONLY while they still match the placeholder. Once
// the user renames/re-icons General (it's a fully editable group now,
// just not a deletable one), the real stored value is shown instead —
// otherwise an edit would appear to silently revert on every reload.
const GENERAL_PLACEHOLDER_TITLE = "General"
const GENERAL_PLACEHOLDER_ICON = "📋"
const GENERAL_ICON = "📋"

export function getHabitGroupTitle(group: HabitGroup, t: (key: TranslationKey) => string): string {
  return group.isGeneral && group.title === GENERAL_PLACEHOLDER_TITLE
    ? t("habits.group.generalTitle")
    : group.title
}

export function getHabitGroupIcon(group: HabitGroup): string {
  return group.isGeneral && group.icon === GENERAL_PLACEHOLDER_ICON ? GENERAL_ICON : group.icon
}
