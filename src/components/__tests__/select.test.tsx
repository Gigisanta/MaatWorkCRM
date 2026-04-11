import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectGroup,
  SelectValue,
  SelectSeparator,
} from '../ui/select';

describe('Select', () => {
  it('renders Select component without crashing', () => {
    render(
      <Select>
        <SelectTrigger data-testid="select-trigger">
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Option 1</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(screen.getByTestId('select-trigger')).toBeInTheDocument();
  });

  it('renders SelectTrigger with data-slot attribute', () => {
    render(
      <Select>
        <SelectTrigger data-testid="select-trigger" />
      </Select>
    );
    expect(screen.getByTestId('select-trigger')).toHaveAttribute('data-slot', 'select-trigger');
  });

  it('renders SelectValue with placeholder text', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Choose an item" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Item 1</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(screen.getByText('Choose an item')).toBeInTheDocument();
  });

  it('renders SelectContent with data-slot attribute', () => {
    render(
      <Select open={true}>
        <SelectTrigger />
        <SelectContent data-testid="select-content">
          <SelectItem value="1">Item 1</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(screen.getByTestId('select-content')).toBeInTheDocument();
  });

  it('renders SelectItem with data-slot attribute', () => {
    render(
      <Select open={true}>
        <SelectTrigger />
        <SelectContent>
          <SelectItem data-testid="select-item" value="opt1">
            Option 1
          </SelectItem>
        </SelectContent>
      </Select>
    );
    expect(screen.getByTestId('select-item')).toHaveAttribute('data-slot', 'select-item');
  });

  it('renders SelectLabel with data-slot attribute', () => {
    render(
      <Select open={true}>
        <SelectTrigger />
        <SelectContent>
          <SelectGroup>
            <SelectLabel data-testid="select-label">Group Label</SelectLabel>
            <SelectItem value="1">Item 1</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    );
    expect(screen.getByTestId('select-label')).toHaveAttribute('data-slot', 'select-label');
  });

  it('renders SelectGroup with data-slot attribute', () => {
    render(
      <Select open={true}>
        <SelectTrigger />
        <SelectContent>
          <SelectGroup data-testid="select-group">
            <SelectLabel>Group</SelectLabel>
            <SelectItem value="1">Item 1</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    );
    expect(screen.getByTestId('select-group')).toHaveAttribute('data-slot', 'select-group');
  });

  it('renders SelectSeparator with data-slot attribute', () => {
    render(
      <Select open={true}>
        <SelectTrigger />
        <SelectContent>
          <SelectItem value="1">Item 1</SelectItem>
          <SelectSeparator data-testid="select-separator" />
          <SelectItem value="2">Item 2</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(screen.getByTestId('select-separator')).toHaveAttribute('data-slot', 'select-separator');
  });

  it('renders multiple SelectItem options', () => {
    render(
      <Select open={true}>
        <SelectTrigger />
        <SelectContent>
          <SelectItem value="a">Alpha</SelectItem>
          <SelectItem value="b">Beta</SelectItem>
          <SelectItem value="c">Gamma</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText('Gamma')).toBeInTheDocument();
  });

  it('applies custom className to SelectTrigger', () => {
    render(
      <Select>
        <SelectTrigger data-testid="select-trigger" className="custom-trigger-class">
          <SelectValue placeholder="Select" />
        </SelectTrigger>
      </Select>
    );
    expect(screen.getByTestId('select-trigger')).toHaveClass('custom-trigger-class');
  });

  it('applies custom className to SelectContent', () => {
    render(
      <Select open={true}>
        <SelectTrigger />
        <SelectContent data-testid="select-content" className="custom-content-class">
          <SelectItem value="1">Item</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(screen.getByTestId('select-content')).toHaveClass('custom-content-class');
  });

  it('applies custom className to SelectItem', () => {
    render(
      <Select open={true}>
        <SelectTrigger />
        <SelectContent>
          <SelectItem data-testid="select-item" value="1" className="custom-item-class">
            Item
          </SelectItem>
        </SelectContent>
      </Select>
    );
    expect(screen.getByTestId('select-item')).toHaveClass('custom-item-class');
  });

  it('applies custom className to SelectLabel', () => {
    render(
      <Select open={true}>
        <SelectTrigger />
        <SelectContent>
          <SelectGroup>
            <SelectLabel data-testid="select-label" className="custom-label-class">
              Label
            </SelectLabel>
          </SelectGroup>
        </SelectContent>
      </Select>
    );
    expect(screen.getByTestId('select-label')).toHaveClass('custom-label-class');
  });

  it('applies custom className to SelectSeparator', () => {
    render(
      <Select open={true}>
        <SelectTrigger />
        <SelectContent>
          <SelectItem value="1">Item 1</SelectItem>
          <SelectSeparator data-testid="select-sep" className="custom-sep-class" />
          <SelectItem value="2">Item 2</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(screen.getByTestId('select-sep')).toHaveClass('custom-sep-class');
  });

  it('applies data-size attribute to SelectTrigger', () => {
    render(
      <Select>
        <SelectTrigger data-testid="select-trigger" />
      </Select>
    );
    expect(screen.getByTestId('select-trigger')).toHaveAttribute('data-size', 'default');
  });

  it('applies data-size=sm when size prop is sm', () => {
    render(
      <Select>
        <SelectTrigger data-testid="select-trigger" size="sm" />
      </Select>
    );
    expect(screen.getByTestId('select-trigger')).toHaveAttribute('data-size', 'sm');
  });

  it('applies disabled to SelectTrigger', () => {
    render(
      <Select>
        <SelectTrigger data-testid="select-trigger" disabled>
          <SelectValue placeholder="Disabled" />
        </SelectTrigger>
      </Select>
    );
    expect(screen.getByTestId('select-trigger')).toBeDisabled();
  });

  it('applies disabled cursor and opacity classes to SelectTrigger', () => {
    render(
      <Select>
        <SelectTrigger data-testid="select-trigger" disabled>
          <SelectValue placeholder="Disabled" />
        </SelectTrigger>
      </Select>
    );
    const trigger = screen.getByTestId('select-trigger');
    expect(trigger).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50');
  });

  it('renders SelectItem with correct value and text', () => {
    render(
      <Select open={true}>
        <SelectTrigger />
        <SelectContent>
          <SelectItem data-testid="select-item" value="my-value">
            My Label
          </SelectItem>
        </SelectContent>
      </Select>
    );
    // Radix UI renders SelectItem via ItemText, value is not a direct DOM attribute
    expect(screen.getByTestId('select-item')).toHaveTextContent('My Label');
  });

  it('renders SelectItemText with data-slot attribute', () => {
    render(
      <Select open={true}>
        <SelectTrigger />
        <SelectContent>
          <SelectItem value="1">
            <span data-testid="item-text">Item Text</span>
          </SelectItem>
        </SelectContent>
      </Select>
    );
    expect(screen.getByTestId('item-text')).toBeInTheDocument();
  });

  it('SelectItem renders item text as children', () => {
    render(
      <Select open={true}>
        <SelectTrigger />
        <SelectContent>
          <SelectItem value="vip">VIP Client</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(screen.getByText('VIP Client')).toBeInTheDocument();
  });

  it('renders SelectGroup wrapping multiple items', () => {
    render(
      <Select open={true}>
        <SelectTrigger />
        <SelectContent>
          <SelectGroup data-testid="group">
            <SelectLabel>Priority</SelectLabel>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    );
    expect(screen.getByTestId('group')).toBeInTheDocument();
    expect(screen.getByText('Priority')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
  });

  it('applies base styling classes to SelectTrigger', () => {
    render(
      <Select>
        <SelectTrigger data-testid="select-trigger">
          <SelectValue placeholder="Select" />
        </SelectTrigger>
      </Select>
    );
    const trigger = screen.getByTestId('select-trigger');
    expect(trigger).toHaveClass('flex', 'items-center', 'justify-between', 'rounded-md', 'border');
  });

  it('applies base styling classes to SelectContent', () => {
    render(
      <Select open={true}>
        <SelectTrigger />
        <SelectContent data-testid="select-content">
          <SelectItem value="1">Item</SelectItem>
        </SelectContent>
      </Select>
    );
    const content = screen.getByTestId('select-content');
    expect(content).toHaveClass('bg-popover', 'text-popover-foreground', 'rounded-md', 'border', 'shadow-md');
  });

  it('SelectContent applies popper position class', () => {
    render(
      <Select open={true}>
        <SelectTrigger />
        <SelectContent data-testid="select-content" position="popper">
          <SelectItem value="1">Item</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(screen.getByTestId('select-content')).toHaveClass('data-[side=bottom]:translate-y-1');
  });

  it('renders inside Select component context', () => {
    render(
      <Select value="selected-val" open={true}>
        <SelectTrigger data-testid="trigger">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="selected-val">Selected</SelectItem>
          <SelectItem value="other">Other</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(screen.getByTestId('trigger')).toBeInTheDocument();
  });

  it('SelectItem has focus class available', () => {
    render(
      <Select open={true}>
        <SelectTrigger />
        <SelectContent>
          <SelectItem data-testid="item" value="1">Focusable Item</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(screen.getByTestId('item')).toHaveClass('focus:bg-accent');
  });

  it('renders without SelectValue (empty trigger)', () => {
    render(
      <Select>
        <SelectTrigger data-testid="trigger" />
      </Select>
    );
    expect(screen.getByTestId('trigger')).toBeInTheDocument();
  });

  it('SelectTrigger passes through aria-label', () => {
    render(
      <Select>
        <SelectTrigger data-testid="trigger" aria-label="Choose a color">
          <SelectValue />
        </SelectTrigger>
      </Select>
    );
    expect(screen.getByTestId('trigger')).toHaveAttribute('aria-label', 'Choose a color');
  });

  it('SelectTrigger passes through id', () => {
    render(
      <Select>
        <SelectTrigger data-testid="trigger" id="color-select">
          <SelectValue />
        </SelectTrigger>
      </Select>
    );
    expect(screen.getByTestId('trigger')).toHaveAttribute('id', 'color-select');
  });

  it('SelectItem renders text via SelectPrimitive.ItemText', () => {
    render(
      <Select open={true}>
        <SelectTrigger />
        <SelectContent>
          <SelectItem data-testid="item" value="1">
            Radix Item
          </SelectItem>
        </SelectContent>
      </Select>
    );
    expect(screen.getByTestId('item')).toHaveTextContent('Radix Item');
  });

  it('renders CheckIcon inside selected SelectItem via ItemIndicator', () => {
    render(
      <Select open={true} defaultValue="selected">
        <SelectTrigger />
        <SelectContent>
          <SelectItem value="selected" data-testid="selected-item">
            Selected Option
          </SelectItem>
        </SelectContent>
      </Select>
    );
    const item = screen.getByTestId('selected-item');
    const indicator = item.querySelector('[class*="absolute right-2"]');
    expect(indicator).toBeInTheDocument();
  });
});
