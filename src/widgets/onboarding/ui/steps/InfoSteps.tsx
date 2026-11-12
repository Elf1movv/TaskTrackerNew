import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import {
  BellRing,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Flame,
  Folder,
  LayoutGrid,
  MessageSquare,
  Sparkles,
  StickyNote,
  Target,
} from "lucide-react"
import { HabitCard, HabitListRow } from "@/features/habit-card"
import { GoalProgressBar } from "@/entities/goal"
import { HabitIcon, useHabits, type Habit } from "@/entities/habit"
import { PALETTE_COLORS } from "@/shared/lib/colors"
import { useLanguage, type TranslationKey } from "@/shared/lib/i18n"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/ui/utils"
import type { OnboardingController } from "../../model/useOnboarding"
import { HABIT_PRESETS } from "../../model/steps"
import { CreatedTray, FeatureRow, StepIcon, StepText, StepTitle, StepTop } from "../parts"

type StepProps = { ob: OnboardingController }

function NavButtons({ ob, nextLabel }: StepProps & { nextLabel?: string }) {
  const { t } = useLanguage()
  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" className="text-muted-foreground" onClick={ob.back}>
        {t("onboarding.back")}
      </Button>
      <Button className="h-11 flex-1" onClick={ob.next}>
        {nextLabel ?? t("onboarding.next")}
      </Button>
    </div>
  )
}

export function WelcomeStep({ ob }: StepProps) {
  const { t } = useLanguage()
  return (
    <>
      <StepIcon>
        <Sparkles size={22} strokeWidth={1.75} />
      </StepIcon>
      <StepTitle>{t("onboarding.welcome.title")}</StepTitle>
      <StepText>{t("onboarding.welcome.body")}</StepText>
      <span className="text-meta font-bold text-muted-foreground">{t("onboarding.welcome.meta")}</span>
      <Button className="h-11 w-full" onClick={ob.next} autoFocus>
        {t("onboarding.welcome.start")}
      </Button>
      <button
        type="button"
        onClick={ob.skip}
        className="self-center rounded-sm text-meta font-semibold text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
      >
        {t("onboarding.skipAll")}
      </button>
    </>
  )
}

// Example habits shown next to the user's own one in the view switcher —
// never saved anywhere.
function demoHabit(key: string, title: string, icon: string, color: string): Habit {
  return {
    id: `demo-${key}`,
    title,
    icon,
    color,
    completedDates: [],
    activeDays: [0, 1, 2, 3, 4, 5, 6],
    groupId: "",
    updatedAt: "",
    createdAt: "",
  }
}

// The real HabitCard / HabitListRow, so the preview looks exactly like the
// home screen — made "inert" (not clickable, not focusable) because a click
// would otherwise check the habit off.
function ViewSlider({ habits }: { habits: Habit[] }) {
  const { t } = useLanguage()
  const [view, setView] = useState<0 | 1>(0)
  const [direction, setDirection] = useState<1 | -1>(1)
  const go = (next: 0 | 1) => {
    setDirection(next > view ? 1 : -1)
    setView(next)
  }
  return (
    <div className="mt-2 flex flex-col gap-2 rounded-xl border border-border bg-sunken p-2.5">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => go(0)}
          disabled={view === 0}
          aria-label={t("onboarding.habitFeatures.prevView")}
          className="flex size-8 items-center justify-center rounded-full border border-border bg-card disabled:opacity-35"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-meta font-bold">
          {view === 0 ? t("onboarding.habitFeatures.viewGrid") : t("onboarding.habitFeatures.viewList")}
        </span>
        <button
          type="button"
          onClick={() => go(1)}
          disabled={view === 1}
          aria-label={t("onboarding.habitFeatures.nextView")}
          className="flex size-8 items-center justify-center rounded-full border border-border bg-card disabled:opacity-35"
        >
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="relative overflow-hidden" ref={el => el?.setAttribute("inert", "")}>
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.div
            key={view}
            custom={direction}
            initial={{ opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -40 }}
            transition={{ duration: 0.25 }}
          >
            {view === 0 ? (
              <div className="grid grid-cols-3 gap-2 [&_button]:min-h-[120px]">
                {habits.map(h => (
                  <HabitCard key={h.id} habit={h} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-1.5 [&_button>div:last-child]:pr-0">
                {habits.map(h => (
                  <HabitListRow key={h.id} habit={h} />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="flex justify-center gap-1" aria-hidden>
        {[0, 1].map(i => (
          <span
            key={i}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === view ? "w-4 bg-primary" : "w-1.5 bg-border-strong",
            )}
          />
        ))}
      </div>
    </div>
  )
}

export function HabitFeaturesStep({ ob }: StepProps) {
  const { t } = useLanguage()
  const { habits } = useHabits()
  const own = habits.find(h => h.id === ob.state.created.habitId)
  // The person's own habit first, then ready-made ones it isn't a copy of.
  const demos = HABIT_PRESETS.filter(p => p.icon !== own?.icon)
    .slice(0, own ? 2 : 3)
    .map(p => demoHabit(p.key, t(`onboarding.habit.preset.${p.key}` as TranslationKey), p.icon, p.color))
  const examples = own ? [own, ...demos] : demos
  const flameColor = own?.color ?? HABIT_PRESETS[1].color
  return (
    <>
      <StepTop counts={1} onSkip={ob.skip} />
      <StepTitle>
        {own ? t("onboarding.habitFeatures.title") : t("onboarding.habitFeatures.titleGeneric")}
      </StepTitle>
      <StepText>{t("onboarding.habitFeatures.why")}</StepText>
      <div className="flex flex-col gap-3">
        <FeatureRow
          icon={<Flame size={18} strokeWidth={1.75} fill="currentColor" style={{ color: flameColor }} />}
          title={t("onboarding.habitFeatures.streakTitle")}
        >
          {t("onboarding.habitFeatures.streakBody")}
        </FeatureRow>
        <FeatureRow
          icon={<LayoutGrid size={18} strokeWidth={1.75} className="text-primary" />}
          title={t("onboarding.habitFeatures.viewsTitle")}
        >
          {t("onboarding.habitFeatures.viewsBody")}
          <ViewSlider habits={examples} />
        </FeatureRow>
        <FeatureRow
          icon={<Folder size={18} strokeWidth={1.75} style={{ color: PALETTE_COLORS[6] }} />}
          title={t("onboarding.habitFeatures.blocksTitle")}
        >
          {t("onboarding.habitFeatures.blocksBody")}
          <div className="mt-2 flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-semibold text-foreground">
            <HabitIcon emoji="🌅" size={16} style={{ color: PALETTE_COLORS[6] }} />
            {t("onboarding.habitFeatures.blockExample")}
            <span className="ml-auto flex items-center gap-1 text-meta font-medium text-muted-foreground">
              {t("habits.group.habitCount", { count: 3 })}
              <ChevronDown size={14} />
            </span>
          </div>
        </FeatureRow>
      </div>
      <NavButtons ob={ob} />
    </>
  )
}

function Box({ done }: { done?: boolean }) {
  return (
    <span
      className={cn(
        "flex size-3.5 shrink-0 items-center justify-center rounded-[4px] border-[1.5px]",
        done ? "border-success bg-success text-white" : "border-border-strong",
      )}
    >
      {done && <Check size={10} strokeWidth={3} />}
    </span>
  )
}

export function GoalStructureStep({ ob }: StepProps) {
  const { t } = useLanguage()
  const color = ob.state.created.goalColor ?? PALETTE_COLORS[0]
  return (
    <>
      <StepTop counts={3} onSkip={ob.skip} />
      <StepTitle>{t("onboarding.goalStructure.title")}</StepTitle>
      <StepText>{t("onboarding.goalStructure.why")}</StepText>
      <div className="flex flex-col gap-3">
        <FeatureRow
          icon={<Check size={18} strokeWidth={2.25} className="text-success" />}
          title={t("onboarding.goalStructure.milestonesTitle")}
        >
          {t("onboarding.goalStructure.milestonesBody")}
        </FeatureRow>
        <FeatureRow
          icon={<Target size={18} strokeWidth={1.75} className="text-primary" />}
          title={t("onboarding.goalStructure.subgoalsTitle")}
        >
          {t("onboarding.goalStructure.subgoalsBody")}
        </FeatureRow>
      </div>
      <div className="flex flex-col gap-1.5 rounded-xl border border-border bg-sunken px-3 py-2.5 text-meta">
        <div className="flex justify-between gap-2 text-sm font-bold">
          {t("onboarding.goalStructure.exampleGoal")}
          <span className="tabular-nums" style={{ color }}>
            50%
          </span>
        </div>
        <GoalProgressBar percent={50} color={color} />
        <div className="mt-1 flex items-center gap-2">
          <Box done />
          {t("onboarding.goalStructure.exampleStep1")}
        </div>
        <div className="flex items-center gap-2">
          <Box />
          {t("onboarding.goalStructure.exampleStep2")}
        </div>
        <div className="flex items-center gap-2 font-semibold">
          {t("onboarding.goalStructure.exampleSubgoal")}
          <span className="ml-auto text-caption font-medium text-muted-foreground">
            {t("onboarding.goalStructure.exampleSubgoalMeta")}
          </span>
        </div>
        <div className="ml-5 flex items-center gap-2">
          <Box done />
          {t("onboarding.goalStructure.exampleSub1")}
        </div>
        <div className="ml-5 flex items-center gap-2">
          <Box />
          {t("onboarding.goalStructure.exampleSub2")}
        </div>
      </div>
      <StepText className="text-meta">{t("onboarding.goalStructure.exampleMath")}</StepText>
      <NavButtons ob={ob} />
    </>
  )
}

export function ToolsStep({ ob }: StepProps) {
  const { t } = useLanguage()
  const rows = [
    { Icon: StickyNote, title: t("onboarding.tools.notesTitle"), body: t("onboarding.tools.notesBody") },
    {
      Icon: CalendarDays,
      title: t("onboarding.tools.calendarTitle"),
      body: t("onboarding.tools.calendarBody"),
    },
    {
      Icon: BellRing,
      title: t("onboarding.tools.remindersTitle"),
      body: t("onboarding.tools.remindersBody"),
    },
  ]
  return (
    <>
      <StepTop label={t("onboarding.tools.eyebrow")} onSkip={ob.skip} />
      <StepTitle>{t("onboarding.tools.title")}</StepTitle>
      <div className="flex flex-col gap-3">
        {rows.map(({ Icon, title, body }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 * i + 0.1 }}
            className="flex items-start gap-3"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
              <Icon size={16} strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <div className="text-sm font-bold">{title}</div>
              <div className="text-meta text-muted-foreground">{body}</div>
            </div>
          </motion.div>
        ))}
      </div>
      <CreatedTray created={ob.state.created} />
      <NavButtons ob={ob} />
    </>
  )
}

export function FeedbackStep({ ob }: StepProps) {
  const { t } = useLanguage()
  return (
    <>
      <StepTop label={t("onboarding.feedback.eyebrow")} onSkip={ob.skip} />
      <StepIcon>
        <MessageSquare size={22} strokeWidth={1.75} />
      </StepIcon>
      <StepTitle>{t("onboarding.feedback.title")}</StepTitle>
      <StepText>{t("onboarding.feedback.body1")}</StepText>
      <StepText>{t("onboarding.feedback.body2")}</StepText>
      {/* Same look as widgets/feedback/FeedbackBanner — a picture of it, not the button itself. */}
      <motion.div
        initial={{ borderColor: "var(--border)" }}
        animate={{ borderColor: ["var(--border)", "var(--primary)", "var(--border)"] }}
        transition={{ duration: 1.6, delay: 0.4 }}
        className="rounded-lg border border-dashed px-4 py-2.5 text-center text-xs text-muted-foreground"
      >
        {t("feedback.bannerLabel")}
      </motion.div>
      <StepText>{t("onboarding.feedback.body3")}</StepText>
      <NavButtons ob={ob} nextLabel={t("onboarding.feedback.cta")} />
    </>
  )
}
