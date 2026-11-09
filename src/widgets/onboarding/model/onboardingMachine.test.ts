import { describe, expect, it } from "vitest"
import {
  initialOnboardingState,
  onboardingReducer,
  type OnboardingAction,
  type OnboardingState,
} from "./onboardingMachine"
import { ONBOARDING_STEPS } from "./steps"

const run = (actions: OnboardingAction[], from: OnboardingState = initialOnboardingState) =>
  actions.reduce(onboardingReducer, from)

const LAST = ONBOARDING_STEPS.length - 1

describe("onboarding steps list", () => {
  it("has unique ids, starts with welcome and ends with the finale", () => {
    const ids = ONBOARDING_STEPS.map(s => s.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids[0]).toBe("welcome")
    expect(ids[LAST]).toBe("finale")
  })

  it("creates the habit, the task and the goal in that order", () => {
    const creates = ONBOARDING_STEPS.filter(s => ["habit", "task", "goal"].includes(s.id)).map(s => s.counts)
    expect(creates).toEqual([1, 2, 3])
  })
})

describe("onboardingReducer", () => {
  it("opens on the first screen", () => {
    const s = run([{ type: "start", isFirstRun: true }])
    expect(s.phase).toBe("flow")
    expect(s.stepIndex).toBe(0)
    expect(s.created).toEqual({})
  })

  it("resumes a first run where it stopped, clamped to the list", () => {
    const s = run([
      { type: "start", isFirstRun: true, resume: { stepIndex: 3, created: { habitTitle: "Бег" } } },
    ])
    expect(s.stepIndex).toBe(3)
    expect(s.created.habitTitle).toBe("Бег")
    expect(run([{ type: "start", isFirstRun: true, resume: { stepIndex: 99, created: {} } }]).stepIndex).toBe(
      LAST,
    )
  })

  it("moves forward and back with the right slide direction, never past the ends", () => {
    let s = run([{ type: "start", isFirstRun: true }, { type: "back" }])
    expect(s.stepIndex).toBe(0)
    s = run([{ type: "next" }, { type: "next" }], s)
    expect(s).toMatchObject({ stepIndex: 2, direction: 1 })
    s = run([{ type: "back" }], s)
    expect(s).toMatchObject({ stepIndex: 1, direction: -1 })
  })

  it("remembers what was created and moves on", () => {
    const s = run([
      { type: "start", isFirstRun: true },
      { type: "next" },
      { type: "created", items: { habitId: "h1", habitTitle: "Пить воду" } },
    ])
    expect(s.stepIndex).toBe(2)
    expect(s.created).toEqual({ habitId: "h1", habitTitle: "Пить воду" })
  })

  it("shows the come-back hint only when a first run is skipped", () => {
    expect(run([{ type: "start", isFirstRun: true }, { type: "skip" }]).phase).toBe("hint")
    expect(run([{ type: "start", isFirstRun: false }, { type: "skip" }]).phase).toBe("idle")
  })

  it("ends with the habit spotlight only if a habit was created", () => {
    const withHabit = run([
      { type: "start", isFirstRun: true },
      { type: "created", items: { habitId: "h1" } },
      { type: "finish" },
    ])
    expect(withHabit.phase).toBe("spotlight")
    expect(run([{ type: "start", isFirstRun: true }, { type: "finish" }]).phase).toBe("idle")
  })

  it("ignores flow actions when the flow isn't open", () => {
    expect(run([{ type: "next" }, { type: "skip" }, { type: "finish" }])).toEqual(initialOnboardingState)
  })

  it("closes the spotlight or hint", () => {
    const s = run([{ type: "start", isFirstRun: true }, { type: "skip" }, { type: "close" }])
    expect(s.phase).toBe("idle")
  })
})
