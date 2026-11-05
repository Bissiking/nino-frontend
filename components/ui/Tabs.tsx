"use client";

import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import styles from "./ui.module.css";

export type TabItem = { id: string; label: string; content: ReactNode; disabled?: boolean };

// Manual activation: arrows move focus; Enter/Space selects. No network work on focus.
export function Tabs({ label, items, activeId, onChange }: { label: string; items: TabItem[]; activeId: string; onChange: (id: string) => void }) {
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  function move(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    const enabled = items.map((item, i) => item.disabled ? -1 : i).filter((i) => i !== -1);
    if (!enabled.length) return;
    event.preventDefault();
    const position = enabled.indexOf(index);
    const next = event.key === "Home" ? enabled[0] : event.key === "End" ? enabled.at(-1)! : enabled[(position + (event.key === "ArrowRight" ? 1 : -1) + enabled.length) % enabled.length];
    refs.current[next]?.focus();
  }
  return <div className={styles.tabs}>
    <div role="tablist" aria-label={label} className={styles.tabList}>
      {items.map((item, index) => <button key={item.id} ref={(element) => { refs.current[index] = element; }}
        type="button" role="tab" id={`${id}-tab-${index}`} aria-controls={`${id}-panel-${index}`}
        aria-selected={item.id === activeId} disabled={item.disabled} tabIndex={item.id === activeId ? 0 : -1}
        onKeyDown={(event) => move(event, index)} onClick={() => onChange(item.id)}>{item.label}</button>)}
    </div>
    {items.map((item, index) => <div key={item.id} id={`${id}-panel-${index}`} role="tabpanel"
      aria-labelledby={`${id}-tab-${index}`} hidden={item.id !== activeId} tabIndex={0} className={styles.tabPanel}>{item.content}</div>)}
  </div>;
}
