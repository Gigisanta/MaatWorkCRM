import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '@/components/ui/badge';

describe('Badge', () => {
  it('renders with children', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders with different variants', () => {
    const variants = [
      'default',
      'secondary',
      'destructive',
      'outline',
      'success',
      'warning',
      'info',
      'muted',
    ] as const;
    for (const variant of variants) {
      const { container } = render(<Badge variant={variant}>{variant}</Badge>);
      expect(container.firstChild).toBeInTheDocument();
    }
  });

  it('renders with different sizes', () => {
    const sizes = ['default', 'sm', 'lg'] as const;
    for (const size of sizes) {
      const { container } = render(<Badge size={size}>{size}</Badge>);
      expect(container.firstChild).toBeInTheDocument();
    }
  });

  it('applies custom className', () => {
    const { container } = render(<Badge className="custom-class">Styled</Badge>);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('renders as a span element', () => {
    const { container } = render(<Badge>Status</Badge>);
    expect(container.querySelector('span')).toBeInTheDocument();
  });
});
