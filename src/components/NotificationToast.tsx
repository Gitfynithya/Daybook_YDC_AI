import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'error' | 'info';
}

interface NotificationToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  toasts,
  onDismiss,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2.5 max-w-md w-full pointer-events-none px-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start space-x-3 p-4 rounded-xl border-[1.5px] text-xs backdrop-blur-md transition-all font-mono animate-in slide-in-from-bottom-3 shadow-xl ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-100 border-emerald-400 dark:bg-emerald-950/90 dark:text-emerald-100 dark:border-emerald-400 light-mode:bg-emerald-50 light-mode:text-emerald-900 light-mode:border-emerald-600 shadow-[0_8px_30px_rgba(16,185,129,0.25)]'
              : toast.type === 'error'
              ? 'bg-rose-950/90 text-rose-100 border-rose-400 dark:bg-rose-950/90 dark:text-rose-100 dark:border-rose-400 light-mode:bg-rose-50 light-mode:text-rose-900 light-mode:border-rose-600 shadow-[0_8px_30px_rgba(244,63,94,0.25)]'
              : 'bg-slate-900/90 text-slate-100 border-blue-400 dark:bg-slate-900/90 dark:text-slate-100 dark:border-blue-400 light-mode:bg-blue-50 light-mode:text-blue-950 light-mode:border-blue-600 shadow-[0_8px_30px_rgba(37,99,235,0.25)]'
          }`}
          style={{
            backgroundColor: 'var(--toast-bg)',
            borderColor: 'var(--toast-border)',
            color: 'var(--toast-text)',
            boxShadow: 'var(--toast-shadow)'
          }}
        >
          {toast.type === 'success' ? (
            <div className="p-1 rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            </div>
          ) : toast.type === 'error' ? (
            <div className="p-1 rounded-md bg-rose-500/20 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5">
              <AlertCircle className="w-4 h-4 stroke-[2.5]" />
            </div>
          ) : (
            <div className="p-1 rounded-md bg-blue-500/20 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
              <Info className="w-4 h-4 stroke-[2.5]" />
            </div>
          )}

          <div className="flex-1 font-semibold leading-relaxed font-sans text-xs sm:text-sm">
            {toast.text}
          </div>

          <button
            onClick={() => onDismiss(toast.id)}
            className="text-current opacity-70 hover:opacity-100 p-1 rounded-md transition-opacity cursor-pointer shrink-0"
            aria-label="Close notification"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      ))}
    </div>
  );
};
