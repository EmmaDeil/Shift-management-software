import React, { useState, useCallback } from 'react';
import { ToastContext, type Toast, type ToastType } from './toastContext';

const genId = () => Math.random().toString(36).slice(2, 9);

const ToastProviderInner: React.FC<{ children: React.ReactNode }> = ({ children }) => {
   const [toasts, setToasts] = useState<Toast[]>([]);

   const remove = useCallback((id: string) => setToasts(ts => ts.filter(t => t.id !== id)), []);
   const push = useCallback((type: ToastType, message: string) => {
      const id = genId();
      setToasts(ts => [...ts, { id, type, message }]);
      setTimeout(() => remove(id), 3500);
   }, [remove]);

   return (
      <ToastContext.Provider value={{ toasts, push, remove }}>
         {children}
         <div style={{ position: 'fixed', top: 12, right: 12, zIndex: 1060, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {toasts.map(t => (
               <div key={t.id} className={`toast align-items-center show border-0`} role="alert" aria-live="assertive" aria-atomic="true" style={{ minWidth: 260 }}>
                  <div className={`toast-body text-white bg-${t.type === 'success' ? 'success' : t.type === 'error' ? 'danger' : t.type === 'warning' ? 'warning' : 'primary'}`} style={{ borderRadius: 6, padding: '8px 12px' }}>
                     {t.message}
                  </div>
               </div>
            ))}
         </div>
      </ToastContext.Provider>
   );
};

export const ToastProvider = ToastProviderInner;
