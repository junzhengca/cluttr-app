import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { InventoryItem } from '../../types/inventory';

interface InventoryState {
  items: InventoryItem[];
  loading: boolean;
  error: string | null;
  updatingItemIds: Set<string>; // Track items being updated for debounced API calls
}

const initialState: InventoryState = {
  items: [],
  loading: true,
  error: null,
  updatingItemIds: new Set(),
};

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    setItems: (state, action: PayloadAction<InventoryItem[]>) => {
      state.items = action.payload;
    },
    addItem: (state, action: PayloadAction<InventoryItem>) => {
      state.items.unshift(action.payload);
    },
    updateItem: (state, action: PayloadAction<InventoryItem>) => {
      const index = state.items.findIndex((item) => item.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    addUpdatingItemId: (state, action: PayloadAction<string>) => {
      state.updatingItemIds.add(action.payload);
    },
    removeUpdatingItemId: (state, action: PayloadAction<string>) => {
      state.updatingItemIds.delete(action.payload);
    },
  },
});

export const {
  setItems,
  addItem,
  updateItem,
  removeItem,
  setLoading,
  setError,
  addUpdatingItemId,
  removeUpdatingItemId,
} = inventorySlice.actions;

// Selectors
const selectItems = (state: { inventory: InventoryState }) => state.inventory.items;

export const selectItemById = createSelector(
  [selectItems, (_state: { inventory: InventoryState }, itemId: string) => itemId],
  (items, itemId) => items.find((item) => item.id === itemId) || null
);

export const selectIsItemUpdating = createSelector(
  [(_state: { inventory: InventoryState }, itemId: string) => itemId],
  (_itemId) => {
    return (state: { inventory: InventoryState }) => state.inventory.updatingItemIds.has(_itemId);
  }
);

export default inventorySlice.reducer;
