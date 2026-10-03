// A mutation may change related collections server-side. Refresh just
// those collections after success, never overwrite the optimistic source.
export function invalidateRelated(baseUrl: string, deleted = false) {
  const resource = baseUrl.split("/").slice(-1)[0]
  const affected =
    resource === "plans"
      ? ["reminder"]
      : resource === "tasks" && deleted
        ? ["plan", "reminder", "goal"]
        : resource === "goals" && deleted
          ? ["task"]
          : resource === "categories" && deleted
            ? ["task", "plan", "reminder", "goal"]
            : []
  if (affected.length) window.dispatchEvent(new CustomEvent("collection-invalidated", { detail: affected }))
}
