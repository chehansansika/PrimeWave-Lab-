import React from 'react';

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-slate-200/80 rounded-md ${className}`}
    />
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="h-12 bg-slate-50 border-b border-slate-200 flex items-center px-6 gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-16 flex items-center px-6 gap-4">
            {Array.from({ length: cols }).map((_, j) => (
              <Skeleton key={j} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
