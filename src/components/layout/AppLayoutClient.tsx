'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { ToastProvider } from '@/components/ui/toast';
import type { Profile } from '@/types';

interface AppLayoutClientProps {
  children: React.ReactNode;
  profile: Profile | null;
}

export function AppLayoutClient({ children, profile }: AppLayoutClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-50 flex">
        {/* Desktop Sidebar */}
        <Sidebar role={profile?.role} />

        {/* Mobile Navigation Drawer */}
        <MobileNav
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          role={profile?.role}
        />

        {/* Main Content Area */}
        <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
          <Header
            profile={profile}
            onMobileMenuToggle={() => setMobileMenuOpen(true)}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
