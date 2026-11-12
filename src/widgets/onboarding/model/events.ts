// The single place the onboarding reports what happened. Product analytics
// isn't built yet (docs/BACKLOG.md, "Минимальная продуктовая аналитика"), so
// for now this does nothing outside development. When analytics arrives,
// only this function changes — the onboarding already calls it at every
// point the funnel needs.

export type OnboardingEvent =
  | { name: "onboarding_started"; rerun: boolean }
  | { name: "onboarding_step_done"; step: string; outcome: "created" | "skipped"; preset?: string }
  | { name: "onboarding_completed"; seconds: number }
  | { name: "onboarding_skipped"; step: string }

export function onboardingEvent(event: OnboardingEvent): void {
  if (import.meta.env.DEV) console.debug("[onboarding]", event)
}
