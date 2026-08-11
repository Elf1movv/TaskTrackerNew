import type { Goal } from "../model/types"

export const seedGoals: Goal[] = [
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
