import React, { createContext, useContext, useState, useCallback } from 'react';

interface InventoryContextType {
  refreshItems: () => void;
  setRefreshCallback: (callback: () => void) => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [refreshCallback, setRefreshCallbackState] = useState<(() => void) | null>(null);

  const setRefreshCallback = useCallback((callback: () => void) => {
    setRefreshCallbackState(() => callback);
  }, []);

  const refreshItems = useCallback(() => {
    if (refreshCallback) {
      refreshCallback();
    }
  }, [refreshCallback]);

  return (
    <InventoryContext.Provider value={{ refreshItems, setRefreshCallback }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within InventoryProvider');
  }
  return context;
};

