import { cleanup, render, screen } from "@testing-library/react"
import { createMemoryRouter, RouterProvider } from "react-router"
import { afterEach, describe, expect, it, vi } from "vitest"
import { RouteErrorPage } from "./RouteErrorPage"

function Broken(): never {
  throw new Error("boom")
}

function renderCrash(lang: string) {
  document.documentElement.lang = lang
  const router = createMemoryRouter([{ path: "/", element: <Broken />, errorElement: <RouteErrorPage /> }])
  render(<RouterProvider router={router} />)
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe("RouteErrorPage", () => {
  it("replaces React Router's default error screen with our own, in Russian", () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    vi.spyOn(console, "warn").mockImplementation(() => {})
    renderCrash("ru")
    expect(screen.getByText("Что-то пошло не так")).toBeTruthy()
    expect(screen.getByRole("button", { name: "Обновить" })).toBeTruthy()
    expect(screen.queryByText(/Unexpected Application Error/)).toBeNull()
  })

  it("follows the interface language from <html lang>", () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    vi.spyOn(console, "warn").mockImplementation(() => {})
    renderCrash("en")
    expect(screen.getByText("Something went wrong")).toBeTruthy()
    expect(screen.getByRole("link", { name: "Go to Today" }).getAttribute("href")).toBe("/today")
  })
})
