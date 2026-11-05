'use client';

import React, { useEffect, useRef } from 'react';

interface MagnetProps {
  children: React.ReactNode;
  className?: string;
  strength?: number;
}

/**
 * Magnet : léger effet d'attraction au survol des boutons d'action.
 * Version sans librairie (transform CSS + requestAnimationFrame), inactive sur écran tactile
 * et si l'utilisateur demande à réduire les animations.
 */
export function Magnet({ children, className = '', strength = 0.35 }: MagnetProps) {
  const magnetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = magnetRef.current;
    if (!el) return;
    if (window.matchMedia('(pointer: coarse), (prefers-reduced-motion: reduce)').matches) return;

    let frame = 0;
    const move = (x: number, y: number) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el.style.transform = x || y ? `translate3d(${x}px, ${y}px, 0)` : '';
      });
    };
    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      move((e.clientX - (rect.left + rect.width / 2)) * strength, (e.clientY - (rect.top + rect.height / 2)) * strength);
    };
    const handleMouseLeave = () => move(0, 0);

    el.style.transition = 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)';
    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [strength]);

  return (
    <div ref={magnetRef} className={`inline-block ${className}`}>
      {children}
    </div>
  );
}
