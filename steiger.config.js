import { defineConfig } from "steiger"
import fsd from "@feature-sliced/steiger-plugin"

export default defineConfig([
  ...fsd.configs.recommended,
  {
    // This app is early-stage and intentionally extracts features/widgets ahead of a
    // second usage, to prepare for planned growth. Kept as a warning (not silenced)
    // so real reuse opportunities and merge-back candidates stay visible over time.
    rules: {
      "fsd/insignificant-slice": "warn",
    },
  },
  {
    files: ["./src/app/**"],
    // FSD itself endorses `providers/` as a normal app-layer segment name for
    // React/Vue provider components (see fsd.how). Downgraded rather than silenced
    // in case the segment's contents grow beyond just providers later.
    rules: {
      "fsd/segments-by-purpose": "warn",
    },
  },
])
