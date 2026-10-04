import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertCircle, Clock, ShieldCheck } from 'lucide-react';

interface BadgeProps {
  variant?: 'verified' | 'available' | 'rented' | 'pending' | 'outline' | 'accent';
  children: React.ReactNode;
  className?: string;
  icon?: boolean;
}

export function Badge({ variant = 'outline', children, className, icon = false }: BadgeProps) {
  const variantStyles = {
    verified: 'badge-verified font-medium',
    available: 'badge-available font-semibold',
    rented: 'badge-rented font-medium',
    pending: 'badge-pending font-medium',
    outline: 'border border-slate-200 text-slate-700 bg-white',
    accent: 'bg-blue-50 text-[#02306B] border border-blue-200 font-medium',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide transition-all shadow-xs',
        variantStyles[variant],
        className
      )}
    >
      {icon && variant === 'verified' && <ShieldCheck className="w-3.5 h-3.5 text-[#02306B]" />}
      {icon && variant === 'available' && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
      )}
      {icon && variant === 'pending' && <Clock className="w-3.5 h-3.5 text-amber-600" />}
      {icon && variant === 'rented' && <AlertCircle className="w-3.5 h-3.5 text-red-600" />}
      <span>{children}</span>
    </span>
  );
}
