import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  description?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconColor = 'text-navy-600',
  iconBg = 'bg-navy-50',
}: StatCardProps) {
  return (
    <div className="card p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mt-2 tracking-tight">{value}</p>
          {description && (
            <p className="text-xs text-slate-500 mt-1">{description}</p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconBg} ${iconColor}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
