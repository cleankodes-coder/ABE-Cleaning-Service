import React from 'react';
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react';
import { useOperations } from '../../context/OperationsContext';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useOperations();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2 pointer-events-none px-4 sm:px-0"
      aria-live="polite"
    >
      {toasts.map((t) => {
        const iconMap = {
          success: <CheckCircle2 className="h-4 w-4 text-[#16A34A] shrink-0" />,
          info: <Info className="h-4 w-4 text-[#0F1B3D] shrink-0" />,
          warning: <AlertTriangle className="h-4 w-4 text-[#8A6A2C] shrink-0" />,
          error: <XCircle className="h-4 w-4 text-[#DC2626] shrink-0" />,
        };

        return (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start gap-3 rounded-xl border border-[#E8EAF0] bg-white p-3.5 shadow-md transition-all"
          >
            <div className="mt-0.5">{iconMap[t.type]}</div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#0F1B3D]">{t.title}</p>
              {t.description && (
                <p className="mt-0.5 text-xs text-[#647087] leading-relaxed">{t.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(t.id)}
              aria-label="Dismiss notification"
              className="rounded p-1 text-[#647087] hover:bg-[#F7F8FA] hover:text-[#0F1B3D]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
