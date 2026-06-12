export type ToastType = 'success' | 'info' | 'error';

export type ToastFn = (message: string, type?: ToastType) => void;

// Global toast reference so non-React layers (sagas, services) can surface
// user-facing notifications without importing from the component tree.
let globalToastRef: ToastFn | null = null;

export const setGlobalToast = (toastFn: ToastFn) => {
  globalToastRef = toastFn;
};

export const getGlobalToast = (): ToastFn | null => {
  return globalToastRef;
};
