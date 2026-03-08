"use client";

import type React from "react";
import { forwardRef, useId, useState } from "react";
import { cn } from "~/lib/utils";
import { Icon, type IconName } from "./Icon";

// UI/UX REFINED BY JULES v2
export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  error?: string | null | undefined;
  placeholder?: string;
  leftIcon?: IconName | undefined;
  rightIcon?: IconName | undefined;
  /** Callback when right icon is clicked (makes icon interactive) */
  onRightIconClick?: (() => void) | undefined;
  /** Accessible label for the right icon button */
  rightIconAriaLabel?: string;
  size?: "sm" | "md" | "lg";
  showPasswordToggle?: boolean;
}

/**
 * Input component with brand styling.
 */
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
    sm: "h-9 text-sm px-3",
    md: "h-10 text-base px-3",
    lg: "h-12 text-base px-4",
  };

  const iconPadding = {
    sm: leftIcon ? "pl-10" : rightIcon ? "pr-10" : "",
    md: leftIcon ? "pl-10" : rightIcon ? "pr-10" : "",
    lg: leftIcon ? "pl-12" : rightIcon ? "pr-12" : "",
  };

  return (
    <div className="w-full group">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-surface-200 mb-1.5 font-body transition-colors group-focus-within:text-brand-400"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-surface-500 group-focus-within:text-brand-400 transition-colors">
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
            "w-full border rounded-xl transition-all duration-300 ease-out font-body",
            "bg-surface-900/50 text-surface-100 placeholder:text-surface-600",
            "focus:outline-none focus:ring-2 focus:ring-brand-600/40 focus:border-brand-600 focus:shadow-[0_0_30px_rgba(139,92,246,0.15)] focus:scale-[1.01]",
            "active:scale-[1.01]",
            sizeClasses[size],
            iconPadding[size],
            rightIcon && !leftIcon && "pr-10",
            isPassword && showPasswordToggle && "pr-10",
            errorValue
              ? "border-red-600/80 focus:border-red-600 focus:ring-red-600/40 focus:shadow-[0_0_30px_rgba(239,68,68,0.15)] animate-[pulse_2s_ease-in-out_infinite]"
              : "border-surface-800 hover:border-brand-600/60 hover:shadow-[0_0_15px_rgba(139,92,246,0.1)]",
            props.disabled && "opacity-50 cursor-not-allowed bg-surface-950 hover:border-surface-800",
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-brand-400 transition-colors cursor-pointer"
              aria-label={props.rightIconAriaLabel || "Clear"}
            >
              <Icon name={rightIcon} size={16} />
            </button>
          ) : (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-surface-500 group-focus-within:text-brand-400 transition-colors">
              <Icon name={rightIcon} size={16} />
            </div>
          ))}
        {isPassword && showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-brand-400 transition-colors cursor-pointer"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={showPassword}
          >
            <Icon name={showPassword ? "eye-off" : "eye"} size={16} />
          </button>
        )}
      </div>
      {errorValue && (
        <p id={errorId} className="mt-1.5 text-sm text-red-400 font-body animate-in fade-in slide-in-from-top-1">
          {errorValue}
        </p>
      )}
    </div>
  );
});
Input.displayName = "Input";
