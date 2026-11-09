import { motion, useReducedMotion } from "motion/react"
import { Check, Layers, Target } from "lucide-react"
import { HabitIcon } from "@/entities/habit"
import { useLanguage } from "@/shared/lib/i18n"
import { Button } from "@/shared/ui/button"
import { ConfettiBurst } from "@/shared/ui/confetti-burst"
import type { OnboardingController } from "../../model/useOnboarding"
import { StepTitle } from "../parts"

export function FinaleStep({ ob }: { ob: OnboardingController }) {
  const { t } = useLanguage()
  const reduceMotion = useReducedMotion()
  const { created } = ob.state
  const items = [
    created.habitTitle && {
      key: "habit",
      icon: <HabitIcon emoji={created.habitIcon ?? "✨"} size={16} style={{ color: created.habitColor }} />,
      title: created.habitTitle,
      where: t("onboarding.finale.onToday"),
    },
    created.taskTitle && {
      key: "task",
      icon: <Layers size={16} strokeWidth={1.75} className="text-primary" />,
      title: created.taskTitle,
      where: t("onboarding.finale.inTasks"),
    },
    created.goalTitle && {
      key: "goal",
      icon: <Target size={16} strokeWidth={1.75} style={{ color: created.goalColor }} />,
      title: created.goalTitle,
      where: t("onboarding.finale.onToday"),
    },
  ].filter(Boolean) as { key: string; icon: React.ReactNode; title: string; where: string }[]

  return (
    <>
      <ConfettiBurst />
      <motion.span
        initial={reduceMotion ? false : { scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 18 }}
        className="flex size-11 items-center justify-center rounded-lg bg-success-bg text-success"
      >
        <Check size={22} strokeWidth={2.5} />
      </motion.span>
      <StepTitle>{items.length ? t("onboarding.finale.title") : t("onboarding.finale.titleEmpty")}</StepTitle>
      {items.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {items.map((item, i) => (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.08 }}
              className="flex items-center gap-2.5 rounded-md bg-sunken px-3 py-2 text-sm"
            >
              <span className="flex w-4 shrink-0 justify-center">{item.icon}</span>
              <span className="min-w-0 flex-1 truncate font-semibold">{item.title}</span>
              <span className="shrink-0 text-caption text-muted-foreground">{item.where}</span>
            </motion.div>
          ))}
        </div>
      )}
      <Button className="h-11 w-full" onClick={ob.finish} autoFocus>
        {created.habitId ? t("onboarding.finale.look") : t("onboarding.finale.start")}
      </Button>
    </>
  )
}
