"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  size: number;
  phase: number;
  color: string;
  drift: number;
};

const colors = ["#b8892e", "#d9ad57", "#7a1620", "#755636", "#2e7d7d"];

function pointOnRoundedCard(index: number, count: number, width: number, height: number) {
  const left = width * .18;
  const top = height * .1;
  const cardWidth = width * .64;
  const cardHeight = height * .8;
  const radius = Math.min(cardWidth, cardHeight) * .08;
  const perimeter = 2 * (cardWidth + cardHeight - 4 * radius) + 2 * Math.PI * radius;
  let distance = (index / count) * perimeter;
  const straightTop = cardWidth - 2 * radius;
  const straightSide = cardHeight - 2 * radius;
  const arc = Math.PI * radius / 2;

  if (distance < straightTop) return { x: left + radius + distance, y: top };
  distance -= straightTop;
  if (distance < arc) return { x: left + cardWidth - radius + radius * Math.sin(distance / radius), y: top + radius - radius * Math.cos(distance / radius) };
  distance -= arc;
  if (distance < straightSide) return { x: left + cardWidth, y: top + radius + distance };
  distance -= straightSide;
  if (distance < arc) return { x: left + cardWidth - radius + radius * Math.cos(distance / radius), y: top + cardHeight - radius + radius * Math.sin(distance / radius) };
  distance -= arc;
  if (distance < straightTop) return { x: left + cardWidth - radius - distance, y: top + cardHeight };
  distance -= straightTop;
  if (distance < arc) return { x: left + radius - radius * Math.sin(distance / radius), y: top + cardHeight - radius + radius * Math.cos(distance / radius) };
  distance -= arc;
  if (distance < straightSide) return { x: left, y: top + cardHeight - radius - distance };
  distance -= straightSide;
  return { x: left + radius - radius * Math.cos(distance / radius), y: top + radius - radius * Math.sin(distance / radius) };
}

function createParticles(width: number, height: number, count: number): Particle[] {
  const outlineCount = Math.round(count * .54);
  return Array.from({ length: count }, (_, index) => {
    const color = colors[index % 17 === 0 ? 4 : index % 8 === 0 ? 2 : Math.floor(Math.random() * 4)];
    if (index < outlineCount) {
      const point = pointOnRoundedCard(index, outlineCount, width, height);
      return { ...point, size: .7 + Math.random() * 1.5, phase: Math.random() * Math.PI * 2, color, drift: .35 + Math.random() * .8 };
    }
    const innerX = width * (.23 + Math.random() * .54);
    const innerY = height * (.16 + Math.random() * .68);
    const inCorner = Math.abs(innerX - width / 2) + Math.abs(innerY - height / 2) > width * .55;
    return { x: inCorner ? width / 2 + (innerX - width / 2) * .74 : innerX, y: innerY, size: .45 + Math.random() * 1.3, phase: Math.random() * Math.PI * 2, color, drift: .35 + Math.random() * 1.1 };
  });
}

export function PilgrimCardParticles({ interactive = true }: { interactive?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let particles: Particle[] = [];
    let pointer = { x: -1000, y: -1000 };
    let size = { width: 0, height: 0, ratio: 1 };

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      size = { width: bounds.width, height: bounds.height, ratio };
      canvas.width = Math.floor(bounds.width * ratio);
      canvas.height = Math.floor(bounds.height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      particles = createParticles(bounds.width, bounds.height, bounds.width < 600 ? 440 : 900);
    };

    const draw = (time = 0) => {
      context.clearRect(0, 0, size.width, size.height);
      const motion = media.matches ? 0 : time * .001;
      for (const particle of particles) {
        const distanceX = particle.x - pointer.x;
        const distanceY = particle.y - pointer.y;
        const distance = Math.hypot(distanceX, distanceY);
        const push = !media.matches && distance < 105 ? (105 - distance) / 105 : 0;
        const offsetX = Math.sin(motion * particle.drift + particle.phase) * 2.3 + (distance ? (distanceX / distance) * push * 13 : 0);
        const offsetY = Math.cos(motion * particle.drift * .8 + particle.phase) * 2.3 + (distance ? (distanceY / distance) * push * 13 : 0);
        const alpha = .48 + (Math.sin(motion + particle.phase) + 1) * .18;
        context.globalAlpha = alpha;
        context.fillStyle = particle.color;
        context.save();
        context.translate(particle.x + offsetX, particle.y + offsetY);
        context.rotate(particle.phase + motion * .08);
        context.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
        context.restore();
      }
      context.globalAlpha = 1;
      if (!media.matches) frame = requestAnimationFrame(draw);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!interactive) return;
      const bounds = canvas.getBoundingClientRect();
      pointer = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    };
    const onPointerLeave = () => { if (interactive) pointer = { x: -1000, y: -1000 }; };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);
    resize();
    draw();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [interactive]);

  return <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />;
}
