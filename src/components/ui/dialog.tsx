'use client';

import React from 'react';
import { X } from 'lucide-react';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  confirmLabel?: string;
  confirmVariant?: 'primary' | 'danger';
  onConfirm?: () => void;
  loading?: boolean;
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  confirmLabel,
  confirmVariant = 'primary',
  onConfirm,
  loading = false,
}: DialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-semibold text-slate-900 pr-8">{title}</h3>

        {description && (
          <p className="mt-2 text-sm text-slate-500">{description}</p>
        )}

        {children && <div className="mt-4">{children}</div>}

        {onConfirm && (
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 ${
                confirmVariant === 'danger'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-navy-600 hover:bg-navy-700'
              }`}
            >
              {loading ? 'Processing...' : confirmLabel || 'Confirm'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
