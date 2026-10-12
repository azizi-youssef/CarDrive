'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarDays,
  Building2,
  Car,
  Users,
  DollarSign,
  BarChart3,
  Shield,
  Bell,
  Settings,
  ScrollText,
  Activity,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  LogOut,
  Menu,
  X,
  Globe,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ── Navigation items ──────────────────────────────────────────────── */
const NAV_GROUPS = [
  {
    label: 'Opérations',
    items: [
      { href: '/admin', label: "Vue d'ensemble", icon: LayoutDashboard, exact: true },
      { href: '/admin/bookings', label: 'Réservations', icon: CalendarDays },
      { href: '/admin/agencies', label: 'Agences', icon: Building2 },
      { href: '/admin/fleet', label: 'Flotte véhicules', icon: Car },
      { href: '/admin/customers', label: 'Clients', icon: Users },
    ],
  },
  {
    label: 'Finance',
    items: [
      { href: '/admin/finance', label: 'Commissions', icon: DollarSign },
      { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Administration',
    items: [
      { href: '/admin/permissions', label: 'Permissions', icon: Shield },
      { href: '/admin/notifications', label: 'Notifications', icon: Bell },
      { href: '/admin/settings', label: 'Paramètres', icon: Settings },
      { href: '/admin/audit', label: 'Audit logs', icon: ScrollText },
      { href: '/admin/health', label: 'System Health', icon: Activity },
    ],
  },
];

/* ── Logo ──────────────────────────────────────────────────────────── */
function SidebarLogo({ collapsed }: { collapsed: boolean }) {
  return (
    <Link
      href="/admin"
      className="flex items-center gap-2.5 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E63946]/60 rounded-md"
    >
      <div className={cn('relative shrink-0', collapsed ? 'h-7 w-7' : 'h-8 w-[120px]')}>
        <Image
          src="/Logo-CarDrive2.png"
          alt="CarDrive"
          fill
          sizes={collapsed ? '28px' : '120px'}
          className="object-contain object-left"
          priority
        />
      </div>
      {!collapsed && (
        <span className="rounded bg-[#E63946] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white leading-none">
          Admin
        </span>
      )}
    </Link>
  );
}

/* ── Nav item ──────────────────────────────────────────────────────── */
function NavItem({
  item,
  collapsed,
  active,
}: {
  item: (typeof NAV_GROUPS)[0]['items'][0];
  collapsed: boolean;
  active: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#E63946]/60',
        collapsed && 'justify-center px-2',
        active
          ? 'bg-[#E63946]/10 text-[#E63946]'
          : 'text-slate-400 hover:bg-white/5 hover:text-white'
      )}
    >
      <Icon
        aria-hidden="true"
        className={cn(
          'shrink-0 transition-colors',
          collapsed ? 'h-5 w-5' : 'h-[18px] w-[18px]',
          active ? 'text-[#E63946]' : 'group-hover:text-white'
        )}
      />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );
}

/* ── Sidebar ───────────────────────────────────────────────────────── */
export function AdminSidebar({
  collapsed,
  onToggle,
  onLogout,
  loggingOut,
}: {
  collapsed: boolean;
  onToggle: () => void;
  onLogout: () => void;
  loggingOut: boolean;
}) {
  const pathname = usePathname();

  function isActive(item: { href: string; exact?: boolean }) {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  }

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col bg-[#0B1220] text-white transition-all duration-300 ease-in-out shrink-0 h-screen sticky top-0',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center border-b border-white/10 h-16', collapsed ? 'justify-center px-3' : 'px-5')}>
        <SidebarLogo collapsed={collapsed} />
      </div>

      {/* Nav groups */}
      <nav aria-label="Navigation administration" className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.href}>
                  <NavItem item={item} collapsed={collapsed} active={isActive(item)} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer actions */}
      <div className={cn('border-t border-white/10 p-3 space-y-0.5', collapsed && 'flex flex-col items-center')}>
        <Link
          href="/"
          title={collapsed ? 'Retour au site' : undefined}
          className={cn(
            'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-white/5 hover:text-white outline-none focus-visible:ring-2 focus-visible:ring-[#E63946]/60',
            collapsed && 'justify-center px-2'
          )}
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Retour au site</span>}
        </Link>
        <button
          type="button"
          onClick={onLogout}
          disabled={loggingOut}
          title={collapsed ? 'Déconnexion' : undefined}
          className={cn(
            'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-white/5 hover:text-white outline-none focus-visible:ring-2 focus-visible:ring-[#E63946]/60 disabled:opacity-50',
            collapsed && 'justify-center px-2'
          )}
        >
          <LogOut aria-hidden="true" className="h-4 w-4 shrink-0" />
          {!collapsed && <span>{loggingOut ? 'Déconnexion…' : 'Se déconnecter'}</span>}
        </button>

        {/* Collapse toggle */}
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? 'Étendre la sidebar' : 'Réduire la sidebar'}
          className={cn(
            'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-white/5 hover:text-slate-400 outline-none focus-visible:ring-2 focus-visible:ring-[#E63946]/60 mt-2',
            collapsed && 'justify-center px-2'
          )}
        >
          {collapsed ? (
            <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0" />
          ) : (
            <>
              <ChevronLeft aria-hidden="true" className="h-4 w-4 shrink-0" />
              <span>Réduire</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

/* ── Mobile drawer ─────────────────────────────────────────────────── */
export function AdminMobileDrawer({
  open,
  onClose,
  onLogout,
  loggingOut,
}: {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
  loggingOut: boolean;
}) {
  const pathname = usePathname();

  function isActive(item: { href: string; exact?: boolean }) {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside className="fixed inset-y-0 left-0 z-50 w-72 bg-[#0B1220] text-white flex flex-col lg:hidden shadow-2xl">
        <div className="flex items-center justify-between h-16 px-5 border-b border-white/10">
          <SidebarLogo collapsed={false} />
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le menu"
            className="rounded-lg p-1.5 text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav aria-label="Navigation administration" className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      aria-current={isActive(item) ? 'page' : undefined}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                        isActive(item)
                          ? 'bg-[#E63946]/10 text-[#E63946]'
                          : 'text-slate-400 hover:bg-white/5 hover:text-white'
                      )}
                    >
                      <item.icon aria-hidden="true" className="h-[18px] w-[18px] shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3 space-y-0.5">
          <Link
            href="/"
            onClick={onClose}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            Retour au site
          </Link>
          <button
            type="button"
            onClick={onLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-white/5 hover:text-white transition-colors disabled:opacity-50"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {loggingOut ? 'Déconnexion…' : 'Se déconnecter'}
          </button>
        </div>
      </aside>
    </>
  );
}

/* ── Top bar (desktop) ─────────────────────────────────────────────── */
export function AdminTopBar({
  title,
  subtitle,
  actions,
  onMobileMenu,
  onLogout,
  loggingOut,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  onMobileMenu: () => void;
  onLogout: () => void;
  loggingOut: boolean;
}) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    }
    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileMenuOpen]);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 h-16 sm:h-[70px] flex items-center px-4 sm:px-6 lg:px-8 gap-3 sm:gap-4 transition-all shadow-2xs">
      {/* Mobile menu button */}
      <button
        type="button"
        onClick={onMobileMenu}
        aria-label="Ouvrir le menu"
        className="lg:hidden flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Breadcrumbs & Title */}
      <div className="flex-1 min-w-0">
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium text-slate-400 mb-0.5">
          <span>Plateforme CarDrive</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-600 font-semibold">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-none truncate">
            {title}
          </h1>
          {subtitle && (
            <span className="hidden md:inline-block text-xs text-slate-400 truncate font-normal">
              · {subtitle}
            </span>
          )}
        </div>
      </div>

      {/* Center / Status Indicator */}
      <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold shadow-2xs">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span>Marketplace Active · Oriental (Nador)</span>
      </div>

      {/* Secondary Quick Action Tools */}
      <div className="flex items-center gap-2">
        {/* Link to public website */}
        <Link
          href="/"
          target="_blank"
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs"
          title="Ouvrir la marketplace client dans un nouvel onglet"
        >
          <Globe className="h-3.5 w-3.5 text-slate-400" />
          <span>Voir le site</span>
          <ExternalLink className="h-3 w-3 text-slate-400" />
        </Link>

        {/* Notifications / Audit quick link */}
        <Link
          href="/admin/audit"
          className="relative inline-flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs"
          title="Journaux d’audit de la plateforme"
          aria-label="Audit logs"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#E63946] ring-2 ring-white"></span>
        </Link>
      </div>

      {/* Page Actions prop */}
      {actions && <div className="flex items-center gap-2">{actions}</div>}

      {/* Interactive User Profile & Dropdown */}
      <div className="relative pl-2 border-l border-slate-200" ref={profileRef}>
        <button
          type="button"
          onClick={() => setProfileMenuOpen((prev) => !prev)}
          className="flex items-center gap-2.5 rounded-xl p-1.5 hover:bg-slate-100/80 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#E63946]/50"
          aria-expanded={profileMenuOpen}
          aria-haspopup="true"
        >
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-gradient-to-br from-[#E63946] to-[#C92F3B] flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs border border-white/20">
            SA
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-slate-900 leading-tight flex items-center gap-1">
              <span>Super Admin</span>
              <ChevronDown
                className={`h-3 w-3 text-slate-400 transition-transform duration-200 ${
                  profileMenuOpen ? 'rotate-180 text-slate-700' : ''
                }`}
              />
            </p>
            <p className="text-[11px] text-slate-500 font-mono">admin@cardrive.ma</p>
          </div>
        </button>

        {/* Profile Popover Menu */}
        {profileMenuOpen && (
          <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-white shadow-2xl border border-slate-200 p-2 text-left z-50 animate-scale-in">
            {/* Header info card */}
            <div className="px-3 py-2.5 bg-slate-50 rounded-xl mb-1.5 border border-slate-100">
              <p className="text-xs font-bold text-slate-900">Super Administrateur</p>
              <p className="text-[11px] text-slate-500 font-mono truncate">admin@cardrive.ma</p>
              <div className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-red-700 bg-red-100/70 px-2 py-0.5 rounded-md w-fit">
                <ShieldCheck className="h-3 w-3" />
                <span>Rôle : SUPER_ADMIN</span>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-0.5 text-xs font-medium text-slate-700">
              <Link
                href="/admin/settings"
                onClick={() => setProfileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <Settings className="h-4 w-4 text-slate-400" />
                <span>Paramètres de la plateforme</span>
              </Link>
              <Link
                href="/admin/permissions"
                onClick={() => setProfileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <Shield className="h-4 w-4 text-slate-400" />
                <span>Rôles & Permissions</span>
              </Link>
              <Link
                href="/admin/audit"
                onClick={() => setProfileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <ScrollText className="h-4 w-4 text-slate-400" />
                <span>Journaux d'audit de sécurité</span>
              </Link>
            </div>

            {/* Divider */}
            <div className="my-1.5 border-t border-slate-100" />

            {/* Logout button */}
            <button
              type="button"
              onClick={() => {
                setProfileMenuOpen(false);
                onLogout();
              }}
              disabled={loggingOut}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <LogOut className="h-4 w-4 text-red-500" />
              <span>{loggingOut ? 'Déconnexion en cours…' : 'Se déconnecter'}</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

/* ── Shell (layout wrapper) ────────────────────────────────────────── */
export function AdminShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      window.location.assign('/login?portal=admin');
    }
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-[#F1F5F9]">
      {/* Desktop Sidebar */}
      <AdminSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        onLogout={handleLogout}
        loggingOut={loggingOut}
      />

      {/* Mobile Drawer */}
      <AdminMobileDrawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        onLogout={handleLogout}
        loggingOut={loggingOut}
      />

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <AdminTopBar
          title={title}
          subtitle={subtitle}
          actions={actions}
          onMobileMenu={() => setMobileOpen(true)}
          onLogout={handleLogout}
          loggingOut={loggingOut}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
