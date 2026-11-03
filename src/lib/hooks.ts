"use client";

import { useEffect, useSyncExternalStore, type RefObject } from "react";

const noop = () => () => {};

/** True after hydration, without a setState-in-effect. */
export function useMounted(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false
  );
}

/** Calls `onOutside` when a pointer-down lands outside `ref`. */
export function useClickOutside(ref: RefObject<HTMLElement | null>, active: boolean, onOutside: () => void) {
  useEffect(() => {
    if (!active) return;
    function handle(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    }
    document.addEventListener("pointerdown", handle);
    return () => document.removeEventListener("pointerdown", handle);
  }, [ref, active, onOutside]);
}
