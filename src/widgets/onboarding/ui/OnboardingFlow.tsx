import type { ComponentType } from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { AnimatePresence, MotionConfig, motion } from "motion/react"
import { useLanguage } from "@/shared/lib/i18n"
import { useIsMobile } from "@/shared/ui/use-mobile"
import type { OnboardingController } from "../model/useOnboarding"
import { ONBOARDING_STEPS, type OnboardingStepKind } from "../model/steps"
import { GoalStep, HabitStep, TaskStep } from "./steps/CreateSteps"
import { FinaleStep } from "./steps/FinaleStep"
import { FeedbackStep, GoalStructureStep, HabitFeaturesStep, ToolsStep, WelcomeStep } from "./steps/InfoSteps"

// Which screen draws each step of model/steps.ts.
const SCREENS: Record<OnboardingStepKind, ComponentType<{ ob: OnboardingController }>> = {
  welcome: WelcomeStep,
  habit: HabitStep,
  habitFeatures: HabitFeaturesStep,
  task: TaskStep,
  goal: GoalStep,
  goalStructure: GoalStructureStep,
  tools: ToolsStep,
  feedback: FeedbackStep,
  finale: FinaleStep,
}

// The step-by-step dialog: a centred card on a computer, a sheet sliding up
// from the bottom on a phone. Built on the same Radix dialog as the app's
// other dialogs (focus stays inside, Esc works, screen readers announce it),
// with motion for the animations. MotionConfig reducedMotion="user" makes
// every animation inside fall back to a plain fade when the system "reduce
// motion" setting is on.
export function OnboardingFlow({ ob }: { ob: OnboardingController }) {
  const { t } = useLanguage()
  const isMobile = useIsMobile()
  const open = ob.state.phase === "flow"
  const step = ONBOARDING_STEPS[ob.state.stepIndex]
  const Screen = SCREENS[step.id]
  const direction = ob.state.direction

  return (
    <MotionConfig reducedMotion="user">
      <DialogPrimitive.Root
        open={open}
        // Esc is the keyboard's "skip"; clicks outside the card do nothing,
        // so a stray tap can't throw away the walkthrough.
        onOpenChange={next => !next && ob.skip()}
      >
        <AnimatePresence>
          {open && (
            <DialogPrimitive.Portal forceMount>
              <DialogPrimitive.Overlay asChild forceMount>
                <motion.div
                  className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[3px]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                />
              </DialogPrimitive.Overlay>
              <DialogPrimitive.Content
                asChild
                forceMount
                aria-describedby={undefined}
                onPointerDownOutside={e => e.preventDefault()}
                onInteractOutside={e => e.preventDefault()}
              >
                <motion.div
                  className={
                    isMobile
                      ? "fixed inset-x-0 bottom-0 z-50 max-h-[92dvh] overflow-y-auto overflow-x-hidden rounded-t-3xl bg-card px-5 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-card-foreground shadow-raised outline-none"
                      : "fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[min(460px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto overflow-x-hidden rounded-2xl bg-card p-6 text-card-foreground shadow-raised outline-none"
                  }
                  initial={isMobile ? { y: 48, opacity: 0 } : { scale: 0.96, opacity: 0 }}
                  animate={isMobile ? { y: 0, opacity: 1 } : { scale: 1, opacity: 1 }}
                  exit={isMobile ? { y: 48, opacity: 0 } : { scale: 0.97, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  layout
                >
                  <DialogPrimitive.Title className="sr-only">
                    {t("onboarding.dialogLabel")}
                  </DialogPrimitive.Title>
                  <AnimatePresence mode="popLayout" initial={false} custom={direction}>
                    <motion.div
                      key={step.id}
                      custom={direction}
                      initial={{ opacity: 0, x: direction * 28 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: direction * -28 }}
                      transition={{ duration: 0.26, ease: [0.2, 0.8, 0.2, 1] }}
                      className="flex flex-col gap-3.5"
                    >
                      <Screen ob={ob} />
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
              </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
          )}
        </AnimatePresence>
      </DialogPrimitive.Root>
    </MotionConfig>
  )
}
