import { describe, expect, it } from "vitest"
import { translate } from "./translate"

const ru = "{count} привычка|{count} привычки|{count} привычек"
describe("translate", () => {
  it("picks Russian plural forms", () => {
    expect(translate(ru, "ru", { count: 1 })).toBe("1 привычка")
    expect(translate(ru, "ru", { count: 2 })).toBe("2 привычки")
    expect(translate(ru, "ru", { count: 5 })).toBe("5 привычек")
    expect(translate(ru, "ru", { count: 21 })).toBe("21 привычка")
    expect(translate(ru, "ru", { count: 0 })).toBe("0 привычек")
  })
  it("picks English plural forms", () => {
    expect(translate("{count} habit|{count} habits", "en", { count: 1 })).toBe("1 habit")
    expect(translate("{count} habit|{count} habits", "en", { count: 3 })).toBe("3 habits")
  })
  it("fills plain placeholders", () => {
    expect(translate("Срок: {date}", "ru", { date: "8 ноября" })).toBe("Срок: 8 ноября")
  })
})
