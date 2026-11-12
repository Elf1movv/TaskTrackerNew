import { useCallback, useEffect } from "react"
import { useCategories } from "@/entities/category"
import { useGoals } from "@/entities/goal"
import { useHabits } from "@/entities/habit"
import { useTasks } from "@/entities/task"
import { getTodayKey } from "@/shared/lib/date"
import { useLanguage } from "@/shared/lib/i18n"
import type { OnboardingController } from "../model/useOnboarding"
import { OnboardingFlow } from "./OnboardingFlow"
import { Spotlight } from "./Spotlight"

// Everything the onboarding draws on screen, by phase (model/onboardingMachine.ts).
// Mounted once in app/layouts/RootLayout, inside the entity providers.
export function OnboardingRoot({ ob }: { ob: OnboardingController }) {
  const { t } = useLanguage()
  const { habits, deleteHabit } = useHabits()
  const { deleteTask } = useTasks()
  const { deleteGoal } = useGoals()
  const { deleteCategory } = useCategories()
  const { phase, created, rollback } = ob.state
  const habit = habits.find(h => h.id === created.habitId)
  const checkedToday = !!habit?.completedDates.includes(getTodayKey())

  // The finale ends by itself once the person checks the highlighted habit
  // off — a short pause first, so they see the card turn colored.
  useEffect(() => {
    if (phase !== "spotlight" || !checkedToday) return
    const timer = setTimeout(ob.close, 900)
    return () => clearTimeout(timer)
  }, [phase, checkedToday, ob.close])

  // A run skipped before the finale: delete what it created, through the
  // normal entity functions so every page updates. Tasks, goals and habits
  // first; the categories last (deleting a category on the server also
  // deletes its tasks — they're gone already by then). remove() waits for a
  // create still in flight, so a quick skip can't race it.
  const { rolledBack } = ob
  useEffect(() => {
    if (!rollback) return
    rolledBack()
    void (async () => {
      await Promise.all([
        ...rollback.tasks.map(id => deleteTask(id)),
        ...rollback.goals.map(id => deleteGoal(id)),
        ...rollback.habits.map(id => deleteHabit(id)),
      ])
      await Promise.all(rollback.categories.map(id => deleteCategory(id)))
    })()
  }, [rollback, rolledBack, deleteTask, deleteGoal, deleteHabit, deleteCategory])

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
