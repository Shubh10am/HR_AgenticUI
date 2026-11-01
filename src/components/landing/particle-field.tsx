'use client';

import { useEffect, useRef } from 'react';

/** A quiet white particle field that bends away from the pointer. */
export default function ParticleField({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let width = 0;
    let height = 0;
    let frame = 0;
    let visible = true;
    let particles: { x: number; y: number; dx: number; dy: number; size: number; phase: number }[] = [];
    const pointer = { x: -1000, y: -1000 };
    const resize = () => {
      width = parent.clientWidth;
      height = Math.min(parent.clientHeight, window.innerHeight * 1.4);
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      particles = Array.from({ length: Math.min(650, Math.floor(width * height / 2500)) }, (_, i) => ({
        x: ((i * 0.61803398875) % 1) * width,
        y: ((i * 0.754877666) % 1) * height,
        dx: 0, dy: 0, size: 0.45 + (i % 7) * 0.13, phase: i * 1.7,
      }));
    };
    const move = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      pointer.x = event.clientX - bounds.left;
      pointer.y = event.clientY - bounds.top;
    };
    const leave = () => { pointer.x = -1000; pointer.y = -1000; };
    const render = (time: number) => {
      if (visible) {
        context.clearRect(0, 0, width, height);
        particles.forEach((particle) => {
          const vx = particle.x - pointer.x;
          const vy = particle.y - pointer.y;
          const distance = Math.hypot(vx, vy);
          const influence = reduced ? 0 : Math.max(0, 1 - distance / 240);
          const push = influence * influence * 78;
          particle.dx += ((vx / (distance || 1)) * push - particle.dx) * 0.075;
          particle.dy += ((vy / (distance || 1)) * push - particle.dy) * 0.075;
          const drift = reduced ? 0 : Math.sin(time * 0.00035 + particle.phase) * 3;
          context.fillStyle = (tone === 'dark' ? 'rgba(12,14,20,' : 'rgba(255,255,255,') + (0.18 + influence * 0.64 + (particle.phase % 3) * 0.04) + ')';
          context.beginPath();
          context.ellipse(particle.x + particle.dx, particle.y + particle.dy + drift, particle.size + influence * 0.5, particle.size + influence * 1.5, Math.atan2(vy, vx), 0, Math.PI * 2);
          context.fill();
        });
      }
      frame = requestAnimationFrame(render);
    };
    resize();
    const sizeObserver = new ResizeObserver(resize);
    sizeObserver.observe(parent);
    const visibilityObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    visibilityObserver.observe(canvas);
    parent.addEventListener('pointermove', move);
    parent.addEventListener('pointerleave', leave);
    frame = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(frame);
      sizeObserver.disconnect();
      visibilityObserver.disconnect();
      parent.removeEventListener('pointermove', move);
      parent.removeEventListener('pointerleave', leave);
    };
  }, [tone]);

  return <canvas ref={canvasRef} aria-hidden="true" className="particle-field" />;
}
