export interface HabitGroup {
  id: string
  title: string
  icon: string
  // Only used by the Today page's card header (a colored pill behind the
  // block's name) — the /habits page's accordion header doesn't use it.
  color: string
  // The one auto-seeded, undeletable bucket every user gets for habits
  // that aren't in a custom block — renaming/re-icon/re-coloring it is
  // allowed like any other group, only deleting it is blocked. Its
  // title/icon/color from the server are just placeholders until the user
  // first edits them — render the localized label/icon instead while they
  // still match the placeholder, see habitGroupDisplay.ts.
  isGeneral: boolean
  updatedAt: string
}
