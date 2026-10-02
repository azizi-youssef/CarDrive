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
    accent: 'bg-teal-50 text-[#046c7a] border border-teal-200 font-medium',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs transition-colors',
        variantStyles[variant],
        className
      )}
    >
      {icon && variant === 'verified' && <ShieldCheck className="w-3.5 h-3.5 text-[#046c7a]" />}
      {icon && variant === 'available' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
      {icon && variant === 'pending' && <Clock className="w-3.5 h-3.5 text-amber-600" />}
      {icon && variant === 'rented' && <AlertCircle className="w-3.5 h-3.5 text-red-600" />}
      {children}
    </span>
  );
}
