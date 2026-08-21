"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type CarouselViewportProps = {
  children: ReactNode;
  className: string;
  label: string;
  ordered?: boolean;
};

export function CarouselViewport({ children, className, label, ordered = false }: CarouselViewportProps) {
  const viewportRef = useRef<HTMLDivElement | HTMLOListElement | null>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);

  const updateControls = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const maximum = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    setCanGoBack(viewport.scrollLeft > 4);
    setCanGoForward(viewport.scrollLeft < maximum - 4);
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    updateControls();
    viewport.addEventListener("scroll", updateControls, { passive: true });
    const observer = new ResizeObserver(updateControls);
    observer.observe(viewport);
    return () => {
      viewport.removeEventListener("scroll", updateControls);
      observer.disconnect();
    };
  }, [children, updateControls]);

  function move(direction: -1 | 1) {
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.scrollBy({ left: direction * viewport.clientWidth * 0.82, behavior: "smooth" });
  }

  const setViewport = (node: HTMLDivElement | HTMLOListElement | null) => {
    viewportRef.current = node;
  };

  return (
    <div className="railCarousel">
      {ordered ? (
        <ol ref={setViewport} className={className} aria-label={label}>{children}</ol>
      ) : (
        <div ref={setViewport} className={className} aria-label={label}>{children}</div>
      )}
      <button className="railArrow railArrowPrevious" type="button" onClick={() => move(-1)} disabled={!canGoBack} aria-label={`Afficher les éléments précédents de ${label}`}>
        <ChevronLeft size={28} aria-hidden="true" />
      </button>
      <button className="railArrow railArrowNext" type="button" onClick={() => move(1)} disabled={!canGoForward} aria-label={`Afficher les éléments suivants de ${label}`}>
        <ChevronRight size={28} aria-hidden="true" />
      </button>
    </div>
  );
}
