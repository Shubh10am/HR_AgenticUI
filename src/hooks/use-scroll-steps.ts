'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Pins a block while the page scrolls through it and turns the scroll position into a step.
 * Wide screens only; phones and reduced-motion users get a normal block they tap through.
 *
 * @param count Number of steps.
 * @param stepVh Scroll distance per step, in viewport heights.
 * @returns A ref for the tall track, the active step, progress through it (0–1), whether
 *   scrolling drives it, the track's height, and `goTo` for clicks.
 */
export function useScrollSteps<T extends HTMLElement = HTMLDivElement>(count: number, stepVh = 55) {
  const trackRef = useRef<T>(null);
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const [enabled, setEnabled] = useState(false);
  // Height of the pinned block (the track's first child); the track adds the scroll steps to it.
  const [pinnedHeight, setPinnedHeight] = useState(0);

  useEffect(() => {
    const query = window.matchMedia('(min-width: 1024px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)');
    const update = () => setEnabled(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const pinned = trackRef.current?.firstElementChild;
    if (!enabled || !pinned) return;
    const observer = new ResizeObserver(() => setPinnedHeight((pinned as HTMLElement).offsetHeight));
    observer.observe(pinned);
    return () => observer.disconnect();
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const track = trackRef.current;
        if (!track) return;
        const { stickyTop, distance } = geometry(track);
        const rect = track.getBoundingClientRect();
        const position = (distance > 0 ? Math.min(Math.max((stickyTop - rect.top) / distance, 0), 0.9999) : 0) * count;
        setActive(Math.floor(position));
        setProgress(position - Math.floor(position));
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [enabled, count]);

  /** Scrolls to the middle of a step, so clicking and scrolling always agree. */
  const goTo = useCallback(
    (index: number) => {
      const track = trackRef.current;
      if (!enabled || !track) return setActive(index);
      const { stickyTop, distance } = geometry(track);
      window.scrollTo({ top: track.getBoundingClientRect().top + window.scrollY - stickyTop + ((index + 0.5) / count) * distance, behavior: 'smooth' });
    },
    [enabled, count]
  );

  const trackStyle = enabled ? { height: `calc(${count * stepVh}vh + ${pinnedHeight}px)` } : undefined;
  return { trackRef, active, progress, enabled, trackStyle, goTo };
}

/** Where the pinned block sticks, and how far the page scrolls while it stays pinned. */
function geometry(track: HTMLElement) {
  const pinned = track.firstElementChild as HTMLElement | null;
  const stickyTop = pinned ? parseFloat(getComputedStyle(pinned).top) || 0 : 0;
  return { stickyTop, distance: track.offsetHeight - (pinned?.offsetHeight ?? window.innerHeight) };
}
