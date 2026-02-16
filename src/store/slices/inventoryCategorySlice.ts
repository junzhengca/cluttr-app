import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { InventoryCategory } from '../../types/inventory';

interface InventoryCategoryState {
  categories: InventoryCategory[];
  loading: boolean;
  error: string | null;
}

const initialState: InventoryCategoryState = {
  categories: [],
  loading: true,
  error: null,
};

const inventoryCategorySlice = createSlice({
  name: 'inventoryCategory',
  initialState,
  reducers: {
    setCategories: (state, action: PayloadAction<InventoryCategory[]>) => {
      state.categories = action.payload;
    },
    silentSetCategories: (state, action: PayloadAction<InventoryCategory[]>) => {
      // Silent update - only updates categories, does not touch loading state
      state.categories = action.payload;
    },
    addCategory: (state, action: PayloadAction<InventoryCategory>) => {
      state.categories.push(action.payload);
    },
    updateCategory: (state, action: PayloadAction<InventoryCategory>) => {
      const index = state.categories.findIndex(
        (cat) => cat.id === action.payload.id
      );
      if (index !== -1) {
        state.categories[index] = action.payload;
      }
    },
    removeCategory: (state, action: PayloadAction<string>) => {
      state.categories = state.categories.filter(
        (cat) => cat.id !== action.payload
      );
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setCategories,
  silentSetCategories,
  addCategory,
  updateCategory,
  removeCategory,
  setLoading,
  setError,
} = inventoryCategorySlice.actions;

export default inventoryCategorySlice.reducer;
