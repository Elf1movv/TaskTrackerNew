// Deleting a category also deletes its tasks; renaming one moves its tasks
// to the new name (Task.category stores the name). Goals have no category in
// the interface since 2026-11-12 (the server still keeps the old column in
// step). Other product entities are independent and do not invalidate each
// other's collections.
export function invalidateRelated(baseUrl: string, change: { deleted?: boolean; renamed?: boolean } = {}) {
  if ((change.deleted || change.renamed) && baseUrl.split("/").slice(-1)[0] === "categories")
    window.dispatchEvent(new CustomEvent("collection-invalidated", { detail: ["task"] }))
}
