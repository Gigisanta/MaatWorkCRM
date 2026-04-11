import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        // Primary button - Violet brand color
        default:
          "bg-[#8B5CF6] text-white shadow-sm hover:bg-[#6D28D9] hover:-translate-y-px active:bg-[#4C1D95] active:translate-y-0",
        // Destructive/Danger button - Rose
        destructive:
          "bg-[#F87171] text-white shadow-sm hover:bg-[#ef4444] hover:-translate-y-0.5 active:bg-[#dc2626] focus-visible:ring-[#F87171]/50",
        // Secondary/Outline button - Border with violet accent
        outline:
          "border border-[#8B5CF6]/35 bg-transparent text-[#A78BFA] hover:border-[#8B5CF6] hover:bg-[#8B5CF6]/12 active:bg-[#8B5CF6]/20",
        // Secondary button - Muted background
        secondary:
          "bg-[#1C1D21]/80 text-slate-300 border border-white/10 hover:bg-[#1C1D21] hover:text-white hover:border-white/20",
        // Ghost button - Transparent
        ghost:
          "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10",
        // Link button - Text only with underline
        link: "text-[#A78BFA] underline-offset-4 hover:underline hover:text-[#8B5CF6]",
        // Success button - Emerald
        success:
          "bg-[#4ADE80] text-[#08090B] shadow-sm hover:bg-[#22c55e] hover:-translate-y-0.5 active:bg-[#16a34a]",
        // Warning button - Amber
        warning:
          "bg-[#FBBF24] text-[#08090B] shadow-sm hover:bg-[#f59e0b] hover:-translate-y-0.5 active:bg-[#d97706]",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 text-xs has-[>svg]:px-2.5",
        lg: "h-11 rounded-lg px-6 has-[>svg]:px-4 text-base",
        icon: "size-9 rounded-lg",
        iconSm: "size-8 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
