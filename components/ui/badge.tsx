import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring/50 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      // No outlines — status is carried by tint + text colour alone.
      variant: {
        default: "bg-primary-soft text-primary",
        accent: "bg-accent-soft text-accent",
        gold: "bg-gold-soft text-gold",
        secondary: "bg-muted text-ink-muted",
        destructive: "bg-destructive-soft text-destructive",
        success: "bg-success-soft text-success",
        warning: "bg-warning-soft text-warning",
        info: "bg-info-soft text-info",
        outline: "bg-secondary text-ink-muted",
        solid: "bg-primary text-primary-foreground",
        "solid-accent": "bg-accent text-accent-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
