import { generateItemId } from '../utils/idGenerator';
import { ApiClient } from './ApiClient';
import {
  InventoryItemDto,
  CreateInventoryItemRequest,
  UpdateInventoryItemRequest,
  DeleteInventoryItemResponse,
  ListInventoryItemsResponse,
  CreateInventoryItemResponse,
  UpdateInventoryItemResponse,
} from '../types/api';
import { InventoryItem } from '../types/inventory';
import { apiLogger } from '../utils/Logger';
import Ionicons from '@expo/vector-icons/Ionicons';

// Simple state for in-memory storage (no file persistence)
interface InventoryState {
  items: InventoryItem[];
}

interface InventoryLoadingState {
  isLoading: boolean;
  operation: 'list' | 'create' | 'update' | 'delete' | null;
  error: string | null;
}

/**
 * Convert API DTO to domain model
 */
function dtoToInventoryItem(dto: InventoryItemDto): InventoryItem {
  return {
    id: dto.inventoryId,
    homeId: dto.homeId,
    name: dto.name,
    location: dto.locationId || '',
    detailedLocation: dto.detailedLocation || '',
    status: dto.status,
    icon: (dto.icon as keyof typeof Ionicons.glyphMap) || 'cube',
    iconColor: dto.iconColor || '#3B82F6',
    warningThreshold: dto.warningThreshold,
    batches: dto.batches || [],
    categoryId: dto.categoryId,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

class InventoryService {
  // Simple state instead of file storage
  private state: Map<string, InventoryState> = new Map(); // homeId -> state
  private listeners: Set<() => void> = new Set();

  // Loading state tracking
  private loadingState: InventoryLoadingState = {
    isLoading: false,
    operation: null,
    error: null,
  };

  /**
   * Get state for a specific home
   */
  private getState(homeId: string): InventoryState {
    if (!this.state.has(homeId)) {
      this.state.set(homeId, { items: [] });
    }
    return this.state.get(homeId)!;
  }

  /**
   * Subscribe to inventory state changes
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
  getLoadingState(): InventoryLoadingState {
    return { ...this.loadingState };
  }

  /**
   * Set loading state
   */
  private setLoading(
    operation: InventoryLoadingState['operation'],
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
   * Fetch inventory items from server for a home
   */
  async fetchInventoryItems(apiClient: ApiClient, homeId: string): Promise<InventoryItem[]> {
    this.setLoading('list');
    try {
      const response = (await apiClient.listInventoryItems(homeId)) as ListInventoryItemsResponse;
      const items = response.inventoryItems.map((dto) => dtoToInventoryItem(dto));

      // Update state
      const state = this.getState(homeId);
      state.items = items;

      this.setLoading(null);
      this.notifyListeners();
      return items;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch inventory items';
      apiLogger.error('Failed to fetch inventory items:', error);
      this.setLoading(null, errorMessage);
      throw error;
    }
  }

  /**
   * Create a new inventory item
   */
  async createInventoryItem(
    apiClient: ApiClient,
    homeId: string,
    input: Omit<InventoryItem, 'id' | 'homeId' | 'createdAt' | 'updatedAt'>
  ): Promise<InventoryItem | null> {
    this.setLoading('create');
    try {
      const newId = generateItemId();
      const request: CreateInventoryItemRequest = {
        inventoryId: newId,
        name: input.name,
        locationId: input.location,
        detailedLocation: input.detailedLocation,
        status: input.status,
        icon: input.icon,
        iconColor: input.iconColor,
        warningThreshold: input.warningThreshold,
        categoryId: input.categoryId,
        batches: input.batches,
      };

      const response = (await apiClient.createInventoryItem(
        homeId,
        request
      )) as CreateInventoryItemResponse;
      const newItem = dtoToInventoryItem(response.inventoryItem);

      // Add to state
      const state = this.getState(homeId);
      state.items = [newItem, ...state.items];

      this.setLoading(null);
      this.notifyListeners();
      return newItem;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create inventory item';
      apiLogger.error('Failed to create inventory item:', error);
      this.setLoading(null, errorMessage);
      throw error;
    }
  }

  /**
   * Update an inventory item
   */
  async updateInventoryItem(
    apiClient: ApiClient,
    homeId: string,
    inventoryId: string,
    updates: Partial<Omit<InventoryItem, 'id' | 'homeId' | 'createdAt' | 'updatedAt'>>
  ): Promise<InventoryItem | null> {
    this.setLoading('update');
    try {
      const request: UpdateInventoryItemRequest = {
        name: updates.name,
        locationId: updates.location,
        detailedLocation: updates.detailedLocation,
        status: updates.status,
        icon: updates.icon,
        iconColor: updates.iconColor,
        warningThreshold: updates.warningThreshold,
        categoryId: updates.categoryId,
        batches: updates.batches,
      };

      const response = (await apiClient.updateInventoryItem(
        homeId,
        inventoryId,
        request
      )) as UpdateInventoryItemResponse;
      const updatedItem = dtoToInventoryItem(response.inventoryItem);

      // Update in state
      const state = this.getState(homeId);
      const index = state.items.findIndex((i) => i.id === inventoryId);
      if (index >= 0) {
        state.items = [
          ...state.items.slice(0, index),
          updatedItem,
          ...state.items.slice(index + 1),
        ];
      }

      this.setLoading(null);
      this.notifyListeners();
      return updatedItem;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to update inventory item';
      apiLogger.error('Failed to update inventory item:', error);
      this.setLoading(null, errorMessage);
      throw error;
    }
  }

  /**
   * Delete an inventory item
   */
  async deleteInventoryItem(
    apiClient: ApiClient,
    homeId: string,
    inventoryId: string
  ): Promise<boolean> {
    this.setLoading('delete');
    try {
      (await apiClient.deleteInventoryItem(homeId, inventoryId)) as DeleteInventoryItemResponse;

      // Remove from state
      const state = this.getState(homeId);
      state.items = state.items.filter((i) => i.id !== inventoryId);

      this.setLoading(null);
      this.notifyListeners();
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to delete inventory item';
      apiLogger.error('Failed to delete inventory item:', error);
      this.setLoading(null, errorMessage);
      throw error;
    }
  }

  /**
   * Search and filter items (local search on state)
   */
  searchItems(
    homeId: string,
    query?: string,
    _filters?: {
      expiringSoon?: boolean;
    }
  ): InventoryItem[] {
    let items = this.getAllItems(homeId);

    if (query?.trim()) {
      const lowerQuery = query.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(lowerQuery) ||
          item.location.toLowerCase().includes(lowerQuery) ||
          item.detailedLocation.toLowerCase().includes(lowerQuery)
      );
    }

    return items;
  }

  /**
   * Get all inventory items for a home (from state)
   */
  getAllItems(homeId: string): InventoryItem[] {
    const state = this.getState(homeId);
    return [...state.items];
  }

  /**
   * Get a specific inventory item by ID
   */
  getItemById(homeId: string, itemId: string): InventoryItem | null {
    const state = this.getState(homeId);
    return state.items.find((i) => i.id === itemId) || null;
  }

  /**
   * Clear all inventory items for a home (useful when switching homes)
   */
  clearInventoryItems(homeId: string): void {
    const state = this.getState(homeId);
    state.items = [];
    this.notifyListeners();
  }
}

export const inventoryService = new InventoryService();
export type { InventoryService };
