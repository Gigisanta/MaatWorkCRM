import React from "react";
import { cn } from "~/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
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
  children: React.ReactNode;
  className?: string;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = "default", size = "md", children, className, ...props }, ref) => {
    const variantClasses = {
      default: "bg-surface-hover text-text-secondary",
      primary: "bg-primary/10 text-primary border border-primary/20",
      secondary: "bg-surface-hover text-text border border-border",
      accent: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
      success: "bg-success/10 text-success border border-success/20",
      warning: "bg-warning/10 text-warning border border-warning/20",
      error: "bg-error/10 text-error border border-error/20",
      joy: "bg-orange-500/10 text-orange-400 border border-orange-500/20",
      info: "bg-info/10 text-info border border-info/20",
      outline: "bg-transparent border border-border text-text-secondary",
    };

    const sizeClasses = {
      sm: "px-2 py-0.5 text-xs",
      md: "px-2 py-1 text-xs",
      lg: "px-2.5 py-1 text-sm",
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-md font-medium font-body transition-colors duration-150",
          variantClasses[variant],
          sizeClasses[size],
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
