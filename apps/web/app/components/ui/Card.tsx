import React from "react";
import { cn } from "~/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "outlined" | "elevated" | "interactive" | "highlight" | "solid";
  padding?: "none" | "sm" | "md" | "lg";
  children: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ variant = "outlined", padding = "md", children, className, ...props }, ref) => {
    const variantClasses = {
      outlined: "border border-border bg-surface",
      elevated: "border border-border bg-surface shadow-lg",
      interactive:
        "border border-border bg-surface hover:border-border-hover hover:shadow-md transition-all duration-150 cursor-pointer hover:scale-[1.005]",
      highlight: "border-l-2 border-l-primary border border-border bg-surface",
      solid: "bg-surface border border-border",
    };

    const paddingClasses = {
      none: "",
      sm: "p-3",
      md: "p-4",
      lg: "p-6",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg font-body transition-all duration-150",
          variantClasses[variant],
          paddingClasses[padding],
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = "Card";

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} className={cn("mb-3", className)} {...props}>
      {children}
    </div>
  ),
);
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ children, className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-base font-semibold text-text font-display", className)} {...props}>
      {children}
    </h3>
  ),
);
CardTitle.displayName = "CardTitle";

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ children, className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-text-muted font-body mt-1", className)} {...props}>
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
    <div ref={ref} className={cn("mt-3 pt-3 border-t border-border", className)} {...props}>
      {children}
    </div>
  ),
);
CardFooter.displayName = "CardFooter";
