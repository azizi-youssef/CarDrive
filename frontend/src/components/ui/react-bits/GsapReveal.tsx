import React from 'react';
import { cn } from '@/lib/utils';

interface GsapRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  yOffset?: number;
  stagger?: number;
}

/**
 * Révélation d'entrée (fondu + léger glissement), en CSS pur.
 * Remplace l'ancienne version GSAP : aucun JavaScript, pas d'hydratation nécessaire,
 * et désactivée si l'utilisateur demande à réduire les animations (voir .cd-reveal dans globals.css).
 * Le nom est conservé pour ne pas changer l'API des pages qui l'utilisent.
 */
export function GsapReveal({
  children,
  className = '',
  delay = 0.05,
  duration = 0.7,
  yOffset = 24,
  stagger = 0,
}: GsapRevealProps) {
  return (
    <div
      className={cn(stagger > 0 ? 'cd-reveal-stagger' : 'cd-reveal', className)}
      style={
        {
          '--cd-reveal-delay': `${delay}s`,
          '--cd-reveal-duration': `${duration}s`,
          '--cd-reveal-y': `${yOffset}px`,
          '--cd-reveal-stagger': `${stagger}s`,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}

export { GsapReveal as Reveal };
