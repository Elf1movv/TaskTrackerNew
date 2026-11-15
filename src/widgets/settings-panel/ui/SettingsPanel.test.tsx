import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { LanguageProvider } from "@/shared/lib/i18n"
import { SettingsPanel } from "./SettingsPanel"

const signOut = vi.hoisted(() => vi.fn())
vi.mock("@/shared/lib/auth", async importOriginal => ({
  ...(await importOriginal<typeof import("@/shared/lib/auth")>()),
  signOut,
}))
vi.mock("@/features/notifications/push", () => ({ NotificationsSection: () => null }))

beforeEach(() => {
  localStorage.setItem("mytracker-language", "ru")
  signOut.mockClear()
})
afterEach(cleanup)

function openPanel() {
  render(
    <LanguageProvider>
      <SettingsPanel email="qa@example.invalid" />
    </LanguageProvider>,
  )
  fireEvent.click(screen.getByRole("button", { name: "Настройки" }))
}

describe("SettingsPanel — log out asks first (2026-11-15)", () => {
  it("does not log out on the first tap", () => {
    openPanel()
    fireEvent.click(screen.getByRole("button", { name: "Выйти" }))
    expect(signOut).not.toHaveBeenCalled()
    expect(screen.getByText("Выйти из аккаунта?")).toBeTruthy()
  })

  it("logs out after confirming, and stays logged in after Cancel", () => {
    openPanel()
    fireEvent.click(screen.getByRole("button", { name: "Выйти" }))
    fireEvent.click(screen.getByRole("button", { name: "Отмена" }))
    expect(signOut).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole("button", { name: "Выйти" }))
    const dialog = screen.getByRole("alertdialog")
    fireEvent.click(Array.from(dialog.querySelectorAll("button")).find(b => b.textContent === "Выйти")!)
    expect(signOut).toHaveBeenCalledTimes(1)
  })
})
