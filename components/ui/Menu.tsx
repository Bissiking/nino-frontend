"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/icons";
import styles from "./menu.module.css";

export type MenuItem = {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  href?: string;
  onSelect?: () => void;
  selected?: boolean;
  disabled?: boolean;
};
export type MenuGroup = { label: string; items: MenuItem[] };
export type MenuProps = {
  label: string;
  trigger: ReactNode;
  groups: MenuGroup[];
  triggerClassName?: string;
  active?: boolean;
  placement?: "bottom" | "top";
  align?: "start" | "end";
  onOpenChange?: (open: boolean) => void;
};

// Navigation links remain links; command/choice items keep native button behavior.
export function Menu({ label, trigger, groups, triggerClassName, active, placement = "bottom", align = "end", onOpenChange }: MenuProps) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const initialIndex = useRef(0);
  const typeahead = useRef({ text: "", time: 0 });
  const id = useId();
  function changeOpen(value: boolean, restore = false) {
    setOpen(value);
    onOpenChange?.(value);
    if (restore) button.current?.focus();
  }
  function controls() {
    return Array.from(panel.current?.querySelectorAll<HTMLElement>("[role^='menuitem']:not(:disabled)") ?? []);
  }
  useLayoutEffect(() => {
    if (!open) return;
    function position() {
      if (!button.current || !panel.current) return;
      const rect = button.current.getBoundingClientRect();
      const overlay = panel.current;
      const above = rect.top - 20;
      const below = window.innerHeight - rect.bottom - 20;
      const useTop = placement === "top" ? above > 160 || above > below : below < 220 && above > below;
      overlay.style.maxHeight = `${Math.max(100, Math.min(540, useTop ? above : below))}px`;
      const width = overlay.getBoundingClientRect().width;
      overlay.style.left = `${Math.max(12, Math.min(window.innerWidth - width - 12, align === "end" ? rect.right - width : rect.left))}px`;
      overlay.style.right = "auto";
      overlay.style.top = useTop ? "auto" : `${rect.bottom + 10}px`;
      overlay.style.bottom = useTop ? `${window.innerHeight - rect.top + 10}px` : "auto";
    }
    position();
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    return () => { window.removeEventListener("resize", position); window.removeEventListener("scroll", position, true); };
  }, [open, placement, align]);
  useEffect(() => {
    if (!open) return;
    const entries = Array.from(panel.current?.querySelectorAll<HTMLElement>("[role^='menuitem']:not(:disabled)") ?? []);
    (initialIndex.current === -1 ? entries.at(-1) : entries[0])?.focus();
    function outside(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node) && !panel.current?.contains(event.target as Node)) { setOpen(false); onOpenChange?.(false); }
    }
    // Only one command menu at a time, even across unrelated shell controls.
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open, onOpenChange]);

  return <div ref={root} className={styles.root} data-open={open || undefined} onBlur={(event) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node) && !panel.current?.contains(event.relatedTarget as Node)) changeOpen(false);
  }}>
    <button ref={button} type="button" className={`${styles.trigger} ${triggerClassName ?? ""}`} aria-label={label}
      aria-haspopup="menu" aria-expanded={open} aria-controls={open ? id : undefined} data-active={active || undefined}
      onClick={() => { initialIndex.current = 0; changeOpen(!open); }}
      onKeyDown={(event) => {
        if (!["ArrowDown", "ArrowUp"].includes(event.key)) return;
        event.preventDefault(); event.stopPropagation(); initialIndex.current = event.key === "ArrowUp" ? -1 : 0; changeOpen(true);
      }}>{trigger}</button>
    {open ? createPortal(<div id={id} ref={panel} role="menu" aria-label={label} className={styles.panel} data-placement={placement} data-align={align}
      onKeyDown={(event) => {
        if (["Escape", "BrowserBack", "GoBack"].includes(event.key)) { event.preventDefault(); event.stopPropagation(); changeOpen(false, true); return; }
        if (event.key === "Tab") { changeOpen(false, true); return; }
        const entries = controls();
        const index = entries.indexOf(document.activeElement as HTMLElement);
        let next: HTMLElement | undefined;
        if (event.key === "ArrowDown") next = entries[(index + 1) % entries.length];
        else if (event.key === "ArrowUp") next = entries[(index - 1 + entries.length) % entries.length];
        else if (event.key === "Home") next = entries[0];
        else if (event.key === "End") next = entries.at(-1);
        else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && event.key !== " ") {
          const now = Date.now();
          typeahead.current.text = (now - typeahead.current.time > 600 ? "" : typeahead.current.text) + event.key.toLocaleLowerCase("fr");
          typeahead.current.time = now;
          next = [...entries.slice(index + 1), ...entries.slice(0, index + 1)].find((item) => item.dataset.label?.startsWith(typeahead.current.text));
        }
        if (next) { event.preventDefault(); event.stopPropagation(); next.focus(); next.scrollIntoView({ block: "nearest" }); }
      }}>
      {groups.map((group, index) => <div role="group" aria-labelledby={`${id}-${index}`} key={group.label} className={styles.group}>
        <p id={`${id}-${index}`} className={styles.heading}>{group.label}</p>
        {group.items.map((item) => {
          const choice = item.selected !== undefined;
          const content = <>{item.icon ? <Icon name={item.icon} size={20} /> : null}<span><strong>{item.label}</strong>{item.description ? <small>{item.description}</small> : null}</span>{choice && item.selected ? <Icon name="check" size={18} /> : null}</>;
          const props = { className: styles.item, "data-label": item.label.toLocaleLowerCase("fr"), "data-selected": item.selected || undefined, role: choice ? "menuitemradio" : "menuitem", "aria-checked": choice ? item.selected : undefined, tabIndex: -1, onClick: () => { item.onSelect?.(); changeOpen(false, !item.href); } };
          return item.href && !item.disabled ? <Link key={item.id} href={item.href} {...props}>{content}</Link> : <button key={item.id} type="button" disabled={item.disabled} {...props}>{content}</button>;
        })}
      </div>)}
    </div>, document.fullscreenElement ?? document.body) : null}
  </div>;
}
