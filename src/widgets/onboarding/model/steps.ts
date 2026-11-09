// The whole onboarding ("знакомство") as one list. To reorder, drop or add a
// screen, edit this list: the flow, the "Step N of 3" counter and the
// progress tray all read from it. Texts live in the i18n dictionaries under
// `onboarding.<id>.*`; each `kind` has its own screen component in
// ui/steps/ (see ui/OnboardingFlow.tsx).
//
// Approved by the owner on 2026-11-09 — mockup and decisions in
// docs/BACKLOG.md ("Онбординг-действие с анимациями").

export type OnboardingStepKind =
  "welcome" | "habit" | "habitFeatures" | "task" | "goal" | "goalStructure" | "tools" | "feedback" | "finale"

export interface OnboardingStep {
  id: OnboardingStepKind
  // Which of the three "create" steps this screen belongs to — drives the
  // "Step N of 3" dots. Info screens that explain what was just created
  // share the number of their create step.
  counts?: 1 | 2 | 3
  // Show the three-cell tray of created items under this screen.
  showTray?: boolean
}

export const ONBOARDING_STEPS: readonly OnboardingStep[] = [
  { id: "welcome" },
  { id: "habit", counts: 1, showTray: true },
  { id: "habitFeatures", counts: 1 },
  { id: "task", counts: 2, showTray: true },
  { id: "goal", counts: 3, showTray: true },
  { id: "goalStructure", counts: 3 },
  { id: "tools", showTray: true },
  { id: "feedback" },
  { id: "finale" },
]

export const CREATE_STEP_COUNT = 3

// Ready-made habits on the habit step. `icon` is a key of HABIT_ICON_PATHS
// (rendered as a line icon, the emoji itself is never shown) and `color` one
// of PALETTE_COLORS, so the result looks like a habit made in the normal form.
export const HABIT_PRESETS = [
  { key: "water", icon: "💧", color: "#3aa6c9" },
  { key: "running", icon: "🏃", color: "#c97b3a" },
  { key: "reading", icon: "📚", color: "#5b7fc7" },
  { key: "walk", icon: "🚶", color: "#6a9c74" },
] as const

export type HabitPresetKey = (typeof HABIT_PRESETS)[number]["key"]

// Icon for a habit typed by hand — the same default as HabitForm.
export const CUSTOM_HABIT_ICON = "✨"
