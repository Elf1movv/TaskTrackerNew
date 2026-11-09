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

export interface OnboardingState {
  phase: OnboardingPhase
  stepIndex: number
  // +1 forward, -1 back — the slide direction of the step transition.
  direction: 1 | -1
  created: CreatedItems
  // True when the account has never finished or skipped onboarding: only
  // then a skip shows the "you can come back later" hint and saves "skipped".
  isFirstRun: boolean
}

export type OnboardingAction =
  | { type: "start"; isFirstRun: boolean; resume?: { stepIndex: number; created: CreatedItems } }
  | { type: "next" }
  | { type: "back" }
  | { type: "created"; items: CreatedItems }
  | { type: "skip" }
  | { type: "finish" }
  | { type: "close" }

export const initialOnboardingState: OnboardingState = {
  phase: "idle",
  stepIndex: 0,
  direction: 1,
  created: {},
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
        stepIndex: Math.min(state.stepIndex + 1, LAST_STEP),
        direction: 1,
      }
    case "skip":
      if (state.phase !== "flow") return state
      return { ...state, phase: state.isFirstRun ? "hint" : "idle" }
    case "finish":
      if (state.phase !== "flow") return state
      // The spotlight needs a real habit on Today to point at.
      return { ...state, phase: state.created.habitId ? "spotlight" : "idle" }
    case "close":
      return { ...state, phase: "idle" }
  }
}
