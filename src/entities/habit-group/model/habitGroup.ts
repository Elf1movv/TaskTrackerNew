export interface HabitGroup {
  id: string
  title: string
  icon: string
  // The one auto-seeded, un-renameable/undeletable bucket every user gets
  // for habits that aren't in a custom block. Its `title`/`icon` from the
  // server are just placeholders — always render the localized label
  // instead when this is true, see habitGroupDisplay.ts.
  isGeneral: boolean
  updatedAt: string
}
