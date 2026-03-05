import React from 'react';
import { cn } from '~/lib/utils';

// --- Container ---

type ContainerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ContainerProps extends React.HTMLAttributes<HTMLElement> {
  size?: ContainerSize;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  animated?: boolean;
}

const sizeClasses: Record<ContainerSize, string> = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-7xl',
  xl: 'max-w-[1400px]',
  full: 'max-w-full',
};

const paddingClasses = {
  none: '',
  sm: 'px-3 py-2 sm:px-4 sm:py-3',
  md: 'px-4 py-4 sm:px-6 lg:px-8',
  lg: 'px-4 py-6 sm:px-6 lg:px-8',
};

export const Container = React.forwardRef<HTMLElement, ContainerProps>(
  ({ children, size = 'lg', className, padding = 'md', animated = true, ...props }, ref) => {
    return (
      <div
        ref={ref as any}
        className={cn(
          'mx-auto w-full',
          sizeClasses[size],
          paddingClasses[padding],
          animated && 'animate-in fade-in slide-in-from-bottom-4 duration-500',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Container.displayName = 'Container';

// --- Stack ---

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'row' | 'col';
  gap?: number | string;
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
}

export const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ children, direction = 'col', gap = 4, align, justify, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex',
          direction === 'col' ? 'flex-col' : 'flex-row',
          `gap-${gap}`,
          align && `items-${align}`,
          justify && `justify-${justify}`,
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Stack.displayName = 'Stack';

// --- Grid ---

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: number | { sm?: number; md?: number; lg?: number; xl?: number };
  gap?: number | string;
}

export const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  ({ children, cols = 1, gap = 4, className, ...props }, ref) => {
    const colClasses = typeof cols === 'number' 
      ? `grid-cols-${cols}` 
      : cn(
          cols.sm && `sm:grid-cols-${cols.sm}`,
          cols.md && `md:grid-cols-${cols.md}`,
          cols.lg && `lg:grid-cols-${cols.lg}`,
          cols.xl && `xl:grid-cols-${cols.xl}`
        );

    return (
      <div
        ref={ref}
        className={cn(
          'grid',
          colClasses,
          `gap-${gap}`,
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Grid.displayName = 'Grid';
