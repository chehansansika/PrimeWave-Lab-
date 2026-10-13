import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ReserveHub - Resource Reservation Management',
  description: 'A centralized resource reservation management system for organizations to manage shared resources like meeting rooms, projectors, and equipment.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
