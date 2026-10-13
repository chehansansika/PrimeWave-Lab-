'use client';

import React from 'react';
import { signOut } from '@/lib/actions/auth';
import { LogOut, User, Menu } from 'lucide-react';
import type { Profile } from '@/types';

interface HeaderProps {
  profile: Profile | null;
  onMobileMenuToggle: () => void;
}

export function Header({ profile, onMobileMenuToggle }: HeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-20 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
      {/* Mobile Menu Button */}
      <div className="flex items-center gap-3 lg:hidden">
        <button
          onClick={onMobileMenuToggle}
          className="p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="font-semibold text-slate-800 text-base">ReserveHub</span>
      </div>

      {/* Title / Status area for larger screens */}
      <div className="hidden lg:flex items-center gap-2">
        <span className="text-sm font-medium text-slate-500">Resource Reservation System</span>
      </div>

      {/* User profile and action buttons */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold text-xs uppercase shadow-sm">
            {profile?.full_name?.charAt(0) || <User className="w-4 h-4" />}
          </div>
          <div className="flex flex-col text-right">
            <span className="text-xs font-semibold text-slate-800 leading-tight">
              {profile?.full_name || 'User'}
              {profile?.role === 'administrator' && (
                <span className="ml-1 text-[11px] font-bold text-blue-600">(Admin)</span>
              )}
            </span>
            <span className="text-[10px] text-slate-400 capitalize">
              {profile?.role === 'administrator' ? 'Administrator' : 'Employee'}
            </span>
          </div>
        </div>

        {/* Sign Out Button */}
        <form action={signOut}>
          <button
            type="submit"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-200 transition-all duration-150"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </form>
      </div>
    </header>
  );
}
