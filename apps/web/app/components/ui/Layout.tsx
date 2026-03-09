import React from "react";
import { cn } from "~/lib/utils";

// --- Container ---

type ContainerSize = "sm" | "md" | "lg" | "xl" | "full";

export interface ContainerProps extends React.HTMLAttributes<HTMLElement> {
  size?: ContainerSize;
  padding?: "none" | "sm" | "md" | "lg";
  animated?: boolean;
}

const sizeClasses: Record<ContainerSize, string> = {
  sm: "max-w-3xl",
  md: "max-w-5xl",
  lg: "max-w-7xl",
  xl: "max-w-[1400px]",
  full: "max-w-full",
};

const paddingClasses = {
  none: "",
  sm: "px-3 py-2 sm:px-4 sm:py-3",
  md: "px-4 py-4 sm:px-6 lg:px-8",
  lg: "px-4 py-6 sm:px-6 lg:px-8",
};

export const Container = React.forwardRef<HTMLElement, ContainerProps>(
  ({ children, size = "lg", className, padding = "md", animated = true, ...props }, ref) => {
    return (
      <div
        ref={ref as any}
        className={cn(
          "mx-auto w-full transition-all duration-300",
          sizeClasses[size],
          paddingClasses[padding],
          animated && "animate-fade-in-up",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);
Container.displayName = "Container";

// --- Stack ---

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: "row" | "col";
  gap?: number | string;
  align?: "start" | "center" | "end" | "stretch" | "baseline";
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
}

export const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ children, direction = "col", gap = 4, align, justify, className, ...props }, ref) => {
    // Standardizing gap utility
    const gapMap: Record<string | number, string> = {
      0: "gap-0",
      1: "gap-1",
      2: "gap-2",
      3: "gap-3",
      4: "gap-4",
      5: "gap-5",
      6: "gap-6",
      8: "gap-8",
      10: "gap-10",
      12: "gap-12",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "flex",
          direction === "col" ? "flex-col" : "flex-row",
          gapMap[gap] || `gap-[${gap}px]`,
          align && `items-${align}`,
          justify && `justify-${justify}`,
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);
Stack.displayName = "Stack";

// --- Grid ---

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: number | { xs?: number; sm?: number; md?: number; lg?: number; xl?: number; base?: number };
  gap?: number | string;
  md?: number;
  lg?: number;
}

const colMap: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
  7: "grid-cols-7",
  8: "grid-cols-8",
  9: "grid-cols-9",
  10: "grid-cols-10",
  11: "grid-cols-11",
  12: "grid-cols-12",
};

const smColMap: Record<number, string> = {
  1: "sm:grid-cols-1",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-4",
  5: "sm:grid-cols-5",
  6: "sm:grid-cols-6",
  7: "sm:grid-cols-7",
  8: "sm:grid-cols-8",
  9: "sm:grid-cols-9",
  10: "sm:grid-cols-10",
  11: "sm:grid-cols-11",
  12: "sm:grid-cols-12",
};

const mdColMap: Record<number, string> = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
  5: "md:grid-cols-5",
  6: "md:grid-cols-6",
  7: "md:grid-cols-7",
  8: "md:grid-cols-8",
  9: "md:grid-cols-9",
  10: "md:grid-cols-10",
  11: "md:grid-cols-11",
  12: "md:grid-cols-12",
};

const lgColMap: Record<number, string> = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
  6: "lg:grid-cols-6",
  7: "lg:grid-cols-7",
  8: "lg:grid-cols-8",
  9: "lg:grid-cols-9",
  10: "lg:grid-cols-10",
  11: "lg:grid-cols-11",
  12: "lg:grid-cols-12",
};

const xlColMap: Record<number, string> = {
  1: "xl:grid-cols-1",
  2: "xl:grid-cols-2",
  3: "xl:grid-cols-3",
  4: "xl:grid-cols-4",
  5: "xl:grid-cols-5",
  6: "xl:grid-cols-6",
  7: "xl:grid-cols-7",
  8: "xl:grid-cols-8",
  9: "xl:grid-cols-9",
  10: "xl:grid-cols-10",
  11: "xl:grid-cols-11",
  12: "xl:grid-cols-12",
};

export const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  ({ children, cols = 1, gap = 4, className, md, lg, ...props }, ref) => {
    const gapMap: Record<string | number, string> = {
      0: "gap-0",
      1: "gap-1",
      2: "gap-2",
      3: "gap-3",
      4: "gap-4",
      5: "gap-5",
      6: "gap-6",
      8: "gap-8",
      10: "gap-10",
      12: "gap-12",
      sm: "gap-2",
      md: "gap-4",
      lg: "gap-6", // Added string gap support
    };

    const colClasses =
      typeof cols === "number"
        ? colMap[cols] || `grid-cols-${cols}` // Fallback for numbers outside 1-12, though ideally not needed
        : cn(
            cols.xs && colMap[cols.xs],
            cols.sm && smColMap[cols.sm],
            cols.md && mdColMap[cols.md],
            cols.lg && lgColMap[cols.lg],
            cols.xl && xlColMap[cols.xl],
          );

    return (
      <div ref={ref} className={cn("grid", colClasses, gapMap[gap] || `gap-[${gap}px]`, className)} {...props}>
        {children}
      </div>
    );
  },
);
Grid.displayName = "Grid";
