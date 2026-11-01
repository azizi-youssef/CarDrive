'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
}

/**
 * ShinyText (React Bits style)
 * Balayage lumineux élégant sur le texte pour les badges, titres et accents.
 */
export function ShinyText({
  text,
  disabled = false,
  speed = 3.5,
  className = '',
}: ShinyTextProps) {
  return (
    <span
      className={cn(
        'inline-block font-semibold bg-clip-text text-transparent transition-all',
        className
      )}
      style={{
        backgroundImage: disabled
          ? 'none'
          : 'linear-gradient(110deg, currentColor 35%, rgba(255, 255, 255, 0.95) 50%, currentColor 65%)',
        backgroundSize: '250% 100%',
        animation: disabled ? 'none' : `cdShinyText ${speed}s linear infinite`,
        WebkitBackgroundClip: 'text',
      }}
    >
      {text}
    </span>
  );
}

