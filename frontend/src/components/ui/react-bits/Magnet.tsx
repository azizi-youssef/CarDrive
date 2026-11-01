'use client';

import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';

interface MagnetProps {
  children: React.ReactNode;
  className?: string;
  strength?: number;
}

/**
 * Magnet (React Bits style, propulsé par GSAP)
 * Effet d'attraction magnétique interactif au survol des boutons d'action et CTA.
 */
export function Magnet({
  children,
  className = '',
  strength = 0.35,
}: MagnetProps) {
  const magnetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = magnetRef.current;
    if (!el) return;

    // Désactivé sur écrans tactiles mobiles
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - (rect.left + rect.width / 2);
      const y = e.clientY - (rect.top + rect.height / 2);

      gsap.to(el, {
        x: x * strength,
        y: y * strength,
        duration: 0.3,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    };

    const handleMouseLeave = () => {
      gsap.to(el, {
        x: 0,
        y: 0,
        duration: 0.6,
        ease: 'elastic.out(1.1, 0.4)',
        overwrite: 'auto',
      });
    };

    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
      gsap.killTweensOf(el);
    };
  }, [strength]);

  return (
    <div ref={magnetRef} className={`inline-block ${className}`}>
      {children}
    </div>
  );
}

