'use client';

import { useEffect, useRef } from 'react';

export default function BouncingShapes() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    let width = 0, height = 0, frame = 0, last = 0, pixelRatio = 1;
    let visible = false;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pointer = { x: -1000, y: -1000 };
    let shapes: { x: number; y: number; vx: number; vy: number; r: number; angle: number; spin: number; kind: number }[] = [];
    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      width = bounds.width; height = bounds.height;
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * pixelRatio); canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      shapes = Array.from({ length: Math.min(180, Math.max(32, Math.floor(width / 12))) }, (_, i) => ({
        x: ((i * .618034) % 1) * width, y: height * (.35 + ((i * .75488) % 1) * .6),
        vx: Math.sin(i * 7) * 40, vy: -50 - (i % 9) * 16, r: 4 + i % 5,
        angle: i, spin: Math.sin(i) * 1.5, kind: i % 4,
      }));
    };
    const move = (event: PointerEvent) => { const b = canvas.getBoundingClientRect(); pointer.x = event.clientX - b.left; pointer.y = event.clientY - b.top; };
    const leave = () => { pointer.x = -1000; pointer.y = -1000; };
    const render = (time: number) => {
      const dt = Math.min((time - last) / 1000, .032); last = time;
      if (visible) {
        const bounds = canvas.getBoundingClientRect();
        if (Math.abs(bounds.width - width) > 1 || Math.abs(bounds.height - height) > 1 || pixelRatio !== Math.min(window.devicePixelRatio || 1, 2)) resize();
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        context.clearRect(0, 0, width, height);
        shapes.forEach((shape, i) => {
          if (!reduced) {
            shape.vy += 170 * dt;
            const dx = shape.x - pointer.x, dy = shape.y - pointer.y, distance = Math.hypot(dx, dy);
            if (distance < 90) { shape.vx += dx / (distance || 1) * 180 * dt; shape.vy -= (1 - distance / 90) * 400 * dt; }
            shape.vx = Math.max(-100, Math.min(100, shape.vx));
            shape.x += shape.vx * dt; shape.y += shape.vy * dt; shape.angle += shape.spin * dt;
            if (shape.y > height - shape.r - 8) { shape.y = height - shape.r - 8; shape.vy = -(100 + (i % 8) * 15); }
            if (shape.x < shape.r || shape.x > width - shape.r) { shape.vx *= -1; shape.x = Math.max(shape.r, Math.min(width - shape.r, shape.x)); }
          }
          context.save(); context.translate(shape.x, shape.y); context.rotate(shape.angle);
          context.fillStyle = i % 3 === 0 ? '#c4b5fd' : '#eeeaf8'; context.strokeStyle = context.fillStyle; context.lineWidth = 2;
          context.beginPath();
          if (shape.kind === 0) { context.arc(0, 0, shape.r, 0, Math.PI * 2); context.fill(); }
          else if (shape.kind === 1) { context.fillRect(-shape.r, -shape.r, shape.r * 2, shape.r * 2); }
          else if (shape.kind === 2) { context.moveTo(0, -shape.r); context.lineTo(shape.r, shape.r); context.lineTo(-shape.r, shape.r); context.closePath(); context.fill(); }
          else { context.moveTo(-shape.r, 0); context.lineTo(shape.r, 0); context.moveTo(0, -shape.r); context.lineTo(0, shape.r); context.stroke(); }
          context.restore();
        });
      }
      frame = requestAnimationFrame(render);
    };
    resize();
    const sizeObserver = new ResizeObserver(resize); sizeObserver.observe(canvas);
    window.addEventListener('resize', resize);
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }); observer.observe(canvas);
    const parent = canvas.parentElement;
    parent?.addEventListener('pointermove', move); parent?.addEventListener('pointerleave', leave);
    frame = requestAnimationFrame(render);
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(frame); observer.disconnect(); sizeObserver.disconnect(); parent?.removeEventListener('pointermove', move); parent?.removeEventListener('pointerleave', leave); };
  }, []);
  return <canvas ref={ref} className="agent-bouncing-shapes" aria-hidden="true" />;
}
