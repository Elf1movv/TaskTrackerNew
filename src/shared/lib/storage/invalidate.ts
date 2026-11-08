// Deleting a category also deletes its ordinary tasks and clears the
// category on its goals (the goals themselves stay). Other product entities
// are independent and do not invalidate each other's collections.
export function invalidateRelated(baseUrl: string, deleted = false) {
  if (deleted && baseUrl.split("/").slice(-1)[0] === "categories")
    window.dispatchEvent(new CustomEvent("collection-invalidated", { detail: ["task", "goal"] }))
}
