'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { waapi } from 'animejs';

const SELECTOR = '[data-ui-motion]';
type Animation = ReturnType<typeof waapi.animate>;

/** Shared motion for server-rendered UI, async content, and Radix portals. */
export default function UiMotion() {
  const pathname = usePathname();

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let dispose = () => {};

    function start() {
      dispose();
      if (preference.matches || !('IntersectionObserver' in window)) return;

      const seen = new WeakSet<HTMLElement>();
      const registered = new WeakSet<HTMLElement>();
      const active = new Map<HTMLElement, Animation>();
      const pending = new Set<HTMLElement>();
      let frame = 0;

      function eligible(element: HTMLElement) {
        return element.isConnected && !element.hidden &&
          !element.closest('[data-ui-motion="none"], [data-state="closed"], [data-state="inactive"]');
      }

      function reveal(element: HTMLElement, delay = 0) {
        if (!eligible(element) || seen.has(element)) return;
        seen.add(element);
        active.get(element)?.revert();
        const kind = element.dataset.uiMotion;
        // CSS owns dialog positioning, drag transforms, and landing-page choreography.
        const canMove = kind === 'card' || kind === 'heading';
        const animatePosition = canMove && !element.closest('[draggable="true"], #features, #product-tour, #agent-journey');
        const animation = waapi.animate(element, {
          opacity: [0.65, 1],
          ...(animatePosition ? { translate: ['0px 8px', '0px 0px'] } : {}),
          duration: kind === 'page' ? 180 : 260,
          delay,
          ease: 'out(3)',
          onComplete: (instance) => {
            instance.revert();
            active.delete(element);
          },
        });
        active.set(element, animation);
      }

      const intersection = new IntersectionObserver((entries) => {
        let index = 0;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const element = entry.target as HTMLElement;
          if (!eligible(element)) continue;
          reveal(element, Math.min(index++, 4) * 25);
          intersection.unobserve(element);
        }
      }, { threshold: 0 });

      function register(element: HTMLElement) {
        if (!eligible(element)) return;
        if (element.dataset.uiMotion === 'card') {
          if (element.parentElement?.closest('[data-ui-motion="card"]')) return;
          if (!registered.has(element)) {
            registered.add(element);
            intersection.observe(element);
          }
        } else {
          reveal(element);
        }
      }

      function flush() {
        frame = 0;
        for (const element of pending) {
          if (element.matches(SELECTOR)) register(element);
          element.querySelectorAll<HTMLElement>(SELECTOR).forEach(register);
        }
        pending.clear();
        for (const [element, animation] of active) {
          if (!element.isConnected) {
            animation.revert();
            active.delete(element);
          }
        }
      }

      const mutation = new MutationObserver((records) => {
        for (const record of records) {
          if (record.type === 'attributes' && record.target instanceof HTMLElement) {
            const target = record.target;
            if (target.dataset.uiMotion === 'tab' && target.dataset.state === 'inactive') {
              active.get(target)?.revert();
              active.delete(target);
              seen.delete(target);
            }
            pending.add(target);
          }
          for (const node of record.addedNodes) {
            if (node instanceof HTMLElement) pending.add(node);
          }
          for (const node of record.removedNodes) {
            if (!(node instanceof HTMLElement)) continue;
            const removed = [node, ...node.querySelectorAll<HTMLElement>(SELECTOR)];
            for (const element of removed) {
              intersection.unobserve(element);
              registered.delete(element);
              pending.delete(element);
              active.get(element)?.revert();
              active.delete(element);
            }
          }
        }
        if (!frame) frame = requestAnimationFrame(flush);
      });

      function press(event: MouseEvent) {
        if (!(event.target instanceof Element)) return;
        const button = event.target.closest<HTMLElement>('[data-ui-press]');
        if (!button || button.matches(':disabled, [aria-disabled="true"]')) return;
        active.get(button)?.revert();
        const animation = waapi.animate(button, {
          opacity: [0.7, 1],
          duration: 160,
          ease: 'out(3)',
          onComplete: (instance) => {
            instance.revert();
            active.delete(button);
          },
        });
        active.set(button, animation);
      }

      document.querySelectorAll<HTMLElement>(SELECTOR).forEach(register);
      mutation.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-state'] });
      document.addEventListener('click', press);
      dispose = () => {
        cancelAnimationFrame(frame);
        pending.clear();
        mutation.disconnect();
        intersection.disconnect();
        document.removeEventListener('click', press);
        for (const animation of active.values()) animation.revert();
        active.clear();
      };
    }

    start();
    preference.addEventListener('change', start);
    return () => {
      preference.removeEventListener('change', start);
      dispose();
    };
  }, [pathname]);

  return null;
}
