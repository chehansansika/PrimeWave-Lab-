'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Layers,
  CalendarCheck2,
  CalendarPlus,
  Clock,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import type { UserRole } from '@/types';

interface SidebarProps {
  role?: UserRole;
}

export function Sidebar({ role = 'employee' }: SidebarProps) {
  const pathname = usePathname();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['administrator', 'employee'],
    },
    {
      name: 'Resources',
      href: '/resources',
      icon: Layers,
      roles: ['administrator', 'employee'],
    },
    {
      name: 'Availability',
      href: '/availability',
      icon: CalendarCheck2,
      roles: ['administrator', 'employee'],
    },
    {
      name: 'Book Resource',
      href: '/reservations/new',
      icon: CalendarPlus,
      roles: ['administrator', 'employee'],
    },
    {
      name: 'My Reservations',
      href: '/reservations',
      icon: Clock,
      roles: ['administrator', 'employee'],
    },
    {
      name: 'Admin Reservations',
      href: '/admin/reservations',
      icon: ShieldCheck,
      roles: ['administrator'],
    },
  ];

  const filteredNav = navigation.filter((item) => item.roles.includes(role));

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-[#0f1d30] border-r border-slate-800 z-30">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-800">
        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <span className="text-base font-bold text-white tracking-tight">ReserveHub</span>
          <span className="block text-[11px] text-slate-400 font-medium -mt-0.5">PrimeWave Lab</span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
          Menu
        </div>
        {filteredNav.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>

      {/* Role Indicator Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/40">
        <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg bg-slate-800/50">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-200 capitalize">{role}</span>
            <span className="text-[11px] text-slate-500">Access Granted</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
