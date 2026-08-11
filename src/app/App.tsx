import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import {
  Plus, Target, CalendarDays, Layers, Trash2,
  ChevronLeft, ChevronRight, Flame, Check,
} from "lucide-react"
import {
  format, addDays, startOfMonth, endOfMonth,
  eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, getDay,
} from "date-fns"

// ── Types ─────────────────────────────────────────────────────────────────────

type Priority = "low" | "medium" | "high"
type View = "today" | "tasks" | "goals" | "calendar"

interface Task {
  id: string
  title: string
  completed: boolean
  priority: Priority
  category: string
  dueDate: string | null
}

interface Milestone {
  id: string
  title: string
  completed: boolean
}

interface Goal {
  id: string
  title: string
  description: string
  progress: number
  targetDate: string
  milestones: Milestone[]
  color: string
}

interface Habit {
  id: string
  title: string
  completedDates: string[]
  icon: string
  color: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TODAY = format(new Date(), "yyyy-MM-dd")

const PRIORITY_COLORS: Record<Priority, string> = {
  low: "#6a9c74",
  medium: "#c97b3a",
  high: "#c9503a",
}

// font shorthand helpers for inline styles
const MF: React.CSSProperties = { fontFamily: "var(--font-mono)" }
const DF: React.CSSProperties = { fontFamily: "var(--font-display)" }

// ── Initial Data ──────────────────────────────────────────────────────────────

const INIT_TASKS: Task[] = [
  { id: "t1", title: "Review Q3 performance metrics", completed: false, priority: "high", category: "Work", dueDate: TODAY },
  { id: "t2", title: "Plan weekend hiking trip", completed: false, priority: "medium", category: "Personal", dueDate: TODAY },
  { id: "t3", title: "Read 30 pages of Deep Work", completed: true, priority: "low", category: "Learning", dueDate: TODAY },
  { id: "t4", title: "Update portfolio website", completed: false, priority: "high", category: "Work", dueDate: format(addDays(new Date(), 2), "yyyy-MM-dd") },
  { id: "t5", title: "Schedule dentist appointment", completed: true, priority: "medium", category: "Health", dueDate: format(addDays(new Date(), -1), "yyyy-MM-dd") },
  { id: "t6", title: "Write weekly team newsletter", completed: false, priority: "medium", category: "Work", dueDate: format(addDays(new Date(), 3), "yyyy-MM-dd") },
  { id: "t7", title: "Meal prep for the week", completed: false, priority: "low", category: "Health", dueDate: format(addDays(new Date(), 1), "yyyy-MM-dd") },
]

const INIT_GOALS: Goal[] = [
  {
    id: "g1",
    title: "Launch personal SaaS product",
    description: "Build and ship a productivity tool by end of Q4 2026",
    progress: 42,
    targetDate: "2026-12-31",
    color: "#c97b3a",
    milestones: [
      { id: "m1", title: "Finalize product specification", completed: true },
      { id: "m2", title: "Build and test MVP", completed: true },
      { id: "m3", title: "Beta testing with 10 users", completed: false },
      { id: "m4", title: "Public launch and marketing push", completed: false },
    ],
  },
  {
    id: "g2",
    title: "Run a half marathon",
    description: "Complete a 21km race — current long run is 14km",
    progress: 65,
    targetDate: "2026-10-15",
    color: "#6a9c74",
    milestones: [
      { id: "m5", title: "Run 5km without stopping", completed: true },
      { id: "m6", title: "Complete first 10km race", completed: true },
      { id: "m7", title: "Hit 15km in a training run", completed: true },
      { id: "m8", title: "Finish the half marathon", completed: false },
    ],
  },
  {
    id: "g3",
    title: "Read 24 books this year",
    description: "Two books per month — currently at 14 of 24",
    progress: 58,
    targetDate: "2026-12-31",
    color: "#7b6bc9",
    milestones: [
      { id: "m9", title: "First 6 books — Q1 complete", completed: true },
      { id: "m10", title: "12 books — mid-year checkpoint", completed: true },
      { id: "m11", title: "18 books by end of September", completed: false },
      { id: "m12", title: "24 books — year complete", completed: false },
    ],
  },
]

const INIT_HABITS: Habit[] = [
  {
    id: "h1", title: "Morning meditation", icon: "🧘", color: "#7b6bc9",
    completedDates: Array.from({ length: 12 }, (_, i) => format(addDays(new Date(), -(i + 1)), "yyyy-MM-dd")),
  },
  {
    id: "h2", title: "Exercise 30 min", icon: "🏃", color: "#6a9c74",
    completedDates: [
      ...Array.from({ length: 7 }, (_, i) => format(addDays(new Date(), -(i + 1)), "yyyy-MM-dd")),
      format(addDays(new Date(), -9), "yyyy-MM-dd"),
    ],
  },
  {
    id: "h3", title: "Read before bed", icon: "📖", color: "#c97b3a",
    completedDates: Array.from({ length: 5 }, (_, i) => format(addDays(new Date(), -(i + 1)), "yyyy-MM-dd")),
  },
  {
    id: "h4", title: "No social media before noon", icon: "🔕", color: "#c9503a",
    completedDates: Array.from({ length: 21 }, (_, i) => format(addDays(new Date(), -(i + 1)), "yyyy-MM-dd")),
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function genId(): string {
  return Math.random().toString(36).slice(2, 9)
}

function getStreak(dates: string[]): number {
  const set = new Set(dates)
  let streak = 0
  let day = new Date()
  if (set.has(format(day, "yyyy-MM-dd"))) {
    streak = 1
    day = addDays(day, -1)
  } else {
    day = addDays(day, -1)
  }
  while (set.has(format(day, "yyyy-MM-dd"))) {
    streak++
    day = addDays(day, -1)
  }
  return streak
}

const NAV_ITEMS: { id: View; label: string; Icon: React.ElementType }[] = [
  { id: "today", label: "Today", Icon: Flame },
  { id: "tasks", label: "Tasks", Icon: Layers },
  { id: "goals", label: "Goals", Icon: Target },
  { id: "calendar", label: "Calendar", Icon: CalendarDays },
]

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState<View>("today")
  const [tasks, setTasks] = useState<Task[]>(INIT_TASKS)
  const [goals, setGoals] = useState<Goal[]>(INIT_GOALS)
  const [habits, setHabits] = useState<Habit[]>(INIT_HABITS)
  const [calMonth, setCalMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date>(new Date())

  const toggleTask = (id: string) =>
    setTasks(ts => ts.map(t => t.id === id ? { ...t, completed: !t.completed } : t))

  const deleteTask = (id: string) =>
    setTasks(ts => ts.filter(t => t.id !== id))

  const addTask = (task: Omit<Task, "id">) =>
    setTasks(ts => [{ ...task, id: genId() }, ...ts])

  const toggleMilestone = (goalId: string, milId: string) =>
    setGoals(gs => gs.map(g => {
      if (g.id !== goalId) return g
      const milestones = g.milestones.map(m => m.id === milId ? { ...m, completed: !m.completed } : m)
      const progress = Math.round((milestones.filter(m => m.completed).length / milestones.length) * 100)
      return { ...g, milestones, progress }
    }))

  const toggleHabit = (id: string, date: string) =>
    setHabits(hs => hs.map(h => {
      if (h.id !== id) return h
      const has = h.completedDates.includes(date)
      return { ...h, completedDates: has ? h.completedDates.filter(d => d !== date) : [...h.completedDates, date] }
    }))

  const todayTasks = tasks.filter(t => t.dueDate === TODAY)

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 lg:w-60 shrink-0 flex-col border-r border-border bg-card">
        <div className="px-5 py-5 border-b border-border">
          <div className="text-[10px] tracking-[0.22em] uppercase text-muted-foreground mb-1.5" style={MF}>
            Momentum
          </div>
          <div className="text-lg leading-tight" style={DF}>
            {format(new Date(), "MMMM yyyy")}
          </div>
        </div>

        <nav className="flex-1 p-2.5 space-y-0.5">
          {NAV_ITEMS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                view === id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <Icon size={15} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-border space-y-2">
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-3" style={MF}>
            Today
          </div>
          {[
            { label: "Tasks done", val: `${todayTasks.filter(t => t.completed).length} / ${todayTasks.length}` },
            { label: "Habits", val: `${habits.filter(h => h.completedDates.includes(TODAY)).length} / ${habits.length}` },
            { label: "Active goals", val: String(goals.length) },
          ].map(({ label, val }) => (
            <div key={label} className="flex justify-between items-center py-0.5">
              <span className="text-xs text-muted-foreground">{label}</span>
              <span className="text-xs" style={MF}>{val}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <AnimatePresence mode="wait">
          {view === "today" && (
            <TodayView
              key="today"
              todayTasks={todayTasks}
              habits={habits}
              goals={goals}
              toggleTask={toggleTask}
              toggleHabit={toggleHabit}
            />
          )}
          {view === "tasks" && (
            <TasksView
              key="tasks"
              tasks={tasks}
              toggleTask={toggleTask}
              deleteTask={deleteTask}
              addTask={addTask}
            />
          )}
          {view === "goals" && (
            <GoalsView
              key="goals"
              goals={goals}
              toggleMilestone={toggleMilestone}
            />
          )}
          {view === "calendar" && (
            <CalendarView
              key="calendar"
              tasks={tasks}
              calMonth={calMonth}
              setCalMonth={setCalMonth}
              selectedDay={selectedDay}
              setSelectedDay={setSelectedDay}
              toggleTask={toggleTask}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex z-50">
        {NAV_ITEMS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setView(id)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
              view === id ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Icon size={18} />
            <span className="text-[10px]" style={MF}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── TodayView ─────────────────────────────────────────────────────────────────

function TodayView({
  todayTasks,
  habits,
  goals,
  toggleTask,
  toggleHabit,
}: {
  todayTasks: Task[]
  habits: Habit[]
  goals: Goal[]
  toggleTask: (id: string) => void
  toggleHabit: (id: string, date: string) => void
}) {
  const done = todayTasks.filter(t => t.completed).length
  const pct = todayTasks.length ? Math.round((done / todayTasks.length) * 100) : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22 }}
      className="p-6 md:p-10 max-w-4xl mx-auto"
    >
      {/* Hero date */}
      <div className="mb-10">
        <div className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-3" style={MF}>
          {format(new Date(), "EEEE")}
        </div>
        <div className="flex items-baseline gap-5">
          <span className="text-8xl font-bold leading-none tracking-tight" style={DF}>
            {format(new Date(), "d")}
          </span>
          <span className="text-muted-foreground" style={MF}>
            {format(new Date(), "MMMM yyyy")}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {/* Today tasks card */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground" style={MF}>
              Today's Tasks
            </span>
            <span className="text-sm" style={{ ...MF, color: "var(--primary)" }}>
              {done}/{todayTasks.length} done
            </span>
          </div>

          {/* Progress bar */}
          <div className="relative h-1 bg-muted rounded-full overflow-hidden mb-6">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ backgroundColor: "var(--primary)" }}
              initial={{ width: "0%" }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            />
          </div>

          <div className="space-y-3.5">
            {todayTasks.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">No tasks for today</p>
            )}
            {todayTasks.map(task => (
              <button
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className="w-full flex items-center gap-3 group text-left"
              >
                <div
                  className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    task.completed
                      ? "border-primary bg-primary"
                      : "border-border group-hover:border-primary/40"
                  }`}
                >
                  {task.completed && (
                    <Check size={10} strokeWidth={3} className="text-primary-foreground" />
                  )}
                </div>
                <span
                  className={`text-sm flex-1 leading-snug transition-colors ${
                    task.completed ? "line-through text-muted-foreground" : ""
                  }`}
                >
                  {task.title}
                </span>
                <span className="text-xs text-muted-foreground px-2 py-0.5 rounded bg-muted hidden sm:inline shrink-0">
                  {task.category}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Goals summary */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground mb-5" style={MF}>
            Goal Progress
          </div>
          <div className="space-y-5">
            {goals.map(goal => (
              <div key={goal.id}>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs leading-snug flex-1 pr-2 line-clamp-2">{goal.title}</span>
                  <span className="text-xs shrink-0" style={{ ...MF, color: goal.color }}>
                    {goal.progress}%
                  </span>
                </div>
                <div className="h-0.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${goal.progress}%`, backgroundColor: goal.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Habits */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground mb-5" style={MF}>
          Habits
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {habits.map(habit => {
            const doneToday = habit.completedDates.includes(TODAY)
            const streak = getStreak(habit.completedDates)
            return (
              <button
                key={habit.id}
                onClick={() => toggleHabit(habit.id, TODAY)}
                className="p-4 rounded-xl border text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={
                  doneToday
                    ? { borderColor: habit.color + "55", backgroundColor: habit.color + "18" }
                    : { borderColor: "var(--border)" }
                }
              >
                <div className="text-2xl mb-2 leading-none">{habit.icon}</div>
                <div className="text-xs font-medium leading-snug mb-2.5 line-clamp-2">
                  {habit.title}
                </div>
                <div
                  className="flex items-center gap-1"
                  style={{ color: streak > 0 ? habit.color : "var(--muted-foreground)" }}
                >
                  <Flame size={11} />
                  <span className="text-xs" style={MF}>{streak}</span>
                  <span className="text-xs text-muted-foreground">days</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}

// ── TasksView ─────────────────────────────────────────────────────────────────

function TasksView({
  tasks,
  toggleTask,
  deleteTask,
  addTask,
}: {
  tasks: Task[]
  toggleTask: (id: string) => void
  deleteTask: (id: string) => void
  addTask: (task: Omit<Task, "id">) => void
}) {
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "done">("all")
  const [catFilter, setCatFilter] = useState("all")
  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newPriority, setNewPriority] = useState<Priority>("medium")
  const [newCat, setNewCat] = useState("Work")
  const [newDate, setNewDate] = useState(TODAY)

  const CATEGORIES = ["Work", "Personal", "Health", "Learning"]

  const filtered = tasks.filter(t => {
    if (statusFilter === "active" && t.completed) return false
    if (statusFilter === "done" && !t.completed) return false
    if (catFilter !== "all" && t.category !== catFilter) return false
    return true
  })

  function handleAdd() {
    if (!newTitle.trim()) return
    addTask({
      title: newTitle.trim(),
      completed: false,
      priority: newPriority,
      category: newCat,
      dueDate: newDate || null,
    })
    setNewTitle("")
    setAdding(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22 }}
      className="p-6 md:p-10 max-w-3xl mx-auto"
    >
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl mb-1" style={DF}>Tasks</h1>
          <p className="text-sm text-muted-foreground" style={MF}>
            {tasks.filter(t => !t.completed).length} remaining · {tasks.filter(t => t.completed).length} done
          </p>
        </div>
        <button
          onClick={() => setAdding(v => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm hover:opacity-90 transition-opacity"
        >
          <Plus size={14} />
          Add task
        </button>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {adding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden mb-6"
          >
            <div className="bg-card border border-primary/25 rounded-2xl p-5 space-y-4">
              <input
                autoFocus
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAdd()}
                placeholder="What needs to be done?"
                className="w-full bg-transparent text-foreground placeholder:text-muted-foreground border-b border-border pb-2.5 outline-none text-sm"
              />
              <div className="flex gap-4 flex-wrap items-center">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Priority</span>
                  {(["low", "medium", "high"] as Priority[]).map(p => (
                    <button
                      key={p}
                      onClick={() => setNewPriority(p)}
                      className="px-2.5 py-1 rounded-lg text-xs capitalize transition-all border"
                      style={
                        newPriority === p
                          ? { backgroundColor: PRIORITY_COLORS[p] + "28", borderColor: PRIORITY_COLORS[p], color: PRIORITY_COLORS[p] }
                          : { borderColor: "var(--border)", color: "var(--muted-foreground)" }
                      }
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Category</span>
                  <select
                    value={newCat}
                    onChange={e => setNewCat(e.target.value)}
                    className="text-xs px-2 py-1 rounded-lg outline-none border border-border bg-muted text-foreground"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Due</span>
                  <input
                    type="date"
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    className="text-xs px-2 py-1 rounded-lg outline-none border border-border bg-muted text-foreground"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <button
                  onClick={() => setAdding(false)}
                  className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  className="px-4 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                >
                  Add task
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex gap-1.5 mb-6 flex-wrap items-center">
        {(["all", "active", "done"] as const).map(f => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs capitalize transition-all ${
              statusFilter === f
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            {f}
          </button>
        ))}
        <div className="w-px h-4 bg-border mx-0.5" />
        {["all", ...CATEGORIES].map(c => (
          <button
            key={c}
            onClick={() => setCatFilter(c)}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
              catFilter === c
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="space-y-1.5">
        <AnimatePresence initial={false}>
          {filtered.map(task => (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 20, transition: { duration: 0.12 } }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-card border border-border group hover:border-primary/20 transition-colors"
            >
              <button onClick={() => toggleTask(task.id)} className="shrink-0">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    task.completed
                      ? "border-primary bg-primary"
                      : "border-border group-hover:border-primary/40"
                  }`}
                >
                  {task.completed && (
                    <Check size={10} strokeWidth={3} className="text-primary-foreground" />
                  )}
                </div>
              </button>
              <div className="flex-1 min-w-0">
                <div
                  className={`text-sm leading-snug ${
                    task.completed ? "line-through text-muted-foreground" : ""
                  }`}
                >
                  {task.title}
                </div>
                {task.dueDate && (
                  <div className="text-xs text-muted-foreground mt-0.5" style={MF}>
                    {task.dueDate === TODAY ? "Today" : task.dueDate}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
                  title={task.priority}
                />
                <span className="text-xs text-muted-foreground px-2 py-0.5 rounded bg-muted hidden sm:inline">
                  {task.category}
                </span>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-destructive transition-all"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground text-sm">
            No tasks{statusFilter !== "all" ? ` marked as ${statusFilter}` : ""}
            {catFilter !== "all" ? ` in ${catFilter}` : ""}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ── GoalsView ─────────────────────────────────────────────────────────────────

function GoalsView({
  goals,
  toggleMilestone,
}: {
  goals: Goal[]
  toggleMilestone: (goalId: string, milId: string) => void
}) {
  const [expanded, setExpanded] = useState<string | null>(goals[0]?.id ?? null)

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22 }}
      className="p-6 md:p-10 max-w-3xl mx-auto"
    >
      <div className="mb-8">
        <h1 className="text-3xl mb-1" style={DF}>Goals</h1>
        <p className="text-sm text-muted-foreground">Long-term objectives and milestones</p>
      </div>

      <div className="space-y-4">
        {goals.map(goal => {
          const isOpen = expanded === goal.id
          const completedCount = goal.milestones.filter(m => m.completed).length

          return (
            <div
              key={goal.id}
              className="bg-card rounded-2xl overflow-hidden transition-all duration-200"
              style={{
                border: `1px solid ${isOpen ? goal.color + "44" : "var(--border)"}`,
              }}
            >
              <button
                onClick={() => setExpanded(isOpen ? null : goal.id)}
                className="w-full p-6 text-left"
              >
                <div className="flex items-start gap-4">
                  {/* Progress ring */}
                  <div className="shrink-0 relative w-[52px] h-[52px]">
                    <svg
                      className="w-[52px] h-[52px]"
                      style={{ transform: "rotate(-90deg)" }}
                      viewBox="0 0 52 52"
                    >
                      <circle cx="26" cy="26" r="20" fill="none" strokeWidth="3" stroke="var(--muted)" />
                      <circle
                        cx="26" cy="26" r="20" fill="none" strokeWidth="3"
                        stroke={goal.color}
                        strokeDasharray={`${2 * Math.PI * 20}`}
                        strokeDashoffset={`${2 * Math.PI * 20 * (1 - goal.progress / 100)}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span
                      className="absolute inset-0 flex items-center justify-center text-[10px]"
                      style={{ ...MF, color: goal.color }}
                    >
                      {goal.progress}%
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base leading-snug pr-2" style={DF}>
                        {goal.title}
                      </h3>
                      <ChevronRight
                        size={15}
                        className="shrink-0 mt-0.5 text-muted-foreground transition-transform duration-200"
                        style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                      {goal.description}
                    </p>
                    <div className="flex gap-4 mt-3">
                      <span className="text-xs" style={{ ...MF, color: goal.color }}>
                        {completedCount}/{goal.milestones.length} milestones
                      </span>
                      <span className="text-xs text-muted-foreground" style={MF}>
                        Due {format(new Date(goal.targetDate + "T00:00:00"), "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>
                </div>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div
                      className="border-t px-6 py-5"
                      style={{ borderColor: goal.color + "28" }}
                    >
                      <div
                        className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-4"
                        style={MF}
                      >
                        Milestones
                      </div>
                      <div className="space-y-3">
                        {goal.milestones.map((m, idx) => (
                          <button
                            key={m.id}
                            onClick={() => toggleMilestone(goal.id, m.id)}
                            className="w-full flex items-center gap-3 group text-left"
                          >
                            <div
                              className="shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
                              style={
                                m.completed
                                  ? { backgroundColor: goal.color, borderColor: goal.color }
                                  : { borderColor: "var(--border)" }
                              }
                            >
                              {m.completed && (
                                <Check size={9} strokeWidth={3} style={{ color: "white" }} />
                              )}
                            </div>
                            <span
                              className={`text-sm flex-1 leading-snug ${
                                m.completed ? "line-through text-muted-foreground" : ""
                              }`}
                            >
                              {m.title}
                            </span>
                            <span className="text-xs text-muted-foreground" style={MF}>
                              #{idx + 1}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

// ── CalendarView ──────────────────────────────────────────────────────────────

function CalendarView({
  tasks,
  calMonth,
  setCalMonth,
  selectedDay,
  setSelectedDay,
  toggleTask,
}: {
  tasks: Task[]
  calMonth: Date
  setCalMonth: React.Dispatch<React.SetStateAction<Date>>
  selectedDay: Date
  setSelectedDay: (d: Date) => void
  toggleTask: (id: string) => void
}) {
  const monthStart = startOfMonth(calMonth)
  const monthEnd = endOfMonth(calMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startPad = getDay(monthStart)

  const selectedStr = format(selectedDay, "yyyy-MM-dd")
  const selectedTasks = tasks.filter(t => t.dueDate === selectedStr)

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22 }}
      className="p-6 md:p-10 max-w-5xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl" style={DF}>
          {format(calMonth, "MMMM yyyy")}
        </h1>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCalMonth(d => subMonths(d, 1))}
            className="p-2 rounded-xl hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => {
              setCalMonth(new Date())
              setSelectedDay(new Date())
            }}
            className="px-3 py-1.5 text-xs rounded-xl hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            style={MF}
          >
            Today
          </button>
          <button
            onClick={() => setCalMonth(d => addMonths(d, 1))}
            className="p-2 rounded-xl hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5">
        {/* Calendar grid */}
        <div>
          <div className="grid grid-cols-7 mb-1">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
              <div
                key={d}
                className="text-center text-[10px] text-muted-foreground py-2 uppercase tracking-wider"
                style={MF}
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startPad }, (_, i) => <div key={`pad-${i}`} />)}
            {days.map(day => {
              const dayStr = format(day, "yyyy-MM-dd")
              const dayTasks = tasks.filter(t => t.dueDate === dayStr)
              const isSelected = isSameDay(day, selectedDay)
              const isCurrent = isToday(day)

              return (
                <button
                  key={dayStr}
                  onClick={() => setSelectedDay(day)}
                  className={`aspect-square rounded-xl flex flex-col items-center pt-2 text-sm transition-all ${
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : isCurrent
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-accent text-foreground"
                  }`}
                >
                  <span className="text-xs" style={MF}>
                    {format(day, "d")}
                  </span>
                  {dayTasks.length > 0 && (
                    <div className="flex gap-0.5 mt-1.5 flex-wrap justify-center px-1">
                      {dayTasks.slice(0, 3).map(t => (
                        <div
                          key={t.id}
                          className="w-1 h-1 rounded-full"
                          style={{
                            backgroundColor: isSelected
                              ? "rgba(255,255,255,0.65)"
                              : PRIORITY_COLORS[t.priority],
                          }}
                        />
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Day detail panel */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="mb-5">
            <div
              className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-1"
              style={MF}
            >
              {format(selectedDay, "EEEE")}
            </div>
            <div className="text-2xl" style={DF}>
              {format(selectedDay, "MMMM d")}
            </div>
          </div>

          {selectedTasks.length > 0 ? (
            <div className="space-y-3">
              {selectedTasks.map(task => (
                <button
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className="w-full flex items-center gap-2.5 group text-left"
                >
                  <div
                    className={`shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                      task.completed
                        ? "border-primary bg-primary"
                        : "border-border group-hover:border-primary/40"
                    }`}
                  >
                    {task.completed && (
                      <Check size={8} strokeWidth={3} className="text-primary-foreground" />
                    )}
                  </div>
                  <span
                    className={`text-sm flex-1 text-left leading-snug ${
                      task.completed ? "line-through text-muted-foreground" : ""
                    }`}
                  >
                    {task.title}
                  </span>
                  <div
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
                  />
                </button>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground text-center py-8">
              No tasks scheduled
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
