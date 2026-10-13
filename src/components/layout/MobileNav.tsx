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
  X,
} from 'lucide-react';
import type { UserRole } from '@/types';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  role?: UserRole;
}

export function MobileNav({ isOpen, onClose, role = 'employee' }: MobileNavProps) {
  const pathname = usePathname();

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-72 bg-[#0f1d30] border-r border-slate-800 p-6 flex flex-col z-10 shadow-2xl">
        <div className="flex items-center justify-between pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-base font-bold text-white tracking-tight">ReserveHub</span>
              <span className="block text-[10px] text-slate-400 font-medium -mt-0.5">PrimeWave Lab</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 mt-6 space-y-1.5 overflow-y-auto">
          {filteredNav.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-800/60 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="capitalize">{role} Mode</span>
          </div>
        </div>
      </div>
    </div>
  );
}
