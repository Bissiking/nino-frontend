"use client";

import { useId, type ComponentProps, type ReactNode } from "react";
import styles from "./ui.module.css";

type FieldInfo = { label: string; hint?: string; error?: string };
type Control = ComponentProps<"input"> | ComponentProps<"select"> | ComponentProps<"textarea">;

function FieldFrame({ id, label, hint, error, children }: FieldInfo & { id: string; children: ReactNode }) {
  return <div className={styles.field}>
    <label htmlFor={id}>{label}</label>
    {children}
    {hint ? <span id={`${id}-hint`} className={styles.muted}>{hint}</span> : null}
    {error ? <span id={`${id}-error`} className={styles.fieldError}>{error}</span> : null}
  </div>;
}

function describedBy(id: string, hint?: string, error?: string, extra?: string) {
  return [hint && `${id}-hint`, error && `${id}-error`, extra].filter(Boolean).join(" ") || undefined;
}

function useField({ id, hint, error, "aria-describedby": extra, "aria-invalid": invalid }: Control & FieldInfo) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  return { id: fieldId, "aria-describedby": describedBy(fieldId, hint, error, extra), "aria-invalid": error ? true as const : invalid };
}

export function TextField({ label, hint, error, className = "", ...props }: ComponentProps<"input"> & FieldInfo) {
  const a11y = useField({ ...props, label, hint, error });
  return <FieldFrame {...{ label, hint, error }} id={a11y.id}>
    <input {...props} {...a11y} className={`${styles.control} ${className}`} />
  </FieldFrame>;
}

export function Select({ label, hint, error, className = "", children, ...props }: ComponentProps<"select"> & FieldInfo) {
  const a11y = useField({ ...props, label, hint, error });
  return <FieldFrame {...{ label, hint, error }} id={a11y.id}>
    <select {...props} {...a11y} className={`${styles.control} ${className}`}>{children}</select>
  </FieldFrame>;
}

export function TextArea({ label, hint, error, className = "", ...props }: ComponentProps<"textarea"> & FieldInfo) {
  const a11y = useField({ ...props, label, hint, error });
  return <FieldFrame {...{ label, hint, error }} id={a11y.id}>
    <textarea rows={4} {...props} {...a11y} className={`${styles.control} ${className}`} />
  </FieldFrame>;
}
