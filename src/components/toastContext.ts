import { createContext } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';
export interface Toast { id: string; type: ToastType; message: string; }

export interface ToastContextValue {
  toasts: Toast[];
  push: (type: ToastType, message: string) => void;
  remove: (id: string) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);
