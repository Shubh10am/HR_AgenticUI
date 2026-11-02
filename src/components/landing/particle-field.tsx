'use client';

import { useEffect, useRef } from 'react';

/** Outlines the dots can gather into, drawn on a 200×200 board. */
const SHAPES: ((board: CanvasRenderingContext2D) => void)[] = [
  // Stacked documents: context gathered.
  (board) => {
    [[34, 18], [52, 36], [70, 54]].forEach(([x, y]) => {
      board.beginPath();
      board.roundRect(x, y, 96, 118, 14);
      board.stroke();
    });
    [86, 106, 126].forEach((y, i) => {
      board.beginPath();
      board.moveTo(90, y);
      board.lineTo(i === 2 ? 128 : 146, y);
      board.stroke();
    });
  },
  // Sparkle: a draft prepared.
  (board) => {
    const star = (cx: number, cy: number, r: number) => {
      board.beginPath();
      board.moveTo(cx, cy - r);
      board.quadraticCurveTo(cx, cy, cx + r, cy);
      board.quadraticCurveTo(cx, cy, cx, cy + r);
      board.quadraticCurveTo(cx, cy, cx - r, cy);
      board.quadraticCurveTo(cx, cy, cx, cy - r);
      board.stroke();
    };
    star(92, 108, 76);
    star(160, 42, 26);
  },
  // Check in a circle: ready for human review.
  (board) => {
    board.beginPath();
    board.arc(100, 100, 82, 0, Math.PI * 2);
    board.stroke();
    board.beginPath();
    board.moveTo(60, 102);
    board.lineTo(88, 130);
    board.lineTo(142, 72);
    board.stroke();
  },
  // People: recruit.
  (board) => {
    board.beginPath();
    board.arc(78, 70, 30, 0, Math.PI * 2);
    board.stroke();
    board.beginPath();
    board.arc(78, 172, 58, Math.PI * 1.08, Math.PI * 1.92);
    board.stroke();
    board.beginPath();
    board.arc(140, 78, 22, -Math.PI * 0.5, Math.PI * 0.5);
    board.stroke();
    board.beginPath();
    board.arc(140, 172, 44, Math.PI * 1.45, Math.PI * 1.95);
    board.stroke();
  },
  // Badge with a check: onboard.
  (board) => {
    board.beginPath();
    for (let i = 0; i <= 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const r = i % 2 === 0 ? 84 : 72;
      const x = 100 + Math.cos(angle) * r;
      const y = 100 + Math.sin(angle) * r;
      if (i === 0) board.moveTo(x, y);
      else board.lineTo(x, y);
    }
    board.stroke();
    board.beginPath();
    board.moveTo(66, 102);
    board.lineTo(90, 126);
    board.lineTo(136, 78);
    board.stroke();
  },
  // Calendar: attendance.
  (board) => {
    board.beginPath();
    board.roundRect(26, 40, 148, 136, 18);
    board.stroke();
    board.beginPath();
    board.moveTo(26, 82);
    board.lineTo(174, 82);
    [66, 134].forEach((x) => {
      board.moveTo(x, 20);
      board.lineTo(x, 56);
    });
    board.stroke();
    [62, 100, 138].forEach((x) => [112, 146].forEach((y) => {
      board.beginPath();
      board.arc(x, y, 4, 0, Math.PI * 2);
      board.stroke();
    }));
  },
  // Briefcase: payroll.
  (board) => {
    board.beginPath();
    board.roundRect(22, 62, 156, 112, 16);
    board.stroke();
    board.beginPath();
    board.roundRect(72, 30, 56, 32, 10);
    board.stroke();
    board.beginPath();
    board.moveTo(22, 108);
    board.quadraticCurveTo(100, 136, 178, 108);
    board.stroke();
  },
  // Envelope: email.
  (board) => {
    board.beginPath();
    board.roundRect(20, 48, 160, 110, 14);
    board.stroke();
    board.beginPath();
    board.moveTo(26, 58);
    board.lineTo(100, 112);
    board.lineTo(174, 58);
    board.stroke();
  },
  // Chat bubble with a sparkle: Copilot.
  (board) => {
    board.beginPath();
    board.moveTo(48, 30);
    board.lineTo(152, 30);
    board.quadraticCurveTo(180, 30, 180, 58);
    board.lineTo(180, 118);
    board.quadraticCurveTo(180, 146, 152, 146);
    board.lineTo(84, 146);
    board.lineTo(44, 178);
    board.lineTo(48, 146);
    board.quadraticCurveTo(20, 146, 20, 118);
    board.lineTo(20, 58);
    board.quadraticCurveTo(20, 30, 48, 30);
    board.stroke();
    board.beginPath();
    board.moveTo(100, 56);
    board.quadraticCurveTo(100, 88, 132, 88);
    board.quadraticCurveTo(100, 88, 100, 120);
    board.quadraticCurveTo(100, 88, 68, 88);
    board.quadraticCurveTo(100, 88, 100, 56);
    board.stroke();
  },
  // Stacked layers: the whole workspace.
  (board) => {
    [0, 34, 68].forEach((offset, layer) => {
      board.beginPath();
      if (layer === 0) {
        board.moveTo(100, 30);
        board.lineTo(178, 70);
        board.lineTo(100, 110);
        board.lineTo(22, 70);
        board.closePath();
      } else {
        board.moveTo(22, 70 + offset);
        board.lineTo(100, 110 + offset);
        board.lineTo(178, 70 + offset);
      }
      board.stroke();
    });
  },
];

const SHAPE_DOTS = 260;
const shapeCache = new Map<number, { x: number; y: number }[]>();

/** Evenly spaced points along a shape's outline, as fractions of its board (−0.5…0.5). */
function shapePoints(index: number) {
  const cached = shapeCache.get(index);
  if (cached) return cached;
  const board = document.createElement('canvas');
  board.width = board.height = 200;
  const context = board.getContext('2d')!;
  context.strokeStyle = '#fff';
  context.lineWidth = 7;
  context.lineCap = context.lineJoin = 'round';
  SHAPES[index](context);
  const pixels = context.getImageData(0, 0, 200, 200).data;
  const all: { x: number; y: number }[] = [];
  for (let y = 0; y < 200; y += 3) for (let x = 0; x < 200; x += 3) if (pixels[(y * 200 + x) * 4 + 3] > 128) all.push({ x: x / 200 - 0.5, y: y / 200 - 0.5 });
  const points = Array.from({ length: SHAPE_DOTS }, (_, i) => all[Math.floor((i * all.length) / SHAPE_DOTS)]);
  shapeCache.set(index, points);
  return points;
}

export interface ParticleShape {
  /** Which outline to draw (0 documents, 1 sparkle, 2 check, 3 people, 4 badge, 5 calendar, 6 briefcase, 7 envelope, 8 chat, 9 layers), or null to scatter. */
  index: number | null;
  /** Centre and size as fractions of the canvas width/height. */
  x: number;
  y: number;
  size: number;
}

/** A quiet particle field that bends away from the pointer and can gather into shapes. */
export default function ParticleField({ tone = 'light', shape }: { tone?: 'light' | 'dark'; shape?: ParticleShape }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Read inside the animation loop, so changing the shape never restarts the field.
  const shapeRef = useRef(shape);
  shapeRef.current = shape;

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
    let particles: { x: number; y: number; homeX: number; homeY: number; dx: number; dy: number; size: number; phase: number; slot: number }[] = [];
    const pointer = { x: -1000, y: -1000 };
    const resize = () => {
      width = parent.clientWidth;
      height = Math.min(parent.clientHeight, window.innerHeight * 1.4);
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const count = Math.min(650, Math.floor(width * height / 2500));
      // Spread the shape-forming dots across the whole field, so a shape draws from everywhere.
      const stride = Math.max(1, Math.floor(count / SHAPE_DOTS));
      particles = Array.from({ length: count }, (_, i) => {
        const homeX = ((i * 0.61803398875) % 1) * width;
        const homeY = ((i * 0.754877666) % 1) * height;
        const slot = i % stride === 0 && i / stride < SHAPE_DOTS ? i / stride : -1;
        return { x: homeX, y: homeY, homeX, homeY, dx: 0, dy: 0, size: 0.45 + (i % 7) * 0.13, phase: i * 1.7, slot };
      });
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
        const target = shapeRef.current;
        const points = target && target.index !== null ? shapePoints(target.index) : null;
        const side = target ? target.size * Math.min(width, height * 1.6) : 0;
        particles.forEach((particle) => {
          const point = points && particle.slot >= 0 ? points[particle.slot] : null;
          const goalX = point ? target!.x * width + point.x * side : particle.homeX;
          const goalY = point ? target!.y * height + point.y * side : particle.homeY;
          const ease = reduced ? 1 : point ? 0.055 + (particle.slot % 5) * 0.006 : 0.03;
          particle.x += (goalX - particle.x) * ease;
          particle.y += (goalY - particle.y) * ease;
          const settled = point ? Math.max(0, 1 - Math.hypot(goalX - particle.x, goalY - particle.y) / 60) : 0;
          const vx = particle.x - pointer.x;
          const vy = particle.y - pointer.y;
          const distance = Math.hypot(vx, vy);
          const influence = reduced ? 0 : Math.max(0, 1 - distance / 240);
          const push = influence * influence * 78;
          particle.dx += ((vx / (distance || 1)) * push - particle.dx) * 0.075;
          particle.dy += ((vy / (distance || 1)) * push - particle.dy) * 0.075;
          const drift = reduced ? 0 : Math.sin(time * 0.00035 + particle.phase) * (point ? 1.2 : 3);
          context.fillStyle = (tone === 'dark' ? 'rgba(12,14,20,' : 'rgba(255,255,255,') + (0.18 + influence * 0.64 + (particle.phase % 3) * 0.04 + settled * 0.55) + ')';
          context.beginPath();
          context.ellipse(particle.x + particle.dx, particle.y + particle.dy + drift, particle.size + influence * 0.5 + settled * 0.5, particle.size + influence * 1.5 + settled * 0.5, Math.atan2(vy, vx), 0, Math.PI * 2);
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
