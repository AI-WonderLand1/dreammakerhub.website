'use client';

import { useSyncExternalStore } from 'react';

export type ToastId = string;
export type ToastOptions = { id?: ToastId };

type ToastRecord = {
  id: ToastId;
  message: string;
  type: string;
};

export type ToastFunction = ((message: string) => ToastId) & {
  loading: (message: string, opts?: ToastOptions) => ToastId;
  success: (message: string, opts?: ToastOptions) => ToastId;
  error: (message: string, opts?: ToastOptions) => ToastId;
  dismiss: (id?: ToastId) => void;
};

const store = new Map<ToastId, { message: string; type: string }>();
const listeners = new Set<() => void>();

const notify = () => {
  for (const listener of listeners) listener();
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const makeId = () => Math.random().toString(36).slice(2);

const toast = ((message: string) => {
  const id = makeId();
  store.set(id, { message, type: 'default' });
  notify();
  console.log('[toast]', message);
  return id;
}) as ToastFunction;

toast.loading = (message, opts) => {
  const id = opts?.id ?? makeId();
  store.set(id, { message, type: 'loading' });
  notify();
  console.log('[toast:loading]', message);
  return id;
};

toast.success = (message, opts) => {
  const id = opts?.id ?? makeId();
  store.set(id, { message, type: 'success' });
  notify();
  console.log('[toast:success]', message);
  return id;
};

toast.error = (message, opts) => {
  const id = opts?.id ?? makeId();
  store.set(id, { message, type: 'error' });
  notify();
  console.log('[toast:error]', message);
  return id;
};

toast.dismiss = (id?: ToastId) => {
  if (id) {
    store.delete(id);
  } else {
    store.clear();
  }
  notify();
};

function getSnapshot(): ToastRecord[] {
  return Array.from(store.entries()).map(([id, item]) => ({ id, ...item }));
}

export function Toaster() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  if (!items.length) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {items.map((item) => (
        <div
          key={item.id}
          role="status"
          aria-live="polite"
          className={`rounded-lg border px-3 py-2 text-sm shadow-lg ${
            item.type === 'error'
              ? 'border-red-400/40 bg-red-500/20 text-red-100'
              : item.type === 'success'
              ? 'border-emerald-400/40 bg-emerald-500/20 text-emerald-100'
              : item.type === 'loading'
              ? 'border-cyan-400/40 bg-cyan-500/20 text-cyan-100'
              : 'border-white/20 bg-white/10 text-white'
          }`}
        >
          {item.message}
        </div>
      ))}
    </div>
  );
}

export default toast;
