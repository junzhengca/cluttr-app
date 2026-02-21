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
    silentSetLocations: (state, action: PayloadAction<Location[]>) => {
      // Silent update - only updates locations, does not touch loading state
      state.locations = action.payload;
    },
    addLocation: (state, action: PayloadAction<Location>) => {
      state.locations.push(action.payload);
    },
    updateLocation: (state, action: PayloadAction<Location>) => {
      const index = state.locations.findIndex(
        (location) => location.id === action.payload.id
      );
      if (index !== -1) {
        state.locations[index] = action.payload;
      }
    },
    removeLocation: (state, action: PayloadAction<string>) => {
      state.locations = state.locations.filter((location) => location.id !== action.payload);
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
    upsertLocations: (state, action: PayloadAction<Location[]>) => {
      const locationsToUpsert = action.payload;
      if (locationsToUpsert.length === 0) return;

      const locationMap = new Map(state.locations.map((location) => [location.id, location]));
      locationsToUpsert.forEach((location) => {
        locationMap.set(location.id, location);
      });
      state.locations = Array.from(locationMap.values());
    },
    removeLocations: (state, action: PayloadAction<string[]>) => {
      const idsToRemove = new Set(action.payload);
      if (idsToRemove.size === 0) return;
      state.locations = state.locations.filter((location) => !idsToRemove.has(location.id));
    },
    addLocations: (state, action: PayloadAction<Location[]>) => {
      action.payload.forEach((location) => {
        const index = state.locations.findIndex((l) => l.id === location.id);
        if (index === -1) {
          state.locations.push(location); // Only add if not exists
        }
      });
    },
  },
});

export const {
  setLocations,
  silentSetLocations,
  addLocation,
  updateLocation,
  removeLocation,
  setLoading,
  setAddingLocation,
  addUpdatingLocationId,
  removeUpdatingLocationId,
  setError,
  upsertLocations,
  removeLocations,
  addLocations,
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
