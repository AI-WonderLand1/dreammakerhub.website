"use client";

export type ToastTone = "error" | "success";

export type ToastItem = {
  id: string;
  message: string;
  tone: ToastTone;
  actionLabel?: string;
  onAction?: () => void;
};

export function ToastStack({ toasts }: { toasts: ToastItem[] }) {
  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          aria-live="polite"
          className={`rounded-lg border px-3 py-2 text-sm shadow-lg ${toast.tone === "error" ? "border-red-400/40 bg-red-500/20 text-red-100" : "border-emerald-400/40 bg-emerald-500/20 text-emerald-100"}`}
        >
          <div className="flex items-center justify-between gap-2">
            <span>{toast.message}</span>
            {toast.actionLabel && toast.onAction ? (
              <button
                type="button"
                className="pointer-events-auto rounded border border-white/30 px-2 py-0.5 text-xs font-semibold text-white"
                onClick={toast.onAction}
              >
                {toast.actionLabel}
              </button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
