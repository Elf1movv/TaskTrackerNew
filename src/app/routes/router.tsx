import { createBrowserRouter, Navigate } from "react-router"
import { ForgotPasswordPage, LoginPage, RegisterPage, ResetPasswordPage } from "@/pages/auth"
import { CalendarPage } from "@/pages/calendar"
import { GoalsPage } from "@/pages/goals"
import { HabitsPage } from "@/pages/habits"
import { TasksPage } from "@/pages/tasks"
import { TodayPage } from "@/pages/today"
import { RootLayout } from "../layouts/RootLayout"
import { RouteErrorPage } from "./RouteErrorPage"

// One pathless parent route only to give every page the same `errorElement`:
// a crash anywhere shows our RouteErrorPage instead of React Router's default.
export const router = createBrowserRouter([
  {
    errorElement: <RouteErrorPage />,
    children: [
      // Outside RootLayout on purpose — these render without the sidebar/nav
      // chrome, and RootLayout itself is what redirects here when logged out.
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      { path: "forgot-password", element: <ForgotPasswordPage /> },
      { path: "reset-password", element: <ResetPasswordPage /> },
      {
        element: <RootLayout />,
        children: [
          { index: true, element: <Navigate to="/today" replace /> },
          { path: "today", element: <TodayPage /> },
          { path: "tasks", element: <TasksPage /> },
          { path: "goals", element: <GoalsPage /> },
          { path: "habits", element: <HabitsPage /> },
          { path: "calendar", element: <CalendarPage /> },
          { path: "*", element: <Navigate to="/today" replace /> },
        ],
      },
    ],
  },
])
