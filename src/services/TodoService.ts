import { TodoItem } from '../types/inventory';
import { readFile, writeFile } from './FileSystemService';
import { generateTodoId } from '../utils/idGenerator';

const TODOS_FILE = 'todos.json';

interface TodosData {
  todos: TodoItem[];
}

/**
 * Get all todos (excluding deleted todos)
 */
export const getAllTodos = async (userId?: string): Promise<TodoItem[]> => {
  const data = await readFile<TodosData>(TODOS_FILE, userId);
  const todos = data?.todos || [];
  return todos.filter((todo) => !todo.deletedAt);
};

/**
 * Get all todos for sync (including deleted todos)
 */
export const getAllTodosForSync = async (userId?: string): Promise<TodoItem[]> => {
  const data = await readFile<TodosData>(TODOS_FILE, userId);
  return data?.todos || [];
};

/**
 * Get a single todo by ID (excluding deleted todos)
 */
export const getTodoById = async (id: string, userId?: string): Promise<TodoItem | null> => {
  const todos = await getAllTodos(userId);
  return todos.find((todo) => todo.id === id && !todo.deletedAt) || null;
};

/**
 * Create a new todo
 */
export const createTodo = async (text: string, note?: string, userId?: string): Promise<TodoItem | null> => {
  try {
    const todos = await getAllTodos(userId);
    const now = new Date().toISOString();
    const newTodo: TodoItem = {
      id: generateTodoId(),
      text: text.trim(),
      completed: false,
      note: note?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };

    todos.push(newTodo);
    const success = await writeFile<TodosData>(TODOS_FILE, { todos }, userId);

    return success ? newTodo : null;
  } catch (error) {
    console.error('Error creating todo:', error);
    return null;
  }
};

/**
 * Update an existing todo
 */
export const updateTodo = async (
  id: string,
  updates: Partial<Omit<TodoItem, 'id' | 'createdAt'>>,
  userId?: string
): Promise<TodoItem | null> => {
  try {
    const todos = await getAllTodos(userId);
    const index = todos.findIndex((todo) => todo.id === id);

    if (index === -1) {
      return null;
    }

    todos[index] = { ...todos[index], ...updates, updatedAt: new Date().toISOString() };
    const success = await writeFile<TodosData>(TODOS_FILE, { todos }, userId);

    return success ? todos[index] : null;
  } catch (error) {
    console.error('Error updating todo:', error);
    return null;
  }
};

/**
 * Delete a todo (soft delete - sets deletedAt timestamp)
 */
export const deleteTodo = async (id: string, userId?: string): Promise<boolean> => {
  try {
    const data = await readFile<TodosData>(TODOS_FILE, userId);
    const todos = data?.todos || [];
    const index = todos.findIndex((todo) => todo.id === id);

    if (index === -1) {
      return false; // Todo not found
    }

    // If already deleted, return true (idempotent)
    if (todos[index].deletedAt) {
      return true;
    }

    // Soft delete: set deletedAt and update updatedAt
    const now = new Date().toISOString();
    todos[index] = {
      ...todos[index],
      deletedAt: now,
      updatedAt: now,
    };

    const success = await writeFile<TodosData>(TODOS_FILE, { todos }, userId);

    return success;
  } catch (error) {
    console.error('Error deleting todo:', error);
    return false;
  }
};

/**
 * Toggle todo completion status
 */
export const toggleTodo = async (id: string, userId?: string): Promise<TodoItem | null> => {
  try {
    const todos = await getAllTodos(userId);
    const index = todos.findIndex((todo) => todo.id === id);

    if (index === -1) {
      return null;
    }

    todos[index].completed = !todos[index].completed;
    todos[index].updatedAt = new Date().toISOString();
    const success = await writeFile<TodosData>(TODOS_FILE, { todos }, userId);

    return success ? todos[index] : null;
  } catch (error) {
    console.error('Error toggling todo:', error);
    return null;
  }
};

