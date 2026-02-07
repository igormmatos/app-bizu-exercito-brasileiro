import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  title?: ReactNode;
  subtitle?: ReactNode;
};

export function Card({ title, subtitle, className, children, ...props }: CardProps) {
  return (
    <div {...props} className={["ui-card", className].filter(Boolean).join(" ")}>
      {title || subtitle ? (
        <header className="ui-card__header">
          {title ? <h3 className="ui-card__title">{title}</h3> : null}
          {subtitle ? <p className="ui-card__subtitle">{subtitle}</p> : null}
        </header>
      ) : null}
      {children}
    </div>
  );
}
