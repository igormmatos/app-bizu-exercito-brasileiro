import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  helperText?: string;
};

export function Input({ label, helperText, className, id, ...props }: InputProps) {
  const inputId = id ?? props.name ?? undefined;

  return (
    <label className="ui-field" htmlFor={inputId}>
      {label ? <span className="ui-field__label">{label}</span> : null}
      <input {...props} id={inputId} className={["ui-input", className].filter(Boolean).join(" ")} />
      {helperText ? <small className="ui-field__helper">{helperText}</small> : null}
    </label>
  );
}
