import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Toast, ToastType } from './Toast';

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Global toast reference for use in sagas
let globalToastRef: ((message: string, type?: ToastType) => void) | null = null;

export const setGlobalToast = (toastFn: (message: string, type?: ToastType) => void) => {
  globalToastRef = toastFn;
};

export const getGlobalToast = (): ((message: string, type?: ToastType) => void) | null => {
  return globalToastRef;
};

interface ToastProviderProps {
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

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
