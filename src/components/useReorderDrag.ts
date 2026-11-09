"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const HOLD_MS = 220;
const SLOP_PX = 6;
const SETTLE_MS = 200;

interface Session {
  index: number;
  over: number;
  pointerId: number;
  startX: number;
  startY: number;
  dx: number;
  lifted: boolean;
  step: number;
  minDx: number;
  maxDx: number;
  timer: number | null;
  raf: number | null;
}

/**
 * Press-and-hold (or pull sideways) to reorder a row of equal-width cards.
 * Transforms are written straight to the elements during the drag so nothing
 * re-renders per frame; React only sees the lift and the final order.
 */
export function useReorderDrag(count: number, onReorder: (from: number, to: number) => void) {
  const [lifted, setLifted] = useState<number | null>(null);
  const els = useRef<(HTMLElement | null)[]>([]);
  const session = useRef<Session | null>(null);
  const justDragged = useRef(false);

  const setEl = useCallback(
    (i: number) => (el: HTMLElement | null) => {
      els.current[i] = el;
    },
    []
  );

  const paint = useCallback(() => {
    const s = session.current;
    if (!s) return;
    s.raf = null;
    els.current.forEach((el, i) => {
      if (!el) return;
      if (i === s.index) {
        el.style.transform = `translateX(${s.dx}px) scale(1.04)`;
        return;
      }
      let shift = 0;
      if (s.index < s.over && i > s.index && i <= s.over) shift = -s.step;
      else if (s.over < s.index && i >= s.over && i < s.index) shift = s.step;
      el.style.transform = shift ? `translateX(${shift}px)` : "";
    });
  }, []);

  const preventScroll = useCallback((e: TouchEvent) => e.preventDefault(), []);

  const cleanup = useCallback(() => {
    const s = session.current;
    if (s?.timer) clearTimeout(s.timer);
    if (s?.raf) cancelAnimationFrame(s.raf);
    session.current = null;
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onCancel);
    document.removeEventListener("touchmove", preventScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lift = useCallback(() => {
    const s = session.current;
    if (!s || s.lifted) return;
    if (s.timer) clearTimeout(s.timer);
    s.timer = null;
    const rects = els.current.map((el) => el?.getBoundingClientRect());
    const mine = rects[s.index];
    if (!mine) return;
    s.step = count > 1 && rects[1] && rects[0] ? rects[1].left - rects[0].left : mine.width;
    s.minDx = (rects[0]?.left ?? mine.left) - mine.left;
    s.maxDx = (rects[count - 1]?.left ?? mine.left) - mine.left;
    s.lifted = true;
    document.addEventListener("touchmove", preventScroll, { passive: false });
    try {
      navigator.vibrate?.(8);
    } catch {}
    setLifted(s.index);
    paint();
  }, [count, paint, preventScroll]);

  function onMove(e: PointerEvent) {
    const s = session.current;
    if (!s || e.pointerId !== s.pointerId) return;
    const dx = e.clientX - s.startX;
    const dy = e.clientY - s.startY;
    if (!s.lifted) {
      if (Math.abs(dx) > SLOP_PX && Math.abs(dx) > Math.abs(dy)) lift();
      else if (Math.abs(dy) > SLOP_PX * 1.5) cleanup();
      return;
    }
    s.dx = Math.min(s.maxDx, Math.max(s.minDx, dx));
    s.over = Math.min(count - 1, Math.max(0, Math.round(s.index + s.dx / s.step)));
    if (s.raf === null) s.raf = requestAnimationFrame(paint);
  }

  function onUp(e: PointerEvent) {
    const s = session.current;
    if (!s || e.pointerId !== s.pointerId) return;
    if (!s.lifted) {
      cleanup();
      return;
    }
    justDragged.current = true;
    const { index, over, step } = s;
    const el = els.current[index];
    if (s.raf) cancelAnimationFrame(s.raf);
    session.current = null;
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onCancel);
    document.removeEventListener("touchmove", preventScroll);

    // Glide into the slot, then commit the order and drop every transform in one go.
    if (el) {
      el.style.transition = `transform ${SETTLE_MS}ms cubic-bezier(0.2, 0.8, 0.2, 1)`;
      el.style.transform = `translateX(${(over - index) * step}px) scale(1)`;
    }
    window.setTimeout(() => {
      // The cards already sit where the new order will put them. Switch
      // transitions off while the offsets are cleared and React moves the
      // elements, otherwise each card replays its offset in its new slot.
      const cards = els.current.filter((c): c is HTMLElement => !!c);
      cards.forEach((c) => {
        c.style.transition = "none";
        c.style.transform = "";
      });
      if (over !== index) onReorder(index, over);
      setLifted(null);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          cards.forEach((c) => {
            c.style.transition = "";
          });
        })
      );
    }, SETTLE_MS);
  }

  function onCancel() {
    const s = session.current;
    if (s?.lifted) {
      els.current.forEach((c) => {
        if (c) c.style.transform = "";
      });
      setLifted(null);
    }
    cleanup();
  }

  const onPointerDown = useCallback(
    (index: number) => (e: React.PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if ((e.target as HTMLElement).closest("[data-no-drag]")) return;
      if (session.current) cleanup();
      justDragged.current = false;
      session.current = {
        index,
        over: index,
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        dx: 0,
        lifted: false,
        step: 0,
        minDx: 0,
        maxDx: 0,
        timer: window.setTimeout(lift, HOLD_MS),
        raf: null,
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onCancel);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cleanup, lift]
  );

  /** Swallow the click that follows a drag so the card's own buttons don't fire. */
  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (justDragged.current) {
      justDragged.current = false;
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  useEffect(() => cleanup, [cleanup]);

  return { lifted, setEl, onPointerDown, onClickCapture };
}
