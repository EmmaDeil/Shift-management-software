import { useContext } from 'react';
import { ToastContext, type ToastContextValue } from './toastContext.ts';

export const useToasts = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToasts must be used within ToastProvider');
  return ctx;
};
