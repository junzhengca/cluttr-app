import { generateTodoId } from '../utils/idGenerator';
import { ApiClient } from './ApiClient';
import {
  TodoItemDto,
  CreateTodoRequest,
  UpdateTodoRequest,
  DeleteTodoResponse,
  ListTodosResponse,
  CreateTodoResponse,
  UpdateTodoResponse,
} from '../types/api';
import { TodoItem } from '../types/inventory';
import { apiLogger } from '../utils/Logger';

// Simple state for in-memory storage (no file persistence)
interface TodoState {
  todos: TodoItem[];
}

interface TodoLoadingState {
  isLoading: boolean;
  operation: 'list' | 'create' | 'update' | 'delete' | null;
  error: string | null;
}

/**
 * Convert API DTO to domain model
 */
function dtoToTodoItem(dto: TodoItemDto): TodoItem {
  return {
    id: dto.todoId,
    homeId: dto.homeId,
    text: dto.text,
    completed: dto.completed,
    completedAt: dto.completedAt,
    position: dto.position,
    categoryId: dto.categoryId,
    note: dto.note,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    version: 1,
    clientUpdatedAt: dto.updatedAt,
    pendingCreate: false,
    pendingUpdate: false,
    pendingDelete: false,
  };
}

class TodoService {
  // Simple state instead of file storage
  private state: Map<string, TodoState> = new Map(); // homeId -> state
  private listeners: Set<() => void> = new Set();

  // Loading state tracking
  private loadingState: TodoLoadingState = {
    isLoading: false,
    operation: null,
    error: null,
  };

  /**
   * Get state for a specific home
   */
  private getState(homeId: string): TodoState {
    if (!this.state.has(homeId)) {
      this.state.set(homeId, { todos: [] });
    }
    return this.state.get(homeId)!;
  }

  /**
   * Subscribe to todo state changes
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
  getLoadingState(): TodoLoadingState {
    return { ...this.loadingState };
  }

  /**
   * Set loading state
   */
  private setLoading(
    operation: TodoLoadingState['operation'],
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
   * Fetch todos from server for a home
   */
  async fetchTodos(apiClient: ApiClient, homeId: string): Promise<TodoItem[]> {
    this.setLoading('list');
    try {
      const response = (await apiClient.listTodos(homeId)) as ListTodosResponse;
      const todos = response.todoItems.map((dto) => dtoToTodoItem(dto));

      // Update state
      const state = this.getState(homeId);
      state.todos = todos;

      this.setLoading(null);
      this.notifyListeners();
      return todos;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch todos';
      apiLogger.error('Failed to fetch todos:', error);
      this.setLoading(null, errorMessage);
      throw error;
    }
  }

  /**
   * Create a new todo item
   */
  async createTodo(
    apiClient: ApiClient,
    homeId: string,
    input: {
      text: string;
      note?: string;
      categoryId?: string;
    }
  ): Promise<TodoItem | null> {
    this.setLoading('create');
    try {
      const newId = generateTodoId();
      const request: CreateTodoRequest = {
        todoId: newId,
        text: input.text.trim(),
        completed: false,
        position: 0,
        categoryId: input.categoryId,
        note: input.note,
      };

      const response = (await apiClient.createTodo(
        homeId,
        request
      )) as CreateTodoResponse;
      const newTodo = dtoToTodoItem(response.todoItem);

      // Add to state
      const state = this.getState(homeId);
      // Create a new array to avoid issues with frozen arrays
      state.todos = [newTodo, ...state.todos];

      this.setLoading(null);
      this.notifyListeners();
      return newTodo;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create todo';
      apiLogger.error('Failed to create todo:', error);
      this.setLoading(null, errorMessage);
      throw error;
    }
  }

  /**
   * Update a todo item
   */
  async updateTodo(
    apiClient: ApiClient,
    homeId: string,
    todoId: string,
    updates: {
      text?: string;
      completed?: boolean;
      note?: string;
      categoryId?: string;
    }
  ): Promise<TodoItem | null> {
    this.setLoading('update');
    try {
      const request: UpdateTodoRequest = {
        text: updates.text,
        completed: updates.completed,
        categoryId: updates.categoryId,
        note: updates.note,
      };

      const response = (await apiClient.updateTodo(
        homeId,
        todoId,
        request
      )) as UpdateTodoResponse;
      const updatedTodo = dtoToTodoItem(response.todoItem);

      // Update in state
      const state = this.getState(homeId);
      const index = state.todos.findIndex((t) => t.id === todoId);
      if (index >= 0) {
        // Create a new array to avoid issues with frozen arrays
        state.todos = [
          ...state.todos.slice(0, index),
          updatedTodo,
          ...state.todos.slice(index + 1),
        ];
      }

      this.setLoading(null);
      this.notifyListeners();
      return updatedTodo;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to update todo';
      apiLogger.error('Failed to update todo:', error);
      this.setLoading(null, errorMessage);
      throw error;
    }
  }

  /**
   * Toggle todo completion status
   */
  async toggleTodo(
    apiClient: ApiClient,
    homeId: string,
    todoId: string
  ): Promise<TodoItem | null> {
    const state = this.getState(homeId);
    const todo = state.todos.find((t) => t.id === todoId);
    if (!todo) return null;

    return this.updateTodo(apiClient, homeId, todoId, {
      completed: !todo.completed,
    });
  }

  /**
   * Delete a todo item
   */
  async deleteTodo(
    apiClient: ApiClient,
    homeId: string,
    todoId: string
  ): Promise<boolean> {
    this.setLoading('delete');
    try {
      (await apiClient.deleteTodo(homeId, todoId)) as DeleteTodoResponse;

      // Remove from state
      const state = this.getState(homeId);
      state.todos = state.todos.filter((t) => t.id !== todoId);

      this.setLoading(null);
      this.notifyListeners();
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to delete todo';
      apiLogger.error('Failed to delete todo:', error);
      this.setLoading(null, errorMessage);
      throw error;
    }
  }

  /**
   * Get all todos for a home (from state)
   */
  getAllTodos(homeId: string): TodoItem[] {
    const state = this.getState(homeId);
    return [...state.todos];
  }

  /**
   * Get a specific todo by ID
   */
  getTodoById(homeId: string, todoId: string): TodoItem | null {
    const state = this.getState(homeId);
    return state.todos.find((t) => t.id === todoId) || null;
  }

  /**
   * Clear all todos for a home (useful when switching homes)
   */
  clearTodos(homeId: string): void {
    const state = this.getState(homeId);
    state.todos = [];
    this.notifyListeners();
  }
}

export const todoService = new TodoService();
export type { TodoService };
