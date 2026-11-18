import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from "react"
import { createBrowserRouter, Navigate } from "react-router"
import { RootLayout } from "../layouts/RootLayout"
import { RouteErrorPage } from "./RouteErrorPage"

// Each screen is its own file, loaded the first time it's opened (speed
// iteration 2026-11-18, docs/PERFORMANCE.md): a phone used to download the
// code of every screen before showing the first one. The files of all screens
// are still kept on the phone in the background by the service worker
// (vite.config.ts lists them in index.html, public/sw.js keeps them).
function lazyPage<M>(load: () => Promise<M>, pick: (m: M) => ComponentType) {
  return lazy(() => load().then(m => ({ default: pick(m) })))
}
const LoginPage = lazyPage(
  () => import("@/pages/auth"),
  m => m.LoginPage,
)
const RegisterPage = lazyPage(
  () => import("@/pages/auth"),
  m => m.RegisterPage,
)
const ForgotPasswordPage = lazyPage(
  () => import("@/pages/auth"),
  m => m.ForgotPasswordPage,
)
const ResetPasswordPage = lazyPage(
  () => import("@/pages/auth"),
  m => m.ResetPasswordPage,
)
const CalendarPage = lazyPage(
  () => import("@/pages/calendar"),
  m => m.CalendarPage,
)
const GoalsPage = lazyPage(
  () => import("@/pages/goals"),
  m => m.GoalsPage,
)
const HabitDetailPage = lazyPage(
  () => import("@/pages/habit"),
  m => m.HabitDetailPage,
)
const HabitsPage = lazyPage(
  () => import("@/pages/habits"),
  m => m.HabitsPage,
)
const TasksPage = lazyPage(
  () => import("@/pages/tasks"),
  m => m.TasksPage,
)
const TodayPage = lazyPage(
  () => import("@/pages/today"),
  m => m.TodayPage,
)

// Nothing while a screen's file arrives (a fraction of a second; the splash
// covers the very first one).
function page(Page: LazyExoticComponent<ComponentType>) {
  return (
    <Suspense fallback={null}>
      <Page />
    </Suspense>
  )
}

// One pathless parent route only to give every page the same `errorElement`:
// a crash anywhere shows our RouteErrorPage instead of React Router's default.
export const router = createBrowserRouter([
  {
    errorElement: <RouteErrorPage />,
    children: [
      // Outside RootLayout on purpose — these render without the sidebar/nav
      // chrome, and RootLayout itself is what redirects here when logged out.
      { path: "login", element: page(LoginPage) },
      { path: "register", element: page(RegisterPage) },
      { path: "forgot-password", element: page(ForgotPasswordPage) },
      { path: "reset-password", element: page(ResetPasswordPage) },
      {
        element: <RootLayout />,
        children: [
          { index: true, element: <Navigate to="/today" replace /> },
          { path: "today", element: page(TodayPage) },
          { path: "tasks", element: page(TasksPage) },
          { path: "goals", element: page(GoalsPage) },
          { path: "habits", element: page(HabitsPage) },
          { path: "habits/:habitId", element: page(HabitDetailPage) },
          { path: "calendar", element: page(CalendarPage) },
          { path: "*", element: <Navigate to="/today" replace /> },
        ],
      },
    ],
  },
])
