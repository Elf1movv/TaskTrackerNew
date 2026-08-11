import { createBrowserRouter, Navigate } from "react-router"
import { CalendarPage } from "@/pages/calendar"
import { GoalsPage } from "@/pages/goals"
import { TasksPage } from "@/pages/tasks"
import { TodayPage } from "@/pages/today"
import { RootLayout } from "../layouts/RootLayout"

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { index: true, element: <Navigate to="/today" replace /> },
      { path: "today", element: <TodayPage /> },
      { path: "tasks", element: <TasksPage /> },
      { path: "goals", element: <GoalsPage /> },
      { path: "calendar", element: <CalendarPage /> },
      { path: "*", element: <Navigate to="/today" replace /> },
    ],
  },
])
