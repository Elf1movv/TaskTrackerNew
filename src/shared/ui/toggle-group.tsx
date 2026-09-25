"use client"

import * as React from "react"
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group"
import { type VariantProps } from "class-variance-authority"

import { cn } from "./utils"
import { toggleVariants } from "./toggle"

const ToggleGroupContext = React.createContext<VariantProps<typeof toggleVariants>>({
  size: "default",
  variant: "default",
})

function ToggleGroup({
  className,
  variant,
  size,
  children,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root> & VariantProps<typeof toggleVariants>) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      data-variant={variant}
      data-size={size}
      // No longer one continuous joined pill (see ToggleGroupItem's comment
      // for why) — the group is just a flex row of independently-shaped
      // items with a real gap between them, so no group-level rounding/
      // shadow of its own.
      className={cn("group/toggle-group flex w-fit items-center gap-1.5", className)}
      {...props}
    >
      <ToggleGroupContext.Provider value={{ variant, size }}>{children}</ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  )
}

function ToggleGroupItem({
  className,
  children,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item> & VariantProps<typeof toggleVariants>) {
  const context = React.useContext(ToggleGroupContext)

  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      data-variant={context.variant || variant}
      data-size={context.size || size}
      // Used to be one joined pill (items sharing a seam, `rounded-none`
      // except at the two outer ends) with only a translucent border-color
      // token separating a selected item's fill from its neighbor — even
      // the more-visible of the two theme border tokens (--border, 10%
      // opacity) read as no separation at all at a glance, since a hairline
      // is still a hairline. Each item now keeps its own full rounding
      // (from toggleVariants' base `rounded-md`, no longer overridden) and
      // sits in a real gap (see ToggleGroup's `gap-1.5`) — a selected
      // item's solid fill now has actual empty space around it before the
      // next item starts, not just a thin line.
      className={cn(
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        "min-w-0 flex-1 shrink-0 shadow-none",
        className,
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  )
}

export { ToggleGroup, ToggleGroupItem }
