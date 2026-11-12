import { ONBOARDING_STEPS } from "./steps"

// Pure state of the onboarding, kept apart from React so it can be tested
// on its own (onboardingMachine.test.ts). A "reducer" is a function
// (state, action) → new state: every change goes through one place, so the
// order of screens can't get out of sync between components.
//
// Phases:
//   idle       — nothing on screen
//   flow       — the step-by-step dialog
//   spotlight  — after the finale: the created habit on Today is highlighted
//   hint       — after the first skip: the settings gear is highlighted

export type OnboardingPhase = "idle" | "flow" | "spotlight" | "hint"

export interface CreatedItems {
  habitId?: string
  habitTitle?: string
  habitIcon?: string
  habitColor?: string
  taskTitle?: string
  goalTitle?: string
  goalColor?: string
}

// Ids of every record this run created — a run left before the finale is
// undone (owner decision 2026-11-12: "не завершил онбординг — не добавляем").
// Lists, not single ids: going back a screen and creating again makes a
// second record. `categories` are only the ones made in the task step, never
// one the person picked from their existing list.
export interface OwnedRecords {
  habits: string[]
  tasks: string[]
  goals: string[]
  categories: string[]
}

export const NO_OWNED_RECORDS: OwnedRecords = { habits: [], tasks: [], goals: [], categories: [] }

export function hasOwnedRecords(owned: OwnedRecords): boolean {
  return Object.values(owned).some(ids => ids.length > 0)
}

function addOwned(owned: OwnedRecords, more: Partial<OwnedRecords>): OwnedRecords {
  return {
    habits: [...owned.habits, ...(more.habits ?? [])],
    tasks: [...owned.tasks, ...(more.tasks ?? [])],
    goals: [...owned.goals, ...(more.goals ?? [])],
    categories: [...owned.categories, ...(more.categories ?? [])],
  }
}

export interface OnboardingState {
  phase: OnboardingPhase
  stepIndex: number
  // +1 forward, -1 back — the slide direction of the step transition.
  direction: 1 | -1
  created: CreatedItems
  owned: OwnedRecords
  // Records of a skipped run waiting to be deleted — OnboardingRoot deletes
  // them (it sits inside the entity providers) and then sends "rolledBack".
  rollback: OwnedRecords | null
  // True when the account has never finished or skipped onboarding: only
  // then a skip shows the "you can come back later" hint and saves "skipped".
  isFirstRun: boolean
}

export type OnboardingAction =
  | {
      type: "start"
      isFirstRun: boolean
      resume?: { stepIndex: number; created: CreatedItems; owned?: OwnedRecords }
    }
  | { type: "next" }
  | { type: "back" }
  | { type: "created"; items: CreatedItems; owned?: Partial<OwnedRecords> }
  | { type: "own"; owned: Partial<OwnedRecords> }
  | { type: "skip" }
  | { type: "finish" }
  | { type: "close" }
  | { type: "rolledBack" }

export const initialOnboardingState: OnboardingState = {
  phase: "idle",
  stepIndex: 0,
  direction: 1,
  created: {},
  owned: NO_OWNED_RECORDS,
  rollback: null,
  isFirstRun: false,
}

const LAST_STEP = ONBOARDING_STEPS.length - 1

export function onboardingReducer(state: OnboardingState, action: OnboardingAction): OnboardingState {
  switch (action.type) {
    case "start": {
      const resumeIndex = action.resume ? Math.min(Math.max(action.resume.stepIndex, 0), LAST_STEP) : 0
      return {
        phase: "flow",
        stepIndex: resumeIndex,
        direction: 1,
        created: action.resume?.created ?? {},
        owned: action.resume?.owned ?? NO_OWNED_RECORDS,
        rollback: state.rollback,
        isFirstRun: action.isFirstRun,
      }
    }
    case "next":
      if (state.phase !== "flow") return state
      return { ...state, stepIndex: Math.min(state.stepIndex + 1, LAST_STEP), direction: 1 }
    case "back":
      if (state.phase !== "flow") return state
      return { ...state, stepIndex: Math.max(state.stepIndex - 1, 0), direction: -1 }
    case "created":
      // Creating something always moves on to the next screen as well.
      if (state.phase !== "flow") return state
      return {
        ...state,
        created: { ...state.created, ...action.items },
        owned: addOwned(state.owned, action.owned ?? {}),
        stepIndex: Math.min(state.stepIndex + 1, LAST_STEP),
        direction: 1,
      }
    case "own":
      if (state.phase !== "flow") return state
      return { ...state, owned: addOwned(state.owned, action.owned) }
    case "skip":
      if (state.phase !== "flow") return state
      // Left before the finale: everything this run made goes away.
      return {
        ...state,
        phase: state.isFirstRun ? "hint" : "idle",
        created: {},
        owned: NO_OWNED_RECORDS,
        rollback: hasOwnedRecords(state.owned) ? state.owned : state.rollback,
      }
    case "finish":
      if (state.phase !== "flow") return state
      // Reaching the finale keeps everything. The spotlight needs a real
      // habit on Today to point at.
      return { ...state, owned: NO_OWNED_RECORDS, phase: state.created.habitId ? "spotlight" : "idle" }
    case "close":
      return { ...state, phase: "idle" }
    case "rolledBack":
      return { ...state, rollback: null }
  }
}
