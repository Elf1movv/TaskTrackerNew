import type { ReactNode } from "react"
import { DndProvider } from "react-dnd"
import { TestBackend, type ITestBackend } from "react-dnd-test-backend"

// Test-only helper (not picked up by vitest — doesn't match *.test.*).
// Wraps a hook under test in a fresh DndProvider backed by react-dnd's own
// TestBackend, not the real HTML5Backend the app uses — HTML5 drag events
// don't fire reliably in jsdom, TestBackend is the react-dnd team's
// purpose-built tool for simulating drag/drop without a real browser.
// `onReady` receives the backend instance so a test can call its
// simulateBeginDrag/simulateHover/simulateDrop methods directly.
//
// DndProvider caches its manager/backend in a GLOBAL singleton (keyed by a
// process-wide Symbol) unless given its own `context` object — without
// this, only the very first DndProvider rendered in the whole test run
// would ever actually construct a backend and call `onCreate`; every later
// test would silently reuse that first instance instead. Passing a fresh
// `{}` per wrapper forces each test to get its own isolated manager.
export function makeDndWrapper(onReady: (backend: ITestBackend) => void) {
  const context = {}
  return function DndWrapper({ children }: { children: ReactNode }) {
    return (
      <DndProvider backend={TestBackend} context={context} options={{ onCreate: onReady }}>
        {children}
      </DndProvider>
    )
  }
}
