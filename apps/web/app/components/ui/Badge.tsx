import React from "react";
import { cn } from "~/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Visual style variant */
  variant?:
    | "default"
    | "primary"
    | "secondary"
    | "accent"
    | "success"
    | "warning"
    | "error"
    | "joy"
    | "info"
    | "outline";
  size?: "sm" | "md" | "lg";
  /** Enable pop animation on mount */
  animated?: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * Badge component with brand styling.
 */
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = "default", size = "md", animated = false, children, className, ...props }, ref) => {
    const variantClasses = {
      default: "bg-surface-800 text-surface-200",
      primary: "bg-brand-600/20 text-brand-400 border border-brand-600/10",
      secondary: "bg-surface-700 text-surface-100 border border-surface-600/10",
      accent: "bg-emerald-600/20 text-emerald-400 border border-emerald-600/10",
      success: "bg-emerald-600/20 text-emerald-400 border border-emerald-600/10",
      warning: "bg-amber-600/20 text-amber-400 border border-amber-600/10",
      error: "bg-red-600/20 text-red-400 border border-red-600/10",
      joy: "bg-orange-600/20 text-orange-400 border border-orange-600/10",
      info: "bg-blue-600/20 text-blue-400 border border-blue-600/10",
      outline: "bg-transparent border border-surface-700 text-surface-200",
    };

    const sizeClasses = {
      sm: "px-2 py-0.5 text-xs",
      md: "px-2.5 py-1 text-sm",
      lg: "px-3 py-1.5 text-base",
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full font-medium font-body transition-colors",
          variantClasses[variant],
          sizeClasses[size],
          animated && "animate-in zoom-in-50 duration-300",
          className,
        )}
        {...props}
      >
        {children}
      </span>
    );
  },
);

Badge.displayName = "Badge";
