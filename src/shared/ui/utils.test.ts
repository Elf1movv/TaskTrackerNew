import { expect, it } from "vitest"
import { cn } from "./utils"

it("keeps the text color when a custom text size is added", () => {
  expect(cn("bg-primary text-primary-foreground", "text-body")).toBe(
    "bg-primary text-primary-foreground text-body",
  )
  expect(cn("text-sm", "text-meta")).toBe("text-meta")
})
