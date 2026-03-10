"use client";

import type React from "react";
import { forwardRef, useId, useState } from "react";
import { cn } from "~/lib/utils";
import { Icon, type IconName } from "./Icon";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  error?: string | null | undefined;
  placeholder?: string;
  leftIcon?: IconName | undefined;
  rightIcon?: IconName | undefined;
  onRightIconClick?: (() => void) | undefined;
  rightIconAriaLabel?: string;
  size?: "sm" | "md" | "lg";
  showPasswordToggle?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    error,
    className = "",
    leftIcon,
    rightIcon,
    onRightIconClick,
    size = "md",
    showPasswordToggle = false,
    type,
    ...props
  }: InputProps,
  ref: React.ForwardedRef<HTMLInputElement>,
) {
  const generatedId = useId();
  const id = props.id || generatedId;
  const errorId = `${id}-error`;
  const [showPassword, setShowPassword] = useState(false);

  const errorValue = error ?? null;
  const isPassword = type === "password";
  const inputType = isPassword && showPasswordToggle && showPassword ? "text" : type;

  const sizeClasses = {
    sm: "h-8 text-sm px-3",
    md: "h-9 text-sm px-3",
    lg: "h-10 text-base px-3",
  };

  const iconPadding = {
    sm: leftIcon ? "pl-9" : rightIcon ? "pr-9" : "",
    md: leftIcon ? "pl-9" : rightIcon ? "pr-9" : "",
    lg: leftIcon ? "pl-10" : rightIcon ? "pr-10" : "",
  };

  return (
    <div className="w-full group">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-text-secondary mb-1.5 font-body transition-colors group-focus-within:text-primary"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted group-focus-within:text-primary transition-colors">
            <Icon name={leftIcon} size={16} />
          </div>
        )}
        <input
          ref={ref}
          id={id}
          type={inputType}
          aria-invalid={!!errorValue}
          aria-describedby={errorValue ? errorId : props["aria-describedby"]}
          className={cn(
            "w-full border rounded-lg transition-all duration-150 ease-out font-body",
            "bg-surface text-text placeholder:text-text-muted",
            "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
            sizeClasses[size],
            iconPadding[size],
            rightIcon && !leftIcon && "pr-9",
            isPassword && showPasswordToggle && "pr-9",
            errorValue
              ? "border-error focus:border-error focus:ring-error/50"
              : "border-border hover:border-border-hover",
            props.disabled && "opacity-50 cursor-not-allowed bg-background",
            className,
          )}
          {...props}
        />
        {rightIcon &&
          !(isPassword && showPasswordToggle) &&
          (onRightIconClick ? (
            <button
              type="button"
              onClick={onRightIconClick}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary transition-colors cursor-pointer"
              aria-label={props.rightIconAriaLabel || "Clear"}
            >
              <Icon name={rightIcon} size={16} />
            </button>
          ) : (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted group-focus-within:text-primary transition-colors">
              <Icon name={rightIcon} size={16} />
            </div>
          ))}
        {isPassword && showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary transition-colors cursor-pointer"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={showPassword}
          >
            <Icon name={showPassword ? "eye-off" : "eye"} size={16} />
          </button>
        )}
      </div>
      {errorValue && (
        <p id={errorId} className="mt-1.5 text-sm text-error font-body">
          {errorValue}
        </p>
      )}
    </div>
  );
});
Input.displayName = "Input";
