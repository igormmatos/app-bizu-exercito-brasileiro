import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "ghost" | "danger" | "outline";
type ButtonSize = "sm" | "md";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  startIcon?: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  startIcon,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={["ui-btn", `ui-btn--${variant}`, `ui-btn--${size}`, className].filter(Boolean).join(" ")}
    >
      {startIcon ? <span className="ui-btn__icon">{startIcon}</span> : null}
      <span>{children}</span>
    </button>
  );
}
