import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1.5 [&>svg]:pointer-events-none transition-all duration-150 overflow-hidden font-['Outfit'] tracking-wide",
  {
    variants: {
      variant: {
        // Brand/Violet chip
        default:
          "border-[#8B5CF6]/25 bg-[#8B5CF6]/12 text-[#A78BFA]",
        // Secondary/neutral chip
        secondary:
          "border-white/10 bg-white/5 text-slate-400",
        // Destructive/Danger chip - Rose
        destructive:
          "border-[#F87171]/20 bg-[#F87171]/10 text-[#F87171]",
        // Outline chip
        outline:
          "border-white/15 bg-transparent text-slate-300 hover:bg-white/5",
        // Success/Active chip - Emerald
        success:
          "border-[#4ADE80]/20 bg-[#4ADE80]/10 text-[#4ADE80]",
        // Warning chip - Amber
        warning:
          "border-[#FBBF24]/20 bg-[#FBBF24]/10 text-[#FBBF24]",
        // Info chip - Sky
        info:
          "border-[#38BDF8]/20 bg-[#38BDF8]/10 text-[#38BDF8]",
        // Muted/Disabled chip
        muted:
          "border-slate-700 bg-slate-800/50 text-slate-500",
      },
      size: {
        default: "px-3 py-1 text-xs",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-4 py-1.5 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Badge({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
