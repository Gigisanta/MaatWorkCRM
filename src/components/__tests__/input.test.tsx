import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Input } from '../ui/input';

describe('Input', () => {
  it('renders an input element', () => {
    render(<Input />);
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
  });

  it('renders with data-slot attribute', () => {
    render(<Input />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('data-slot', 'input');
  });

  it('applies custom className', () => {
    render(<Input className="custom-class" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('custom-class');
  });

  it('passes through type prop', () => {
    render(<Input type="email" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'email');
  });

  it('passes through placeholder prop', () => {
    render(<Input placeholder="Enter email" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('placeholder', 'Enter email');
  });

  it('passes through name prop', () => {
    render(<Input name="email" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('name', 'email');
  });

  it('passes through value prop', () => {
    render(<Input value="test value" readOnly />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('test value');
  });

  it('handles default type when not specified (defaults to text)', () => {
    render(<Input />);
    const input = screen.getByRole('textbox');
    // type defaults to "text" when not specified - browser reflects it as textbox role
    expect(input.tagName).toBe('INPUT');
    expect(input).toHaveClass('flex', 'h-10');
  });

  it('handles disabled state', () => {
    render(<Input disabled />);
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('applies disabled opacity via class', () => {
    render(<Input disabled />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('disabled:opacity-50');
  });

  it('handles readOnly state', () => {
    render(<Input readOnly />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('readonly');
  });

  it('applies focus styles via class', () => {
    render(<Input />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('focus:border-[#8B5CF6]');
  });

  it('applies aria-invalid when set', () => {
    render(<Input aria-invalid="true" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('applies aria-invalid border class when set', () => {
    render(<Input aria-invalid="true" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('aria-invalid:border-[#F87171]');
  });

  it('applies base styling classes', () => {
    render(<Input />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('flex', 'h-10', 'w-full', 'rounded-lg', 'border');
  });

  it('applies background and text styling', () => {
    render(<Input />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('bg-[#0E0F12]', 'text-sm', 'text-[#F0EFE9]');
  });

  it('passes through id prop', () => {
    render(<Input id="email-input" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('id', 'email-input');
  });

  it('passes through autoComplete prop', () => {
    render(<Input autoComplete="email" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('autocomplete', 'email');
  });

  it('renders multiple inputs with unique instances', () => {
    render(<><Input /><Input /></>);
    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toHaveLength(2);
  });

  it('handles onChange when provided', () => {
    let value = '';
    render(
      <Input
        onChange={(e) => { value = e.target.value; }}
      />
    );
    const input = screen.getByRole('textbox');
    input.focus();
    // Simulate input change
    const event = { target: { value: 'new value' } } as React.ChangeEvent<HTMLInputElement>;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });

  it('handles file input type', () => {
    render(<Input type="file" />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'file');
  });

  it('handles password input type', () => {
    render(<Input type="password" />);
    const input = document.querySelector('input[type="password"]') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'password');
  });

  it('handles number input type', () => {
    render(<Input type="number" />);
    const input = screen.getByRole('spinbutton');
    expect(input).toHaveAttribute('type', 'number');
  });
});
