'use client';

import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';

interface GsapRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  yOffset?: number;
  stagger?: number;
}

/**
 * GsapReveal (Propulsé par GSAP)
 * Révélation d'entrée soignée (fade & slide-up) avec timing industriel.
 */
export function GsapReveal({
  children,
  className = '',
  delay = 0.05,
  duration = 0.7,
  yOffset = 24,
  stagger = 0,
}: GsapRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (stagger > 0 && el.children.length > 0) {
      gsap.fromTo(
        el.children,
        { opacity: 0, y: yOffset },
        {
          opacity: 1,
          y: 0,
          duration,
          delay,
          stagger,
          ease: 'power3.out',
          clearProps: 'transform',
        }
      );
    } else {
      gsap.fromTo(
        el,
        { opacity: 0, y: yOffset },
        {
          opacity: 1,
          y: 0,
          duration,
          delay,
          ease: 'power3.out',
          clearProps: 'transform',
        }
      );
    }

    return () => {
      gsap.killTweensOf(el);
      if (el.children) gsap.killTweensOf(el.children);
    };
  }, [delay, duration, yOffset, stagger]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}

