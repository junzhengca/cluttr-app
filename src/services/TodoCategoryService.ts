import { generateItemId } from '../utils/idGenerator';
import { ApiClient } from './ApiClient';
import {
  TodoCategoryDto,
  CreateTodoCategoryRequest,
  UpdateTodoCategoryRequest,
  DeleteTodoCategoryResponse,
  ListTodoCategoriesResponse,
  CreateTodoCategoryResponse,
  UpdateTodoCategoryResponse,
} from '../types/api';
import { TodoCategory } from '../types/inventory';
import { apiLogger } from '../utils/Logger';

// Simple state for in-memory storage (no file persistence)
interface CategoryState {
  categories: TodoCategory[];
}

interface CategoryLoadingState {
  isLoading: boolean;
  operation: 'list' | 'create' | 'update' | 'delete' | null;
  error: string | null;
}

/**
 * Convert API DTO to domain model
 */
function dtoToTodoCategory(dto: TodoCategoryDto): TodoCategory {
  return {
    id: dto.categoryId,
    homeId: dto.homeId,
    name: dto.name,
    description: dto.description,
    color: dto.color,
    icon: dto.icon,
    position: dto.position,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    version: 1,
    clientUpdatedAt: dto.updatedAt,
    pendingCreate: false,
    pendingUpdate: false,
    pendingDelete: false,
  };
}

class TodoCategoryService {
  // Simple state instead of file storage
  private state: Map<string, CategoryState> = new Map(); // homeId -> state
  private listeners: Set<() => void> = new Set();

  // Loading state tracking
  private loadingState: CategoryLoadingState = {
    isLoading: false,
    operation: null,
    error: null,
  };

  /**
   * Get state for a specific home
   */
  private getState(homeId: string): CategoryState {
    if (!this.state.has(homeId)) {
      this.state.set(homeId, { categories: [] });
    }
    return this.state.get(homeId)!;
  }

  /**
   * Subscribe to category state changes
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
    this.listeners.forEach(cb => cb());
  }

  /**
   * Get current loading state
   */
  getLoadingState(): CategoryLoadingState {
    return { ...this.loadingState };
  }

  /**
   * Set loading state
   */
  private setLoading(operation: CategoryLoadingState['operation'], error: string | null = null): void {
    this.loadingState = {
      isLoading: operation !== null,
      operation,
      error,
    };
    this.notifyListeners();
  }

  /**
   * Fetch categories from server for a home
   */
  async fetchCategories(apiClient: ApiClient, homeId: string): Promise<TodoCategory[]> {
    this.setLoading('list');
    try {
      const response = await apiClient.listTodoCategories(homeId) as ListTodoCategoriesResponse;
      const categories = response.todoCategories.map(dto => dtoToTodoCategory(dto));

      // Update state
      const state = this.getState(homeId);
      state.categories = categories;

      this.setLoading(null);
      this.notifyListeners();
      return categories;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch categories';
      apiLogger.error('Failed to fetch categories:', error);
      this.setLoading(null, errorMessage);
      throw error;
    }
  }

  /**
   * Create a new category
   */
  async createCategory(apiClient: ApiClient, homeId: string, input: {
    name: string;
  }): Promise<TodoCategory | null> {
    this.setLoading('create');
    try {
      const newId = generateItemId();
      const request: CreateTodoCategoryRequest = {
        categoryId: newId,
        name: input.name.trim(),
      };

      const response = await apiClient.createTodoCategory(homeId, request) as CreateTodoCategoryResponse;
      const newCategory = dtoToTodoCategory(response.todoCategory);

      // Add to state
      const state = this.getState(homeId);
      state.categories.push(newCategory);

      this.setLoading(null);
      this.notifyListeners();
      return newCategory;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create category';
      apiLogger.error('Failed to create category:', error);
      this.setLoading(null, errorMessage);
      throw error;
    }
  }

  /**
   * Update a category
   */
  async updateCategory(apiClient: ApiClient, homeId: string, categoryId: string, updates: {
    name?: string;
  }): Promise<TodoCategory | null> {
    this.setLoading('update');
    try {
      const request: UpdateTodoCategoryRequest = {
        name: updates.name,
      };

      const response = await apiClient.updateTodoCategory(homeId, categoryId, request) as UpdateTodoCategoryResponse;
      const updatedCategory = dtoToTodoCategory(response.todoCategory);

      // Update in state
      const state = this.getState(homeId);
      const index = state.categories.findIndex(c => c.id === categoryId);
      if (index >= 0) {
        state.categories[index] = updatedCategory;
      }

      this.setLoading(null);
      this.notifyListeners();
      return updatedCategory;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update category';
      apiLogger.error('Failed to update category:', error);
      this.setLoading(null, errorMessage);
      throw error;
    }
  }

  /**
   * Delete a category
   */
  async deleteCategory(apiClient: ApiClient, homeId: string, categoryId: string): Promise<boolean> {
    this.setLoading('delete');
    try {
      await apiClient.deleteTodoCategory(homeId, categoryId) as DeleteTodoCategoryResponse;

      // Remove from state
      const state = this.getState(homeId);
      state.categories = state.categories.filter(c => c.id !== categoryId);

      this.setLoading(null);
      this.notifyListeners();
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete category';
      apiLogger.error('Failed to delete category:', error);
      this.setLoading(null, errorMessage);
      throw error;
    }
  }

  /**
   * Get all categories for a home (from state)
   */
  getAllCategories(homeId: string): TodoCategory[] {
    const state = this.getState(homeId);
    return [...state.categories];
  }

  /**
   * Get a specific category by ID
   */
  getCategoryById(homeId: string, categoryId: string): TodoCategory | null {
    const state = this.getState(homeId);
    return state.categories.find(c => c.id === categoryId) || null;
  }

  /**
   * Clear all categories for a home (useful when switching homes)
   */
  clearCategories(homeId: string): void {
    const state = this.getState(homeId);
    state.categories = [];
    this.notifyListeners();
  }
}

export const todoCategoryService = new TodoCategoryService();
export type { TodoCategoryService };
