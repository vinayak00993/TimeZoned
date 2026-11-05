"use client";

import { flushSync } from "react-dom";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTimezoneStore } from "@/store/timezone-store";

type DocWithVT = Document & {
  startViewTransition?: (cb: () => void) => { ready: Promise<void> };
};

export function ThemeToggle() {
  const toggleTheme = useTimezoneStore((s) => s.toggleTheme);

  async function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    const doc = document as DocWithVT;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!doc.startViewTransition || reduceMotion) {
      toggleTheme();
      return;
    }

    // Reveal the new theme as a circle growing out of the button.
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

    const transition = doc.startViewTransition(() => {
      flushSync(() => toggleTheme());
    });
    try {
      await transition.ready;
    } catch {
      return;
    }
    document.documentElement.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
      { duration: 700, easing: "cubic-bezier(0.4, 0, 0.2, 1)", pseudoElement: "::view-transition-new(root)" }
    );
  }

  return (
    <Button variant="ghost" size="icon" onClick={handleClick} aria-label="Toggle dark mode">
      <span className="relative block size-4" aria-hidden="true">
        <Sun className="absolute inset-0 size-4 rotate-90 scale-50 opacity-0 transition-all duration-500 ease-out dark:rotate-0 dark:scale-100 dark:opacity-100" />
        <Moon className="absolute inset-0 size-4 rotate-0 scale-100 opacity-100 transition-all duration-500 ease-out dark:-rotate-90 dark:scale-50 dark:opacity-0" />
      </span>
    </Button>
  );
}
