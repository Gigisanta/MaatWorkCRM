import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
} from '@/components/ui/card';

describe('Card', () => {
  it('renders card container', () => {
    const { container } = render(<Card>Content</Card>);
    expect(container.firstChild).toBeInTheDocument();
    expect(container.firstChild).toHaveAttribute('data-slot', 'card');
  });

  it('renders card header', () => {
    const { container } = render(<CardHeader>Header content</CardHeader>);
    expect(container.firstChild).toBeInTheDocument();
    expect(container.firstChild).toHaveAttribute('data-slot', 'card-header');
  });

  it('renders card title', () => {
    render(<CardTitle>Project Overview</CardTitle>);
    expect(screen.getByText('Project Overview')).toBeInTheDocument();
    expect(screen.getByText('Project Overview')).toHaveAttribute('data-slot', 'card-title');
  });

  it('renders card description', () => {
    render(<CardDescription>A short description</CardDescription>);
    expect(screen.getByText('A short description')).toBeInTheDocument();
    expect(screen.getByText('A short description')).toHaveAttribute('data-slot', 'card-description');
  });

  it('renders card content', () => {
    const { container } = render(<CardContent>Main content</CardContent>);
    expect(container.firstChild).toBeInTheDocument();
    expect(container.firstChild).toHaveAttribute('data-slot', 'card-content');
  });

  it('renders card footer', () => {
    const { container } = render(<CardFooter>Footer content</CardFooter>);
    expect(container.firstChild).toBeInTheDocument();
    expect(container.firstChild).toHaveAttribute('data-slot', 'card-footer');
  });

  it('renders card action', () => {
    const { container } = render(<CardAction>Action</CardAction>);
    expect(container.firstChild).toBeInTheDocument();
    expect(container.firstChild).toHaveAttribute('data-slot', 'card-action');
  });

  it('composes card subcomponents together', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Description text</CardDescription>
          <CardAction>Edit</CardAction>
        </CardHeader>
        <CardContent>Body content</CardContent>
        <CardFooter>Footer text</CardFooter>
      </Card>
    );

    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Description text')).toBeInTheDocument();
    expect(screen.getByText('Body content')).toBeInTheDocument();
    expect(screen.getByText('Footer text')).toBeInTheDocument();
  });

  it('applies custom className to Card', () => {
    const { container } = render(<Card className="my-custom-card">Content</Card>);
    expect(container.firstChild).toHaveClass('my-custom-card');
  });

  it('applies custom className to CardHeader', () => {
    const { container } = render(<CardHeader className="my-custom-header">Header</CardHeader>);
    expect(container.firstChild).toHaveClass('my-custom-header');
  });
});
