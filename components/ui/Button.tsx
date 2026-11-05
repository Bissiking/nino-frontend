import type { ComponentProps, ReactNode } from "react";
import { Icon } from "@/components/icons";
import styles from "./ui.module.css";

export type ButtonProps = ComponentProps<"button"> & {
  variant?: "primary" | "secondary" | "quiet" | "danger";
  size?: "compact" | "regular" | "tv";
  busy?: boolean;
};

export function Button({ variant = "primary", size = "regular", busy = false, disabled, className = "", children, type = "button", ...props }: ButtonProps) {
  return (
    <button {...props} type={type} disabled={disabled || busy} aria-busy={busy || undefined}
      className={`${styles.button} ${styles[variant]} ${styles[size]} ${className}`}>
      {busy ? <Icon name="loader" size={18} className={styles.spin} /> : null}
      {children}
    </button>
  );
}

export function IconButton({ label, children, ...props }: Omit<ButtonProps, "children" | "aria-label"> & { label: string; children: ReactNode }) {
  return <Button {...props} aria-label={label} title={label}><span className={styles.icon}>{children}</span></Button>;
}
