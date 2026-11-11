import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  href?: string;
  external?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  download?: boolean | string;
}

const variantStyles = {
  primary:
    "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] border border-[var(--btn-primary-border)] hover:bg-[var(--btn-primary-hover-bg)] hover:border-[var(--btn-primary-hover-border)] shadow-[var(--btn-primary-glow)] font-semibold active:scale-[0.98]",
  secondary:
    "bg-[var(--btn-secondary-bg)] text-[var(--btn-secondary-text)] border border-[var(--btn-secondary-border)] hover:bg-[var(--btn-secondary-hover-bg)] hover:border-[var(--btn-secondary-hover-border)] active:scale-[0.98]",
  outline:
    "bg-[var(--btn-outline-bg)] text-[var(--btn-outline-text)] border border-[var(--btn-outline-border)] hover:bg-[var(--btn-outline-hover-bg)] hover:border-[var(--btn-outline-hover-border)] active:scale-[0.98]",
  ghost:
    "bg-transparent text-content-secondary hover:text-content-primary hover:bg-surface/50 active:scale-[0.98]",
};

const sizeStyles = {
  sm: "px-3.5 py-1.5 text-xs tracking-wide",
  md: "px-5 py-2.5 text-sm font-medium",
  lg: "px-7 py-3.5 text-base font-medium",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      href,
      external,
      download,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses = cn(
      "inline-flex items-center justify-center gap-2 rounded-full transition-all duration-200 select-none",
      "font-heading tracking-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
      "disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed",
      variantStyles[variant],
      sizeStyles[size],
      className
    );

    const content = (
      <>
        {leftIcon && (
          <span className="inline-flex shrink-0 text-current" aria-hidden="true">
            {leftIcon}
          </span>
        )}
        <span>{children}</span>
        {rightIcon && (
          <span className="inline-flex shrink-0 text-current" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </>
    );

    if (href) {
      if (external || download) {
        return (
          <a
            href={href}
            className={baseClasses}
            target={external ? "_blank" : undefined}
            rel={external ? "noopener noreferrer" : undefined}
            download={download}
          >
            {content}
          </a>
        );
      }

      return (
        <Link href={href} className={baseClasses}>
          {content}
        </Link>
      );
    }

    return (
      <button
        ref={ref}
        type={props.type || "button"}
        className={baseClasses}
        disabled={disabled}
        {...props}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
