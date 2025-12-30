import React, { createContext, useContext, useState, useCallback } from 'react';
import { TodoItem } from '../types/inventory';
import {
  getAllTodos,
  createTodo,
  toggleTodo,
  deleteTodo,
} from '../services/TodoService';

interface TodoContextType {
  todos: TodoItem[];
  pendingTodos: TodoItem[];
  completedTodos: TodoItem[];
  loading: boolean;
  refreshTodos: () => Promise<void>;
  addTodo: (text: string) => Promise<void>;
  toggleTodoCompletion: (id: string) => Promise<void>;
  removeTodo: (id: string) => Promise<void>;
}

const TodoContext = createContext<TodoContextType | undefined>(undefined);

export const TodoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshTodos = useCallback(async () => {
    try {
      setLoading(true);
      const allTodos = await getAllTodos();
      // Sort by createdAt in descending order (newest first)
      allTodos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setTodos(allTodos);
    } catch (error) {
      console.error('Error refreshing todos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addTodo = useCallback(async (text: string) => {
    if (!text.trim()) return;

    try {
      const newTodo = await createTodo(text);
      if (newTodo) {
        await refreshTodos();
      }
    } catch (error) {
      console.error('Error adding todo:', error);
    }
  }, [refreshTodos]);

  const toggleTodoCompletion = useCallback(async (id: string) => {
    try {
      await toggleTodo(id);
      await refreshTodos();
    } catch (error) {
      console.error('Error toggling todo:', error);
    }
  }, [refreshTodos]);

  const removeTodo = useCallback(async (id: string) => {
    try {
      await deleteTodo(id);
      await refreshTodos();
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  }, [refreshTodos]);

  const pendingTodos = todos.filter((todo) => !todo.completed);
  const completedTodos = todos.filter((todo) => todo.completed);

  return (
    <TodoContext.Provider
      value={{
        todos,
        pendingTodos,
        completedTodos,
        loading,
        refreshTodos,
        addTodo,
        toggleTodoCompletion,
        removeTodo,
      }}
    >
      {children}
    </TodoContext.Provider>
  );
};

export const useTodos = () => {
  const context = useContext(TodoContext);
  if (!context) {
    throw new Error('useTodos must be used within TodoProvider');
  }
  return context;
};

