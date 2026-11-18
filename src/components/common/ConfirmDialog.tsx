import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useOperations } from '../../context/OperationsContext';

export const ConfirmDialog: React.FC = () => {
  const { confirmState, closeConfirm } = useOperations();

  if (!confirmState) return null;

  const isDanger = confirmState.variant === 'danger';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F1B3D]/45 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="w-full max-w-md rounded-xl border border-[#E8EAF0] bg-white p-6 shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                isDanger ? 'bg-[#FEF2F2] text-[#B91C1C]' : 'bg-[#F7F2E7] text-[#8A6A2C]'
              }`}
            >
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3
                id="confirm-dialog-title"
                className="font-display text-base font-semibold text-[#0F1B3D]"
              >
                {confirmState.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[#647087]">
                {confirmState.description}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeConfirm}
            aria-label="Close dialog"
            className="rounded-lg p-1.5 text-[#647087] hover:bg-[#F7F8FA] hover:text-[#0F1B3D] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={closeConfirm}
            className="rounded-lg border border-[#E8EAF0] bg-white px-4 py-2 text-sm font-medium text-[#0F1B3D] hover:bg-[#F7F8FA] transition-colors whitespace-nowrap"
          >
            {confirmState.cancelLabel || 'Cancel'}
          </button>
          <button
            type="button"
            onClick={() => {
              confirmState.onConfirm();
              closeConfirm();
            }}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors whitespace-nowrap ${
              isDanger
                ? 'bg-[#DC2626] hover:bg-[#B91C1C]'
                : 'bg-[#0F1B3D] hover:bg-[#1A2B5C]'
            }`}
          >
            {confirmState.confirmLabel || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};
