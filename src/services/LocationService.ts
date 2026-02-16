import { generateItemId } from '../utils/idGenerator';
import { ApiClient } from './ApiClient';
import {
  LocationDto,
  CreateLocationRequest,
  UpdateLocationRequest,
  DeleteLocationResponse,
  ListLocationsResponse,
  CreateLocationResponse,
  UpdateLocationResponse,
} from '../types/api';
import { Location } from '../types/inventory';
import { apiLogger } from '../utils/Logger';
import Ionicons from '@expo/vector-icons/Ionicons';

// Simple state for in-memory storage (no file persistence)
interface LocationState {
  locations: Location[];
}

interface LocationLoadingState {
  isLoading: boolean;
  operation: 'list' | 'create' | 'update' | 'delete' | null;
  error: string | null;
}

/**
 * Convert API DTO to domain model
 */
function dtoToLocation(dto: LocationDto): Location {
  return {
    id: dto.locationId,
    homeId: dto.homeId,
    name: dto.name,
    icon: dto.icon as keyof typeof Ionicons.glyphMap | undefined,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

class LocationService {
  // Simple state instead of file storage
  private state: Map<string, LocationState> = new Map(); // homeId -> state
  private listeners: Set<() => void> = new Set();

  // Loading state tracking
  private loadingState: LocationLoadingState = {
    isLoading: false,
    operation: null,
    error: null,
  };

  /**
   * Get state for a specific home
   */
  private getState(homeId: string): LocationState {
    if (!this.state.has(homeId)) {
      this.state.set(homeId, { locations: [] });
    }
    return this.state.get(homeId)!;
  }

  /**
   * Subscribe to location state changes
   * @returns Unsubscribe function
   */
  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    this.listeners.forEach((cb) => cb());
  }

  /**
   * Get current loading state
   */
  getLoadingState(): LocationLoadingState {
    return { ...this.loadingState };
  }

  /**
   * Set loading state
   */
  private setLoading(
    operation: LocationLoadingState['operation'],
    error: string | null = null
  ): void {
    this.loadingState = {
      isLoading: operation !== null,
      operation,
      error,
    };
    this.notifyListeners();
  }

  /**
   * Fetch locations from server for a home
   */
  async fetchLocations(apiClient: ApiClient, homeId: string): Promise<Location[]> {
    this.setLoading('list');
    try {
      const response = (await apiClient.listLocations(homeId)) as ListLocationsResponse;
      const locations = response.locations.map((dto) => dtoToLocation(dto));

      // Update state
      const state = this.getState(homeId);
      state.locations = locations;

      this.setLoading(null);
      this.notifyListeners();
      return locations;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch locations';
      apiLogger.error('Failed to fetch locations:', error);
      this.setLoading(null, errorMessage);
      throw error;
    }
  }

  /**
   * Create a new location
   */
  async createLocation(
    apiClient: ApiClient,
    homeId: string,
    input: {
      name: string;
      icon?: string;
    }
  ): Promise<Location | null> {
    this.setLoading('create');
    try {
      const newId = generateItemId();
      const request: CreateLocationRequest = {
        locationId: newId,
        name: input.name.trim(),
        icon: input.icon,
      };

      const response = (await apiClient.createLocation(
        homeId,
        request
      )) as CreateLocationResponse;
      const newLocation = dtoToLocation(response.location);

      // Add to state
      const state = this.getState(homeId);
      // Create a new array to avoid issues with frozen arrays
      state.locations = [newLocation, ...state.locations];

      this.setLoading(null);
      this.notifyListeners();
      return newLocation;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create location';
      apiLogger.error('Failed to create location:', error);
      this.setLoading(null, errorMessage);
      throw error;
    }
  }

  /**
   * Update a location
   */
  async updateLocation(
    apiClient: ApiClient,
    homeId: string,
    locationId: string,
    updates: {
      name?: string;
      icon?: string;
    }
  ): Promise<Location | null> {
    this.setLoading('update');
    try {
      const request: UpdateLocationRequest = {
        name: updates.name,
        icon: updates.icon,
      };

      const response = (await apiClient.updateLocation(
        homeId,
        locationId,
        request
      )) as UpdateLocationResponse;
      const updatedLocation = dtoToLocation(response.location);

      // Update in state
      const state = this.getState(homeId);
      const index = state.locations.findIndex((l) => l.id === locationId);
      if (index >= 0) {
        // Create a new array to avoid issues with frozen arrays
        state.locations = [
          ...state.locations.slice(0, index),
          updatedLocation,
          ...state.locations.slice(index + 1),
        ];
      }

      this.setLoading(null);
      this.notifyListeners();
      return updatedLocation;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to update location';
      apiLogger.error('Failed to update location:', error);
      this.setLoading(null, errorMessage);
      throw error;
    }
  }

  /**
   * Delete a location
   */
  async deleteLocation(
    apiClient: ApiClient,
    homeId: string,
    locationId: string
  ): Promise<boolean> {
    this.setLoading('delete');
    try {
      (await apiClient.deleteLocation(homeId, locationId)) as DeleteLocationResponse;

      // Remove from state
      const state = this.getState(homeId);
      state.locations = state.locations.filter((l) => l.id !== locationId);

      this.setLoading(null);
      this.notifyListeners();
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to delete location';
      apiLogger.error('Failed to delete location:', error);
      this.setLoading(null, errorMessage);
      throw error;
    }
  }

  /**
   * Get all locations for a home (from state)
   */
  getAllLocations(homeId: string): Location[] {
    const state = this.getState(homeId);
    return [...state.locations];
  }

  /**
   * Get a specific location by ID
   */
  getLocationById(homeId: string, locationId: string): Location | null {
    const state = this.getState(homeId);
    return state.locations.find((l) => l.id === locationId) || null;
  }

  /**
   * Clear all locations for a home (useful when switching homes)
   */
  clearLocations(homeId: string): void {
    const state = this.getState(homeId);
    state.locations = [];
    this.notifyListeners();
  }
}

export const locationService = new LocationService();
export type { LocationService };
