import { TodoItem } from '../types/inventory';
import { readFile, writeFile } from './FileSystemService';

const TODOS_FILE = 'todos.json';

interface TodosData {
  todos: TodoItem[];
}

/**
 * Get all todos
 */
export const getAllTodos = async (): Promise<TodoItem[]> => {
  const data = await readFile<TodosData>(TODOS_FILE);
  return data?.todos || [];
};

/**
 * Get a single todo by ID
 */
export const getTodoById = async (id: string): Promise<TodoItem | null> => {
  const todos = await getAllTodos();
  return todos.find((todo) => todo.id === id) || null;
};

/**
 * Create a new todo
 */
export const createTodo = async (text: string): Promise<TodoItem | null> => {
  try {
    const todos = await getAllTodos();
    const newTodo: TodoItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      text: text.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    };

    todos.push(newTodo);
    const success = await writeFile<TodosData>(TODOS_FILE, { todos });

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
  updates: Partial<Omit<TodoItem, 'id' | 'createdAt'>>
): Promise<TodoItem | null> => {
  try {
    const todos = await getAllTodos();
    const index = todos.findIndex((todo) => todo.id === id);

    if (index === -1) {
      return null;
    }

    todos[index] = { ...todos[index], ...updates };
    const success = await writeFile<TodosData>(TODOS_FILE, { todos });

    return success ? todos[index] : null;
  } catch (error) {
    console.error('Error updating todo:', error);
    return null;
  }
};

/**
 * Delete a todo
 */
export const deleteTodo = async (id: string): Promise<boolean> => {
  try {
    const todos = await getAllTodos();
    const filteredTodos = todos.filter((todo) => todo.id !== id);

    if (filteredTodos.length === todos.length) {
      return false; // Todo not found
    }

    return await writeFile<TodosData>(TODOS_FILE, { todos: filteredTodos });
  } catch (error) {
    console.error('Error deleting todo:', error);
    return false;
  }
};

/**
 * Toggle todo completion status
 */
export const toggleTodo = async (id: string): Promise<TodoItem | null> => {
  try {
    const todos = await getAllTodos();
    const index = todos.findIndex((todo) => todo.id === id);

    if (index === -1) {
      return null;
    }

    todos[index].completed = !todos[index].completed;
    const success = await writeFile<TodosData>(TODOS_FILE, { todos });

    return success ? todos[index] : null;
  } catch (error) {
    console.error('Error toggling todo:', error);
    return null;
  }
};

