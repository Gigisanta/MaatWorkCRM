import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '../ui/dialog';

describe('Dialog', () => {
  it('renders Dialog component without crashing', () => {
    render(
      <Dialog open={false}>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent data-testid="dialog-content">
          <DialogHeader>
            <DialogTitle>Title</DialogTitle>
            <DialogDescription>Description</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('renders DialogTrigger as a button', () => {
    render(
      <Dialog open={false}>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByRole('button', { name: /open dialog/i })).toBeInTheDocument();
  });

  it('renders DialogContent when open', () => {
    render(
      <Dialog open={true}>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent data-testid="dialog-content">
          <DialogTitle>My Title</DialogTitle>
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByTestId('dialog-content')).toBeInTheDocument();
  });

  it('renders DialogTitle', () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogTitle data-testid="dialog-title">Test Title</DialogTitle>
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByTestId('dialog-title')).toBeInTheDocument();
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('renders DialogDescription', () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogDescription data-testid="dialog-desc">Test Description</DialogDescription>
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByTestId('dialog-desc')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('renders DialogHeader', () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogHeader data-testid="dialog-header">
            <DialogTitle>Title</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByTestId('dialog-header')).toBeInTheDocument();
  });

  it('renders DialogFooter', () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogFooter data-testid="dialog-footer">
            <button>Cancel</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByTestId('dialog-footer')).toBeInTheDocument();
  });

  it('renders DialogClose button', () => {
    render(
      <Dialog open={true}>
        <DialogContent data-testid="dialog-content">
          <DialogClose data-testid="dialog-close" />
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByTestId('dialog-close')).toBeInTheDocument();
  });

  it('DialogClose has sr-only close text', () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogClose />
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByText('Cerrar')).toBeInTheDocument();
  });

  it('renders children inside DialogContent', () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <p data-testid="custom-content">Custom content here</p>
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByTestId('custom-content')).toBeInTheDocument();
  });

  it('hides DialogContent when open is false', () => {
    render(
      <Dialog open={false}>
        <DialogContent data-testid="dialog-content">
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>
    );
    expect(screen.queryByTestId('dialog-content')).not.toBeInTheDocument();
  });

  it('applies custom className to DialogContent', () => {
    render(
      <Dialog open={true}>
        <DialogContent data-testid="dialog-content" className="custom-content-class">
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByTestId('dialog-content')).toHaveClass('custom-content-class');
  });

  it('applies custom className to DialogHeader', () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogHeader data-testid="dialog-header" className="custom-header-class">
            <DialogTitle>Title</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByTestId('dialog-header')).toHaveClass('custom-header-class');
  });

  it('applies custom className to DialogFooter', () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogFooter data-testid="dialog-footer" className="custom-footer-class">
            <button>Action</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByTestId('dialog-footer')).toHaveClass('custom-footer-class');
  });

  it('applies custom className to DialogTitle', () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogTitle data-testid="dialog-title" className="custom-title-class">
            Title
          </DialogTitle>
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByTestId('dialog-title')).toHaveClass('custom-title-class');
  });

  it('applies custom className to DialogDescription', () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogDescription data-testid="dialog-desc" className="custom-desc-class">
            Description
          </DialogDescription>
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByTestId('dialog-desc')).toHaveClass('custom-desc-class');
  });

  it('shows close button by default', () => {
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByText('Cerrar')).toBeInTheDocument();
  });

  it('hides close button when showCloseButton is false', () => {
    render(
      <Dialog open={true}>
        <DialogContent showCloseButton={false}>
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>
    );
    expect(screen.queryByText('Cerrar')).not.toBeInTheDocument();
  });

  it('renders DialogPortal - content is outside normal DOM tree', () => {
    render(
      <Dialog open={true}>
        <DialogContent data-testid="dialog-content">
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>
    );
    // Radix Portal renders content at document root, outside the test container
    const content = screen.getByTestId('dialog-content');
    expect(content).toBeInTheDocument();
    // The content should be in the DOM (portal renders at root level)
    expect(document.body.contains(content)).toBe(true);
  });

  it('renders DialogOverlay with data-slot', () => {
    render(
      <Dialog open={true}>
        <DialogContent data-testid="dialog-content">
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>
    );
    const overlay = document.querySelector('[data-slot="dialog-overlay"]');
    expect(overlay).toBeInTheDocument();
  });

  it('renders multiple Dialog components independently', () => {
    render(
      <>
        <Dialog open={true}>
          <DialogContent data-testid="dialog-1">
            <DialogTitle>Title 1</DialogTitle>
          </DialogContent>
        </Dialog>
        <Dialog open={false}>
          <DialogContent data-testid="dialog-2">
            <DialogTitle>Title 2</DialogTitle>
          </DialogContent>
        </Dialog>
      </>
    );
    expect(screen.getByTestId('dialog-1')).toBeInTheDocument();
    expect(screen.queryByTestId('dialog-2')).not.toBeInTheDocument();
  });
});
