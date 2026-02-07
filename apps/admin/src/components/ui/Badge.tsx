import type { HTMLAttributes } from "react";

type BadgeVariant = "success" | "warning" | "neutral" | "info";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

export function Badge({ variant = "neutral", className, children, ...props }: BadgeProps) {
  return (
    <span {...props} className={["ui-badge", `ui-badge--${variant}`, className].filter(Boolean).join(" ")}>
      {children}
    </span>
  );
}
