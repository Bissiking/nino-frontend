import type { ComponentProps, ReactNode } from "react";
import "./tokens.css";
import styles from "./ui.module.css";

export function UiTheme({ children, tv = false, fullHeight = true }: { children: ReactNode; tv?: boolean; fullHeight?: boolean }) {
  return <div className={`${styles.theme} ${fullHeight ? styles.canvas : ""} ${tv ? styles.tv : ""}`} data-nino-ui="v9">{children}</div>;
}

export function PageContainer({ children, className = "", ...props }: ComponentProps<"div">) {
  return <div {...props} className={`${styles.page} ${className}`}>{children}</div>;
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return <header className={styles.pageHeader}><div><h1>{title}</h1>{description ? <p>{description}</p> : null}</div>{actions ? <div className={styles.actions}>{actions}</div> : null}</header>;
}

export function Panel({ title, children, className = "", ...props }: ComponentProps<"section"> & { title: string }) {
  return <section {...props} className={`${styles.panel} ${className}`}><h2>{title}</h2>{children}</section>;
}

export function Card({ children, className = "", ...props }: ComponentProps<"article">) {
  return <article {...props} className={`${styles.card} ${className}`}>{children}</article>;
}

export function Breadcrumb({ children }: { children: ReactNode }) {
  return <nav aria-label="Fil d’Ariane" className={styles.breadcrumb}><ol>{children}</ol></nav>;
}
