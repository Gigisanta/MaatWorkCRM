import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('renders with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('renders with different variants', () => {
    const variants = [
      'default',
      'destructive',
      'outline',
      'secondary',
      'ghost',
      'link',
      'success',
      'warning',
    ] as const;
    for (const variant of variants) {
      const { container } = render(<Button variant={variant}>{variant}</Button>);
      expect(container.firstChild).toBeInTheDocument();
    }
  });

  it('renders with different sizes', () => {
    const sizes = ['default', 'sm', 'lg', 'icon', 'iconSm'] as const;
    for (const size of sizes) {
      const { container } = render(<Button size={size}>{size}</Button>);
      expect(container.firstChild).toBeInTheDocument();
    }
  });

  it('is disabled when disabled prop is set', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('forwards the type attribute', () => {
    render(<Button type="submit">Submit</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('applies custom className', () => {
    const { container } = render(<Button className="custom-class">Styled</Button>);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('handles click events', async () => {
    const user = userEvent.setup();
    const handler = vi.fn();
    render(<Button onClick={handler}>Click me</Button>);
    await user.click(screen.getByRole('button'));
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
