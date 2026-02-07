import { X } from "lucide-react";
import type { ReactNode } from "react";

type ModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  width?: "md" | "lg" | "xl";
};

export function Modal({ open, title, onClose, children, footer, width = "lg" }: ModalProps) {
  if (!open) return null;

  return (
    <div className="ui-modal__overlay" role="dialog" aria-modal="true" aria-label={title}>
      <div className={["ui-modal", `ui-modal--${width}`].join(" ")}>
        <header className="ui-modal__header">
          <h3>{title}</h3>
          <button type="button" className="ui-modal__close" onClick={onClose} aria-label="Fechar modal">
            <X size={16} />
          </button>
        </header>

        <div className="ui-modal__body">{children}</div>

        {footer ? <footer className="ui-modal__footer">{footer}</footer> : null}
      </div>
    </div>
  );
}
