import type { ComponentProps, ReactNode } from "react";
import { Icon } from "@/components/icons";
import { Button } from "./Button";
import styles from "./ui.module.css";

export function Table({ caption, children, ...props }: ComponentProps<"table"> & { caption: string }) {
  return <div className={styles.tableScroll} role="region" aria-label={caption} tabIndex={0}><table {...props} className={`${styles.table} ${props.className ?? ""}`}><caption>{caption}</caption>{children}</table></div>;
}

// pageCount comes from the caller's actual pagination contract; no inferred totals.
export function Pagination({ page, pageCount, onPageChange, disabled = false }: { page: number; pageCount: number; onPageChange: (page: number) => void; disabled?: boolean }) {
  if (pageCount < 1) return null;
  return <nav aria-label="Pagination" className={styles.pagination}>
    <Button variant="secondary" disabled={disabled || page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Page précédente"><Icon name="chevron-left" size={18} />Précédent</Button>
    <span role="status">Page {page} sur {pageCount}</span>
    <Button variant="secondary" disabled={disabled || page >= pageCount} onClick={() => onPageChange(page + 1)} aria-label="Page suivante">Suivant<Icon name="chevron-right" size={18} /></Button>
  </nav>;
}

export function MediaArtwork({ children, label, aspect = "video" }: { children?: ReactNode; label: string; aspect?: "video" | "poster" | "short" }) {
  return <div className={styles.artwork} data-aspect={aspect} role={children ? undefined : "img"} aria-label={children ? undefined : label}>{children ?? <span>{label}</span>}</div>;
}
