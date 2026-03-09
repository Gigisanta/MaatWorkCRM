import React from "react";
import { cn } from "~/lib/utils";

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  variant?: "primary" | "secondary" | "accent" | "outline" | "ghost" | "destructive" | "joy";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  "aria-label"?: string;
}

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
      "aria-label": ariaLabel,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        aria-label={ariaLabel}
        aria-disabled={isDisabled}
        aria-busy={loading}
        className={cn(
          "inline-flex items-center justify-center font-body font-semibold",
          "rounded-lg transition-all duration-150 ease-out relative overflow-hidden",
          "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
          "active:scale-[0.98]",
          !loading && "hover:scale-[1.005]",
          {
            "bg-primary text-white hover:bg-primary-hover": variant === "primary",
            "bg-surface-hover text-text-secondary hover:bg-surface border border-border": variant === "secondary",
            "bg-emerald-600 text-white hover:bg-emerald-500": variant === "accent",
            "bg-orange-600 text-white hover:bg-orange-500": variant === "joy",
            "border border-border bg-transparent text-text-secondary hover:bg-surface-hover hover:text-text":
              variant === "outline",
            "bg-transparent text-text-muted hover:bg-surface-hover hover:text-text": variant === "ghost",
            "bg-red-600 text-white hover:bg-red-500": variant === "destructive",
          },
          {
            "px-3 py-1.5 text-sm gap-1.5": size === "sm",
            "px-4 py-2 text-sm gap-2": size === "md",
            "px-5 py-2.5 text-base gap-2": size === "lg",
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
