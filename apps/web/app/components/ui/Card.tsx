import React from 'react';
import { cn } from '~/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Visual style variant */
  variant?: 'outlined' | 'elevated' | 'interactive' | 'highlight' | 'animated' | 'glass' | 'cyber';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Enable hover animations (lift + glow effect) */
  animated?: boolean;
  children: React.ReactNode;
}

/**
 * Card component with brand styling matching the reference repository.
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    { variant = 'outlined', padding = 'md', animated = false, children, className, ...props },
    ref
  ) => {
    const variantClasses = {
      outlined: 'border border-surface-800 bg-surface-950',
      elevated: 'shadow-lg bg-surface-950 border border-surface-800',
      interactive:
        'border border-surface-800 bg-surface-950 hover:shadow-xl hover:border-brand-600/30 transition-all duration-300 cursor-pointer hover:-translate-y-1',
      highlight: 'border-l-4 border-l-brand-600 border border-surface-800 bg-surface-950',
      animated:
        'border border-surface-800 bg-surface-950 hover:shadow-xl hover:border-brand-600/30 hover:-translate-y-1 transition-all duration-300 cursor-pointer',
      glass: 'glass-card',
      cyber: 'glass-card relative overflow-hidden group hover:border-brand-600/50 transition-colors duration-300',
    };

    const paddingClasses = {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    };

    const animatedClasses = animated
      ? 'hover:shadow-xl hover:-translate-y-1 hover:border-brand-600/30 transition-all duration-300'
      : '';

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl font-body',
          variantClasses[variant],
          paddingClasses[padding],
          animatedClasses,
          className
        )}
        {...props}
      >
        {children}
        {variant === 'cyber' && (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-brand-600/5 via-transparent to-brand-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          </>
        )}
      </div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ children, className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-lg font-semibold text-white font-display tracking-tight', className)}
      {...props}
    >
      {children}
    </h3>
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ children, className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-surface-400 font-body mt-1', className)}
      {...props}
    >
      {children}
    </p>
  )
);
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} className={cn('font-body', className)} {...props}>
      {children}
    </div>
  )
);
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} className={cn('mt-4 pt-4 border-t border-surface-800', className)} {...props}>
      {children}
    </div>
  )
);
CardFooter.displayName = 'CardFooter';
