import React, { createContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Toast, type ToastType } from '../atoms';
import { setGlobalToast } from '../../utils/toastRegistry';

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Non-React layers (sagas, services) access the toast via utils/toastRegistry.
export { setGlobalToast, getGlobalToast } from '../../utils/toastRegistry';

export interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
    visible: boolean;
  } | null>(null);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    setToast({
      message,
      type,
      visible: true,
    });
  }, []);

  const handleHide = useCallback(() => {
    setToast((prev) => (prev ? { ...prev, visible: false } : null));
  }, []);

  // Set global reference for saga access
  useEffect(() => {
    setGlobalToast(showToast);
    return () => {
      setGlobalToast(() => {});
    };
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          visible={toast.visible}
          onHide={handleHide}
        />
      )}
    </ToastContext.Provider>
  );
};

// Note: useToast hook is exported from hooks/useToast.ts to avoid circular dependencies
