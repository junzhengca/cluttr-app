import { useCallback, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';

/**
 * Hook for accessing inventory categories.
 * Categories are now managed via Redux state and CRUD API endpoints (not sync).
 *
 * @deprecated Use useInventoryCategories from src/store/hooks.ts instead for full CRUD operations.
 * This hook is kept for backward compatibility.
 */
export const useCategories = () => {
  const dispatch = useAppDispatch();
  const allCategories = useAppSelector((state) => state.inventoryCategory.categories);
  const loading = useAppSelector((state) => state.inventoryCategory.loading);
  const error = useAppSelector((state) => state.inventoryCategory.error);
  const activeHomeId = useAppSelector((state) => state.auth.activeHomeId);

  // Filter categories by active home
  const categories = allCategories.filter((c) => c.homeId === activeHomeId);

  const refreshCategories = useCallback(() => {
    dispatch({ type: 'inventoryCategory/SILENT_LOAD_CATEGORIES' });
  }, [dispatch]);

  // Load categories when home changes
  useEffect(() => {
    if (activeHomeId) {
      dispatch({ type: 'inventoryCategory/LOAD_CATEGORIES' });
    }
  }, [activeHomeId, dispatch]);

  return {
    categories,
    loading,
    error,
    refreshCategories,
  };
};
