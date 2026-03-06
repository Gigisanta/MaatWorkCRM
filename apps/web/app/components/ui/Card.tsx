import React from "react";
import { cn } from "~/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Visual style variant */
  variant?: "outlined" | "elevated" | "interactive" | "highlight" | "animated" | "glass" | "cyber";
  padding?: "none" | "sm" | "md" | "lg";
  /** Enable hover animations (lift + glow effect) */
  animated?: boolean;
  children: React.ReactNode;
}

/**
 * Card component with brand styling matching the reference repository.
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ variant = "outlined", padding = "md", animated = false, children, className, ...props }, ref) => {
    const variantClasses = {
      outlined: "border border-border/60 bg-surface shadow-sm hover:border-border-strong transition-all duration-300",
      elevated: "shadow-lg bg-surface border border-border/40",
      interactive:
        "border border-border/60 bg-surface hover:shadow-xl hover:border-primary/30 transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:bg-surface-hover",
      highlight: "border-l-4 border-l-primary border border-border/40 bg-surface shadow-sm",
      animated:
        "border border-border/60 bg-surface hover:shadow-xl hover:border-primary/30 hover:-translate-y-1 transition-all duration-300 cursor-pointer",
      glass: "glass-card border border-white/40 shadow-sm hover:border-white/60 transition-all duration-500",
      cyber:
        "glass-card relative overflow-hidden group hover:border-primary/50 transition-all duration-500 hover:shadow-primary-lg active:scale-[0.99]",
    };

    const paddingClasses = {
      none: "",
      sm: "p-3",
      md: "p-5",
      lg: "p-8",
    };

    const animatedClasses = animated
      ? "hover:shadow-xl hover:-translate-y-1.5 hover:border-primary/40 transition-all duration-500"
      : "";

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl font-body transition-all duration-300",
          variantClasses[variant],
          paddingClasses[padding],
          animatedClasses,
          className,
        )}
        {...props}
      >
        {children}
        {variant === "cyber" && (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <div className="absolute -inset-px bg-gradient-to-r from-primary/20 via-transparent to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-[inherit]" />
          </>
        )}
      </div>
    );
  },
);

Card.displayName = "Card";

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} className={cn("mb-4", className)} {...props}>
      {children}
    </div>
  ),
);
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ children, className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-lg font-semibold text-white font-display tracking-tight", className)} {...props}>
      {children}
    </h3>
  ),
);
CardTitle.displayName = "CardTitle";

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ children, className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-surface-400 font-body mt-1", className)} {...props}>
      {children}
    </p>
  ),
);
CardDescription.displayName = "CardDescription";

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} className={cn("font-body", className)} {...props}>
      {children}
    </div>
  ),
);
CardContent.displayName = "CardContent";

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} className={cn("mt-4 pt-4 border-t border-surface-800", className)} {...props}>
      {children}
    </div>
  ),
);
CardFooter.displayName = "CardFooter";
