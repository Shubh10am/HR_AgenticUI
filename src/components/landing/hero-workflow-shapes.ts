'use client';

import { useEffect, useState, type RefObject } from 'react';
import type { ParticleShape } from './particle-field';

/** Recruit, Onboard, Attendance, Payroll — in the particle field's shape list. */
const WORKFLOW_SHAPES = [3, 4, 5, 6];
const STEP_MS = 3400;

/**
 * Cycles the hero's workflow steps and returns the dot shape for the current one, placed in
 * the open space beside the headline (left for the first two steps, right for the last two).
 *
 * @param section The hero section the particle field fills.
 * @param headline The headline, so shapes never overlap it.
 * @returns The active step and the shape (index null where there's no room beside the headline).
 */
export function useHeroWorkflowShapes(section: RefObject<HTMLElement | null>, headline: RefObject<HTMLElement | null>) {
  const [step, setStep] = useState(0);
  const [shape, setShape] = useState<ParticleShape>({ index: null, x: 0, y: 0, size: 0 });

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let timer: ReturnType<typeof setInterval> | undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (timer) clearInterval(timer);
      timer = entry.isIntersecting ? setInterval(() => setStep((current) => (current + 1) % WORKFLOW_SHAPES.length), STEP_MS) : undefined;
    }, { threshold: 0.3 });
    if (section.current) observer.observe(section.current);
    return () => {
      observer.disconnect();
      if (timer) clearInterval(timer);
    };
  }, [section]);

  useEffect(() => {
    const place = () => {
      const box = section.current?.getBoundingClientRect();
      const title = headline.current;
      if (!box || !title) return;
      // The headline's widest line, not its (wider) container.
      const range = document.createRange();
      range.selectNodeContents(title);
      const lines = [...range.getClientRects()];
      const left = Math.min(...lines.map((line) => line.left)) - box.left;
      const right = box.right - Math.max(...lines.map((line) => line.right));
      const gutter = step < 2 ? left : right;
      const side = Math.min(gutter * 0.78, 230);
      const titleBox = title.getBoundingClientRect();
      if (side < 110) return setShape((current) => ({ ...current, index: null }));
      const centreX = step < 2 ? left / 2 : box.width - right / 2;
      setShape({
        index: WORKFLOW_SHAPES[step],
        x: centreX / box.width,
        y: (titleBox.top + titleBox.height / 2 - box.top) / box.height,
        size: side / Math.min(box.width, box.height * 1.6),
      });
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [section, headline, step]);

  return { step, shape };
}
