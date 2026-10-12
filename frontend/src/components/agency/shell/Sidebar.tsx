'use client';

import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, Car, CalendarDays, Users, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AgencySection = {
  id: string;
  label: string;
  icon: LucideIcon;
  count?: number;
  badge?: 'alert';
};

export const AGENCY_SECTIONS: readonly {
  id: 'overview' | 'bookings' | 'fleet' | 'customers' | 'access';
  label: string;
  icon: LucideIcon;
}[] = [
  { id: 'overview', label: "Vue d'ensemble", icon: LayoutDashboard },
  { id: 'bookings', label: 'Réservations', icon: CalendarDays },
  { id: 'fleet', label: 'Flotte', icon: Car },
  { id: 'customers', label: 'Clients', icon: Users },
  { id: 'access', label: 'Équipe & accès', icon: Users },
] as const;

export function Sidebar({
  sections,
  active,
  onNavigate,
  collapsed,
  onToggleCollapsed,
  agencyName,
  verified,
}: {
  sections: AgencySection[];
  active: string;
  onNavigate: (id: string) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  agencyName: string;
  verified: boolean;
}) {
  return (
    <aside
      aria-label="Navigation du portail agence"
      className={cn(
        'hidden shrink-0 flex-col border-r border-white/10 bg-[#0B1220] transition-[width] duration-200 lg:sticky lg:top-0 lg:flex lg:h-screen',
        collapsed ? 'w-[76px]' : 'w-64'
      )}
    >
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
        <div
          aria-hidden="true"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E63946] text-sm font-bold text-white"
        >
          CD
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{agencyName}</p>
            <p className="text-[11px] text-slate-400">
              {verified ? 'Agence vérifiée' : 'Vérification en attente'}
            </p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        <ul className="space-y-1">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = active === section.id;
            return (
              <li key={section.id}>
                <button
                  type="button"
                  onClick={() => onNavigate(section.id)}
                  aria-current={isActive ? 'page' : undefined}
                  title={collapsed ? section.label : undefined}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#E63946]',
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white',
                    collapsed && 'justify-center px-0'
                  )}
                >
                  <Icon aria-hidden="true" className="h-[18px] w-[18px] shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="min-w-0 flex-1 text-left">{section.label}</span>
                      {typeof section.count === 'number' && (
                        <span className="shrink-0 text-xs tabular-nums text-slate-500">
                          {section.count}
                        </span>
                      )}
                      {section.badge === 'alert' && (
                        <span
                          aria-label="Action requise"
                          className="h-2 w-2 shrink-0 rounded-full bg-[#E63946]"
                        />
                      )}
                    </>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-expanded={!collapsed}
          className={cn(
            'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 outline-none transition-colors hover:bg-white/5 hover:text-white focus-visible:ring-2 focus-visible:ring-[#E63946]',
            collapsed && 'justify-center px-0'
          )}
        >
          {collapsed ? (
            <PanelLeftOpen aria-hidden="true" className="h-[18px] w-[18px]" />
          ) : (
            <>
              <PanelLeftClose aria-hidden="true" className="h-[18px] w-[18px]" />
              <span>Réduire</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
