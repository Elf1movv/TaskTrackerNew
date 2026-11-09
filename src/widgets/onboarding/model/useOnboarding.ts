import { useCallback, useEffect, useReducer, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router"
import { onboardingEvent } from "./events"
import { fetchOnboardingStatus, saveOnboardingStatus, type OnboardingStatus } from "./onboardingApi"
import { initialOnboardingState, onboardingReducer, type CreatedItems } from "./onboardingMachine"
import { clearProgress, readProgress, writeProgress } from "./progressStorage"
import { ONBOARDING_STEPS } from "./steps"

// The onboarding's "controller": loads the status from the server, opens the
// walkthrough for an account that hasn't seen it, and exposes the actions
// the screens call. Used once, in app/layouts/RootLayout — that's also how
// the settings panel's "Take the tour again" reaches `restart` (a widget
// can't import another widget, the layout passes it down).
//
// `userId` is undefined until a session exists: RootLayout calls hooks
// before its own "not logged in" early return, and there's nothing to load
// then.
export function useOnboarding(userId: string | undefined) {
  const enabled = !!userId
  const [state, dispatch] = useReducer(onboardingReducer, initialOnboardingState)
  // undefined = still loading; null = never finished or skipped.
  const [status, setStatus] = useState<OnboardingStatus | null | undefined>(undefined)
  const autoStarted = useRef(false)
  const startedAt = useRef(0)
  const navigate = useNavigate()
  const { pathname } = useLocation()

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    fetchOnboardingStatus()
      .then(value => !cancelled && setStatus(value))
      .catch(err => {
        // A failed check must not pop the walkthrough at a long-time user —
        // treat it as already done for this visit.
        console.error(err)
        if (!cancelled) setStatus("completed")
      })
    return () => {
      cancelled = true
    }
  }, [enabled])

  // First visit of an account that has never finished or skipped it.
  useEffect(() => {
    if (status !== null || autoStarted.current) return
    autoStarted.current = true
    startedAt.current = Date.now()
    dispatch({ type: "start", isFirstRun: true, resume: (userId && readProgress(userId)) || undefined })
    onboardingEvent({ name: "onboarding_started", rerun: false })
  }, [status, userId])

  // The walkthrough and its finale belong on Today.
  useEffect(() => {
    if (state.phase === "flow" && pathname !== "/today") navigate("/today")
  }, [state.phase, pathname, navigate])

  // Remember where a first run is, in case the tab closes mid-way.
  useEffect(() => {
    if (userId && state.phase === "flow" && state.isFirstRun) {
      writeProgress(userId, { stepIndex: state.stepIndex, created: state.created })
    }
  }, [userId, state.phase, state.isFirstRun, state.stepIndex, state.created])

  const persist = useCallback((next: OnboardingStatus) => {
    setStatus(next)
    saveOnboardingStatus(next).catch(err => console.error(err))
  }, [])

  const restart = useCallback(() => {
    startedAt.current = Date.now()
    dispatch({ type: "start", isFirstRun: false })
    onboardingEvent({ name: "onboarding_started", rerun: true })
  }, [])

  const next = useCallback(() => {
    onboardingEvent({
      name: "onboarding_step_done",
      step: ONBOARDING_STEPS[state.stepIndex]?.id ?? "",
      outcome: "skipped",
    })
    dispatch({ type: "next" })
  }, [state.stepIndex])

  const back = useCallback(() => dispatch({ type: "back" }), [])

  const created = useCallback(
    (items: CreatedItems, preset?: string) => {
      onboardingEvent({
        name: "onboarding_step_done",
        step: ONBOARDING_STEPS[state.stepIndex]?.id ?? "",
        outcome: "created",
        preset,
      })
      dispatch({ type: "created", items })
    },
    [state.stepIndex],
  )

  const skip = useCallback(() => {
    onboardingEvent({ name: "onboarding_skipped", step: ONBOARDING_STEPS[state.stepIndex]?.id ?? "" })
    if (userId) clearProgress(userId)
    // A rerun from the menu that gets skipped keeps the earlier outcome.
    if (state.isFirstRun) persist("skipped")
    dispatch({ type: "skip" })
  }, [state.stepIndex, state.isFirstRun, persist, userId])

  const finish = useCallback(() => {
    onboardingEvent({
      name: "onboarding_completed",
      seconds: Math.round((Date.now() - startedAt.current) / 1000),
    })
    if (userId) clearProgress(userId)
    persist("completed")
    dispatch({ type: "finish" })
  }, [persist, userId])

  const close = useCallback(() => dispatch({ type: "close" }), [])

  return { state, restart, next, back, created, skip, finish, close }
}

export type OnboardingController = ReturnType<typeof useOnboarding>
