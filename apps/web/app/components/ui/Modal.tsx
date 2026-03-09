import * as DialogPrimitive from "@radix-ui/react-dialog";
import React from "react";
import { cn } from "~/lib/utils";
import { Button } from "./Button";
import { Icon } from "./Icon";

export interface ModalProps extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "full";
  trigger?: React.ReactNode;
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
  full: "max-w-full w-[95vw] h-[95vh]",
};

export const Modal = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Content>, ModalProps>(
  ({ className, open, onOpenChange, title, description, children, size = "md", trigger, ...props }, ref) => {
    return (
      <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
        {trigger && <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>}
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay
            className={cn(
              "fixed inset-0 z-50 bg-black/60",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
              "duration-150",
            )}
          />
          <DialogPrimitive.Content
            ref={ref}
            className={cn(
              "fixed left-[50%] top-[50%] z-50 flex w-full translate-x-[-50%] translate-y-[-50%] flex-col",
              "bg-surface border border-border shadow-xl overflow-hidden",
              "duration-150 data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
              "data-[state=closed]:zoom-out-98 data-[state=open]:zoom-in-98",
              "rounded-lg font-body",
              sizeClasses[size],
              className,
            )}
            aria-describedby={!description ? undefined : undefined}
            {...props}
          >
            {(title || description) && (
              <div className="flex flex-col space-y-1.5 text-center sm:text-left p-4 border-b border-border">
                {title && (
                  <DialogPrimitive.Title className="text-base font-semibold leading-none tracking-tight font-display text-text">
                    {title}
                  </DialogPrimitive.Title>
                )}
                {description && (
                  <DialogPrimitive.Description className="text-sm text-text-secondary font-body">
                    {description}
                  </DialogPrimitive.Description>
                )}
              </div>
            )}

            <div className="flex-1">{children}</div>

            <DialogPrimitive.Close asChild>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-3 top-3 rounded-md opacity-50 transition-opacity duration-150 hover:opacity-100"
              >
                <Icon name="X" size={16} />
                <span className="sr-only">Close</span>
              </Button>
            </DialogPrimitive.Close>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    );
  },
);

Modal.displayName = DialogPrimitive.Content.displayName;

export const ModalHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 p-4 border-b border-border", className)} {...props} />
);

ModalHeader.displayName = "ModalHeader";

export const ModalFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-4 border-t border-border", className)} {...props} />
);

ModalFooter.displayName = "ModalFooter";

export const ModalTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-base font-semibold leading-none tracking-tight font-display text-text", className)}
    {...props}
  />
));
ModalTitle.displayName = DialogPrimitive.Title.displayName;

export const ModalDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-text-secondary font-body", className)}
    {...props}
  />
));
ModalDescription.displayName = DialogPrimitive.Description.displayName;

export const ModalContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("flex-1 font-body p-4", className)} {...props} />,
);
ModalContent.displayName = "ModalContent";
