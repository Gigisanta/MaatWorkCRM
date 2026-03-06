import React from "react";
import { cn } from "~/lib/utils";

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  /** Visual style variant */
  variant?: "primary" | "secondary" | "accent" | "outline" | "ghost" | "destructive" | "joy";
  /** Size of the button */
  size?: "sm" | "md" | "lg";
  /** Full width button */
  fullWidth?: boolean;
  /** Loading state */
  loading?: boolean;
  children: React.ReactNode;
  /** Click handler */
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

/**
 * Button component with brand styling.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      fullWidth = false,
      loading = false,
      className = "",
      children,
      disabled,
      onClick,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-body font-semibold",
          "rounded-xl transition-all duration-300 relative overflow-hidden",
          "focus:outline-none focus:ring-2 focus:ring-brand-600/50 focus:ring-offset-2 focus:ring-offset-surface-950",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none",
          "active:scale-[0.98] active:brightness-95",
          {
            "bg-brand-600 text-white shadow-[0_0_20px_rgba(139,92,246,0.2)] hover:bg-brand-500 hover:shadow-[0_0_25px_rgba(139,92,246,0.3)] hover:-translate-y-0.5":
              variant === "primary",
            "bg-surface-800 text-surface-100 hover:bg-surface-700 hover:shadow-lg hover:-translate-y-0.5":
              variant === "secondary",
            "bg-emerald-600 text-white hover:bg-emerald-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:-translate-y-0.5":
              variant === "accent",
            "bg-orange-600 text-white hover:bg-orange-500 hover:shadow-[0_0_20px_rgba(249,115,22,0.2)] hover:-translate-y-0.5":
              variant === "joy",
            "border border-surface-700 bg-transparent text-surface-200 hover:bg-surface-800 hover:text-white hover:border-surface-600 hover:shadow-sm":
              variant === "outline",
            "bg-transparent text-surface-400 hover:bg-surface-800/50 hover:text-surface-100": variant === "ghost",
            "bg-red-600 text-white hover:bg-red-500 hover:shadow-[0_0_20px_rgba(239,44,44,0.2)] hover:-translate-y-0.5":
              variant === "destructive",
          },
          {
            "px-3 py-1.5 text-sm gap-1.5": size === "sm",
            "px-4 py-2 text-sm gap-2": size === "md",
            "px-6 py-3 text-base gap-2.5": size === "lg",
          },
          fullWidth && "w-full",
          loading && "cursor-wait",
          className,
        )}
        disabled={isDisabled}
        onClick={onClick}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
