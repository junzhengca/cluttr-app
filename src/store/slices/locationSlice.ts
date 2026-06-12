import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Location } from '../../types/inventory';

interface LocationState {
  locations: Location[];
  loading: boolean;
  addingLocation: boolean;
  updatingLocationIds: string[];
  error: string | null;
}

const initialState: LocationState = {
  locations: [],
  loading: false,
  addingLocation: false,
  updatingLocationIds: [],
  error: null,
};

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    setLocations: (state, action: PayloadAction<Location[]>) => {
      state.locations = action.payload;
    },
    updateLocation: (state, action: PayloadAction<Location>) => {
      const index = state.locations.findIndex(
        (location) => location.id === action.payload.id
      );
      if (index !== -1) {
        state.locations[index] = action.payload;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setAddingLocation: (state, action: PayloadAction<boolean>) => {
      state.addingLocation = action.payload;
    },
    addUpdatingLocationId: (state, action: PayloadAction<string>) => {
      if (!state.updatingLocationIds.includes(action.payload)) {
        state.updatingLocationIds.push(action.payload);
      }
    },
    removeUpdatingLocationId: (state, action: PayloadAction<string>) => {
      state.updatingLocationIds = state.updatingLocationIds.filter(
        (id) => id !== action.payload
      );
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setLocations,
  updateLocation,
  setLoading,
  setAddingLocation,
  addUpdatingLocationId,
  removeUpdatingLocationId,
  setError,
} = locationSlice.actions;

// Selectors
const selectLocations = (state: { location: LocationState }) => state.location.locations;
const selectLoading = (state: { location: LocationState }) => state.location.loading;
const selectAddingLocation = (state: { location: LocationState }) => state.location.addingLocation;
const selectUpdatingLocationIds = (state: { location: LocationState }) =>
  state.location.updatingLocationIds;
const selectError = (state: { location: LocationState }) => state.location.error;

export {
  selectLocations,
  selectLoading,
  selectAddingLocation,
  selectUpdatingLocationIds,
  selectError,
};

export default locationSlice.reducer;
