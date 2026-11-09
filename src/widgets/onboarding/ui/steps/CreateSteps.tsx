import { useState } from "react"
import { Check, Layers, Repeat, Target } from "lucide-react"
import { useCategories } from "@/entities/category"
import { useGoals } from "@/entities/goal"
import { HabitIcon, useHabits } from "@/entities/habit"
import { useHabitGroups } from "@/entities/habit-group"
import { useTasks } from "@/entities/task"
import { PALETTE_COLORS } from "@/shared/lib/colors"
import { formatDateKey, getTodayKey } from "@/shared/lib/date"
import { useLanguage, type TranslationKey } from "@/shared/lib/i18n"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { cn } from "@/shared/ui/utils"
import type { OnboardingController } from "../../model/useOnboarding"
import { CUSTOM_HABIT_ICON, HABIT_PRESETS, type HabitPresetKey } from "../../model/steps"
import { Choice, CreatedTray, FieldLabel, StepIcon, StepText, StepTitle, StepTop } from "../parts"

// The three screens where the person creates real records — through the
// same entity functions the normal forms use (addHabit, addTask, addGoal),
// so what lands on Today is exactly what the app would have made anyway.

type StepProps = { ob: OnboardingController }

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6]
const WEEKDAYS = [1, 2, 3, 4, 5]

function CreateButtons({
  ob,
  label,
  disabled,
  onCreate,
}: StepProps & { label: string; disabled: boolean; onCreate: () => void }) {
  const { t } = useLanguage()
  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" className="text-muted-foreground" onClick={ob.next}>
        {t("onboarding.skipStep")}
      </Button>
      <Button className="h-11 flex-1" disabled={disabled} onClick={onCreate}>
        {label}
      </Button>
    </div>
  )
}

const inputClass = "h-11 rounded-md bg-sunken"

export function HabitStep({ ob }: StepProps) {
  const { t } = useLanguage()
  const { addHabit } = useHabits()
  const { habitGroups } = useHabitGroups()
  const group = habitGroups.find(g => g.isGeneral) ?? habitGroups[0]
  const presetTitle = (key: HabitPresetKey) => t(`onboarding.habit.preset.${key}` as TranslationKey)
  const [preset, setPreset] = useState<HabitPresetKey | null>("water")
  const [title, setTitle] = useState(() => presetTitle("water"))
  const [weekdaysOnly, setWeekdaysOnly] = useState(false)
  const chosen = HABIT_PRESETS.find(p => p.key === preset)

  function pick(key: HabitPresetKey) {
    setPreset(key)
    setTitle(presetTitle(key))
  }

  function create() {
    const name = title.trim()
    if (!name || !group) return
    const icon = chosen?.icon ?? CUSTOM_HABIT_ICON
    const color = chosen?.color ?? PALETTE_COLORS[0]
    const habitId = addHabit({
      title: name,
      icon,
      color,
      activeDays: weekdaysOnly ? WEEKDAYS : ALL_DAYS,
      groupId: group.id,
    })
    ob.created({ habitId, habitTitle: name, habitIcon: icon, habitColor: color }, preset ?? "custom")
  }

  return (
    <>
      <StepTop counts={1} onSkip={ob.skip} />
      <StepIcon>
        <Repeat size={20} strokeWidth={1.75} />
      </StepIcon>
      <StepTitle>{t("onboarding.habit.title")}</StepTitle>
      <StepText>{t("onboarding.habit.why")}</StepText>
      {/* Always one row of four, on phones too: icon over the name. */}
      <div className="grid grid-cols-4 gap-1.5">
        {HABIT_PRESETS.map(p => (
          <button
            key={p.key}
            type="button"
            aria-pressed={preset === p.key}
            onClick={() => pick(p.key)}
            className={cn(
              "flex min-w-0 flex-col items-center gap-1.5 rounded-lg border px-1 pt-2.5 pb-2 text-meta font-semibold transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
              preset === p.key
                ? "border-primary bg-primary-soft"
                : "border-border bg-card hover:border-border-strong",
            )}
          >
            <HabitIcon emoji={p.icon} size={20} style={{ color: p.color }} />
            <span className="max-w-full truncate">{presetTitle(p.key)}</span>
          </button>
        ))}
      </div>
      <Input
        value={title}
        onChange={e => {
          setTitle(e.target.value)
          setPreset(null)
        }}
        onKeyDown={e => e.key === "Enter" && create()}
        placeholder={t("onboarding.habit.placeholder")}
        aria-label={t("onboarding.habit.placeholder")}
        className={inputClass}
      />
      <div className="flex flex-wrap gap-1.5">
        <Choice selected={!weekdaysOnly} onClick={() => setWeekdaysOnly(false)}>
          {t("onboarding.habit.everyDay")}
        </Choice>
        <Choice selected={weekdaysOnly} onClick={() => setWeekdaysOnly(true)}>
          {t("onboarding.habit.weekdays")}
        </Choice>
      </div>
      <CreatedTray created={ob.state.created} />
      <CreateButtons
        ob={ob}
        label={t("onboarding.habit.create")}
        disabled={!title.trim() || !group}
        onCreate={create}
      />
    </>
  )
}

type Due = "today" | "tomorrow" | "none"

function tomorrowKey(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return formatDateKey(d)
}

export function TaskStep({ ob }: StepProps) {
  const { t } = useLanguage()
  const { addTask } = useTasks()
  const { categories, addCategory } = useCategories()
  const [title, setTitle] = useState("")
  const [pickedCategory, setCategory] = useState("")
  // Categories may still be loading when the screen opens — default to the
  // first one as soon as they arrive, like TaskForm does.
  const category = pickedCategory || categories[0]?.name || ""
  const [addingCategory, setAddingCategory] = useState(false)
  const [newCategory, setNewCategory] = useState("")
  const [due, setDue] = useState<Due>("tomorrow")

  function saveCategory() {
    const name = newCategory.trim()
    if (!name) return
    if (!categories.some(c => c.name === name)) {
      addCategory(name, PALETTE_COLORS[categories.length % PALETTE_COLORS.length])
    }
    setCategory(name)
    setNewCategory("")
    setAddingCategory(false)
  }

  function create() {
    const name = title.trim()
    if (!name) return
    addTask({
      title: name,
      description: null,
      priority: "medium",
      category,
      dueDate: due === "today" ? getTodayKey() : due === "tomorrow" ? tomorrowKey() : null,
      completed: false,
    })
    ob.created({ taskTitle: name })
  }

  return (
    <>
      <StepTop counts={2} onSkip={ob.skip} />
      <StepIcon>
        <Layers size={20} strokeWidth={1.75} />
      </StepIcon>
      <StepTitle>{t("onboarding.task.title")}</StepTitle>
      <StepText>{t("onboarding.task.why")}</StepText>
      <Input
        autoFocus
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => e.key === "Enter" && create()}
        placeholder={t("onboarding.task.placeholder")}
        aria-label={t("onboarding.task.placeholder")}
        className={inputClass}
      />
      <FieldLabel>{t("onboarding.task.category")}</FieldLabel>
      <div className="flex flex-wrap gap-1.5">
        {categories.map(c => (
          <Choice key={c.id} selected={category === c.name} onClick={() => setCategory(c.name)}>
            <span className="size-2 rounded-full" style={{ backgroundColor: c.color }} />
            {c.name}
          </Choice>
        ))}
        {!addingCategory && (
          <Choice dashed onClick={() => setAddingCategory(true)}>
            {t("onboarding.task.addCategory")}
          </Choice>
        )}
      </div>
      {addingCategory && (
        <div className="flex gap-2">
          <Input
            autoFocus
            value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") saveCategory()
              if (e.key === "Escape") {
                e.stopPropagation()
                setAddingCategory(false)
              }
            }}
            placeholder={t("onboarding.task.newCategoryPlaceholder")}
            aria-label={t("onboarding.task.newCategoryPlaceholder")}
            className="h-10 rounded-md bg-sunken"
          />
          <Button
            size="icon"
            className="size-10 shrink-0"
            onClick={saveCategory}
            aria-label={t("onboarding.task.addCategory")}
          >
            <Check size={16} />
          </Button>
        </div>
      )}
      <StepText className="text-meta">{t("onboarding.task.categoryHint")}</StepText>
      <FieldLabel>{t("onboarding.task.due")}</FieldLabel>
      <div className="flex flex-wrap gap-1.5">
        <Choice selected={due === "today"} onClick={() => setDue("today")}>
          {t("onboarding.task.today")}
        </Choice>
        <Choice selected={due === "tomorrow"} onClick={() => setDue("tomorrow")}>
          {t("onboarding.task.tomorrow")}
        </Choice>
        <Choice selected={due === "none"} onClick={() => setDue("none")}>
          {t("onboarding.task.noDue")}
        </Choice>
      </div>
      <CreatedTray created={ob.state.created} />
      <CreateButtons ob={ob} label={t("onboarding.task.create")} disabled={!title.trim()} onCreate={create} />
    </>
  )
}

type GoalTarget = "month" | "threeMonths" | "none"

function monthsFromNow(months: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() + months)
  return formatDateKey(d)
}

export function GoalStep({ ob }: StepProps) {
  const { t } = useLanguage()
  const { addGoal } = useGoals()
  const [title, setTitle] = useState("")
  const [firstStep, setFirstStep] = useState("")
  const [target, setTarget] = useState<GoalTarget>("threeMonths")

  function create() {
    const name = title.trim()
    if (!name) return
    const color = PALETTE_COLORS[0]
    const step = firstStep.trim()
    addGoal(
      {
        title: name,
        description: "",
        targetDate:
          target === "month" ? monthsFromNow(1) : target === "threeMonths" ? monthsFromNow(3) : null,
        color,
        category: null,
      },
      step ? [step] : [],
    )
    ob.created({ goalTitle: name, goalColor: color })
  }

  return (
    <>
      <StepTop counts={3} onSkip={ob.skip} />
      <StepIcon>
        <Target size={20} strokeWidth={1.75} />
      </StepIcon>
      <StepTitle>{t("onboarding.goal.title")}</StepTitle>
      <StepText>{t("onboarding.goal.why")}</StepText>
      <Input
        autoFocus
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => e.key === "Enter" && create()}
        placeholder={t("onboarding.goal.placeholder")}
        aria-label={t("onboarding.goal.placeholder")}
        className={inputClass}
      />
      <Input
        value={firstStep}
        onChange={e => setFirstStep(e.target.value)}
        onKeyDown={e => e.key === "Enter" && create()}
        placeholder={t("onboarding.goal.stepPlaceholder")}
        aria-label={t("onboarding.goal.stepPlaceholder")}
        className={inputClass}
      />
      <FieldLabel>{t("onboarding.goal.target")}</FieldLabel>
      <div className="flex flex-wrap gap-1.5">
        <Choice selected={target === "month"} onClick={() => setTarget("month")}>
          {t("onboarding.goal.month")}
        </Choice>
        <Choice selected={target === "threeMonths"} onClick={() => setTarget("threeMonths")}>
          {t("onboarding.goal.threeMonths")}
        </Choice>
        <Choice selected={target === "none"} onClick={() => setTarget("none")}>
          {t("onboarding.goal.noTarget")}
        </Choice>
      </div>
      <CreatedTray created={ob.state.created} />
      <CreateButtons ob={ob} label={t("onboarding.goal.create")} disabled={!title.trim()} onCreate={create} />
    </>
  )
}
