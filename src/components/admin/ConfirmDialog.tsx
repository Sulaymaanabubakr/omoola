import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  onConfirm,
  onCancel,
  danger = true,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-background rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-3">
          {danger && (
            <div className="w-10 h-10 bg-destructive/10 rounded-xl flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
          )}
          <h3 className="font-semibold text-base">{title}</h3>
        </div>
        <p className="text-muted-foreground text-sm mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 border border-border rounded-xl font-medium text-sm hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-colors ${
              danger
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                : 'bg-brand-700 text-white hover:bg-brand-800'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
