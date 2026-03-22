import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Base styles per brandbook
        "flex h-10 w-full min-w-0 rounded-lg border bg-[#0E0F12] px-3.5 py-2.5",
        // Text styles
        "text-sm font-normal text-[#F0EFE9] placeholder:text-[#666666]",
        // Border
        "border-[#1C1D21] border-solid",
        // Transition
        "transition-all duration-150 ease-in-out",
        // Focus state per brandbook
        "outline-none",
        "focus:border-[#8B5CF6] focus:ring-[3px] focus:ring-[#8B5CF6]/12",
        // Disabled state
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#0E0F12]/50",
        // File input styles
        "file:text-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        // Invalid state
        "aria-invalid:border-[#F87171] aria-invalid:ring-[#F87171]/20",
        // Selection
        "selection:bg-[#8B5CF6]/30 selection:text-white",
        className
      )}
      {...props}
    />
  )
}

export { Input }
