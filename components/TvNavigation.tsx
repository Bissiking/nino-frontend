"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const focusableSelector = "a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex='-1'])";

function focusKey(element: HTMLElement) {
  return element.dataset.focusKey ?? element.getAttribute("href") ?? element.getAttribute("aria-label") ?? element.textContent?.trim() ?? "";
}

export function TvNavigation() {
  const pathname = usePathname();

  useEffect(() => {
    const savedKey = window.sessionStorage.getItem(`nino.focus:${pathname}`);
    if (!savedKey) return;
    const candidate = Array.from(document.querySelectorAll<HTMLElement>(focusableSelector)).find((element) => focusKey(element) === savedKey);
    candidate?.focus({ preventScroll: true });
  }, [pathname]);

  useEffect(() => {
    function rememberFocus(event: FocusEvent) {
      const element = event.target instanceof HTMLElement ? event.target.closest<HTMLElement>(focusableSelector) : null;
      if (element) window.sessionStorage.setItem(`nino.focus:${pathname}`, focusKey(element));
    }

    function moveFocus(event: KeyboardEvent) {
      const directions = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);
      if (!directions.has(event.key)) return;
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;

      const scope = document.querySelector<HTMLElement>("[aria-modal='true']") ?? document;
      const elements = Array.from(scope.querySelectorAll<HTMLElement>(focusableSelector)).filter((element) => {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.visibility !== "hidden" && style.display !== "none" && rect.width > 0 && rect.height > 0;
      });
      if (!elements.length) return;

      const current = document.activeElement instanceof HTMLElement && elements.includes(document.activeElement) ? document.activeElement : null;
      if (!current) {
        event.preventDefault();
        elements[0].focus();
        return;
      }

      const origin = current.getBoundingClientRect();
      const originX = origin.left + origin.width / 2;
      const originY = origin.top + origin.height / 2;
      const vertical = event.key === "ArrowUp" || event.key === "ArrowDown";
      const positive = event.key === "ArrowRight" || event.key === "ArrowDown";

      const next = elements
        .filter((element) => element !== current)
        .map((element) => {
          const rect = element.getBoundingClientRect();
          const dx = rect.left + rect.width / 2 - originX;
          const dy = rect.top + rect.height / 2 - originY;
          const primary = vertical ? dy : dx;
          const cross = vertical ? dx : dy;
          return { element, primary, score: Math.abs(primary) * 5 + Math.abs(cross) };
        })
        .filter(({ primary }) => positive ? primary > 8 : primary < -8)
        .sort((a, b) => a.score - b.score)[0]?.element;

      if (!next) return;
      event.preventDefault();
      next.focus({ preventScroll: true });
      next.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center", inline: "center" });
    }

    document.addEventListener("focusin", rememberFocus);
    document.addEventListener("keydown", moveFocus);
    return () => {
      document.removeEventListener("focusin", rememberFocus);
      document.removeEventListener("keydown", moveFocus);
    };
  }, [pathname]);

  return null;
}
