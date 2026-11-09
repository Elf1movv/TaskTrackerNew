import { useCallback, useEffect } from "react"
import { useHabits } from "@/entities/habit"
import { getTodayKey } from "@/shared/lib/date"
import { useLanguage } from "@/shared/lib/i18n"
import type { OnboardingController } from "../model/useOnboarding"
import { OnboardingFlow } from "./OnboardingFlow"
import { Spotlight } from "./Spotlight"

// Everything the onboarding draws on screen, by phase (model/onboardingMachine.ts).
// Mounted once in app/layouts/RootLayout, inside the entity providers.
export function OnboardingRoot({ ob }: { ob: OnboardingController }) {
  const { t } = useLanguage()
  const { habits } = useHabits()
  const { phase, created } = ob.state
  const habit = habits.find(h => h.id === created.habitId)
  const checkedToday = !!habit?.completedDates.includes(getTodayKey())

  // The finale ends by itself once the person checks the highlighted habit
  // off — a short pause first, so they see the card turn colored.
  useEffect(() => {
    if (phase !== "spotlight" || !checkedToday) return
    const timer = setTimeout(ob.close, 900)
    return () => clearTimeout(timer)
  }, [phase, checkedToday, ob.close])

  const closeHint = useCallback(() => ob.close(), [ob])

  return (
    <>
      <OnboardingFlow ob={ob} />
      {phase === "spotlight" && created.habitId && (
        <Spotlight
          selector={`[data-onboarding-habit="${created.habitId}"]`}
          title={t("onboarding.spot.title")}
          body={t("onboarding.spot.body")}
          actionLabel={t("onboarding.spot.done")}
          onAction={ob.close}
        />
      )}
      {phase === "hint" && (
        <Spotlight
          selector='[data-onboarding="settings-gear"]'
          round
          title={t("onboarding.hint.title")}
          body={t("onboarding.hint.body")}
          actionLabel={t("onboarding.hint.ok")}
          onAction={ob.close}
          onTargetClick={closeHint}
        />
      )}
    </>
  )
}
