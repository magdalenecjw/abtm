"use client";

import { useEffect } from "react";

/**
 * Small enhancements for the back-office drop-downs (native <details>,
 * which already work without JavaScript): only one open at a time, and
 * close on a click outside or Escape. Renders nothing.
 */
export function AdminMenuBehaviour() {
  useEffect(() => {
    const groups = () =>
      Array.from(
        document.querySelectorAll<HTMLDetailsElement>(".admin-menu-group"),
      );

    function onToggle(e: Event) {
      const opened = e.target as HTMLDetailsElement;
      if (!opened.open) return;
      groups().forEach((g) => {
        if (g !== opened) g.open = false;
      });
    }
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      groups().forEach((g) => {
        if (g.open && !g.contains(target)) g.open = false;
      });
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      groups().forEach((g) => {
        if (g.open) {
          g.open = false;
          g.querySelector("summary")?.focus();
        }
      });
    }

    const all = groups();
    all.forEach((g) => g.addEventListener("toggle", onToggle));
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      all.forEach((g) => g.removeEventListener("toggle", onToggle));
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return null;
}
