import { addDays, format } from "date-fns"
import type { Habit } from "../model/habit"

export const seedHabits: Habit[] = [
  {
    id: "h1",
    title: "Morning meditation",
    icon: "🧘",
    color: "#7b6bc9",
    completedDates: Array.from({ length: 12 }, (_, i) => format(addDays(new Date(), -(i + 1)), "yyyy-MM-dd")),
  },
  {
    id: "h2",
    title: "Exercise 30 min",
    icon: "🏃",
    color: "#6a9c74",
    completedDates: [
      ...Array.from({ length: 7 }, (_, i) => format(addDays(new Date(), -(i + 1)), "yyyy-MM-dd")),
      format(addDays(new Date(), -9), "yyyy-MM-dd"),
    ],
  },
  {
    id: "h3",
    title: "Read before bed",
    icon: "📖",
    color: "#c97b3a",
    completedDates: Array.from({ length: 5 }, (_, i) => format(addDays(new Date(), -(i + 1)), "yyyy-MM-dd")),
  },
  {
    id: "h4",
    title: "No social media before noon",
    icon: "🔕",
    color: "#c9503a",
    completedDates: Array.from({ length: 21 }, (_, i) => format(addDays(new Date(), -(i + 1)), "yyyy-MM-dd")),
  },
]
