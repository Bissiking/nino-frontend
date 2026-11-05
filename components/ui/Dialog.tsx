"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Icon } from "@/components/icons";
import { IconButton } from "./Button";
import styles from "./ui.module.css";

export type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  presentation?: "dialog" | "sheet";
};

// Native dialog owns the modal focus scope, inert background and Escape key.
// Keep this component mounted so the browser can return focus to the opener.
export function Dialog({ open, onClose, title, description, children, presentation = "dialog" }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  return <dialog ref={ref} className={`${styles.dialog} ${presentation === "sheet" ? styles.sheet : ""}`}
    aria-modal={open ? true : undefined} aria-labelledby={`${id}-title`} aria-describedby={description ? `${id}-description` : undefined}
    onCancel={(event) => { event.preventDefault(); onClose(); }}
    onKeyDown={(event) => {
      if (["BrowserBack", "GoBack"].includes(event.key)) { event.preventDefault(); onClose(); return; }
      if (event.key !== "Tab") return;
      const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("a[href], button, input, select, textarea, [tabindex]"))
        .filter((element) => element.tabIndex >= 0 && !element.matches(":disabled") && !element.closest("[hidden], [inert]") && element.getClientRects().length > 0);
      const first = controls[0];
      const last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }}>
    <header className={styles.dialogHeader}>
      <h2 id={`${id}-title`}>{title}</h2>
      <IconButton label="Fermer" variant="quiet" onClick={onClose}><Icon name="close" size={20} /></IconButton>
    </header>
    {description ? <p id={`${id}-description`} className={styles.muted}>{description}</p> : null}
    {children}
  </dialog>;
}

export function Sheet(props: Omit<DialogProps, "presentation">) {
  return <Dialog {...props} presentation="sheet" />;
}
