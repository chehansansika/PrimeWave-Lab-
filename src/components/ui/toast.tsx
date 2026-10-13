'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  addToast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-500 shrink-0" />,
  };

  const bgColors = {
    success: 'bg-emerald-50 border-emerald-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg animate-slide-up ${bgColors[toast.type]}`}
          >
            {icons[toast.type]}
            <p className="text-sm text-slate-700 flex-1">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
