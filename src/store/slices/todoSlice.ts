import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { TodoItem, TodoCategory } from '../../types/inventory';

interface TodoState {
  todos: TodoItem[];
  categories: TodoCategory[];
  loading: boolean;
}

const initialState: TodoState = {
  todos: [],
  categories: [],
  loading: true,
};

const todoSlice = createSlice({
  name: 'todo',
  initialState,
  reducers: {
    setTodos: (state, action: PayloadAction<TodoItem[]>) => {
      state.todos = action.payload;
    },
    silentSetTodos: (state, action: PayloadAction<TodoItem[]>) => {
      // Silent update - only updates todos, does not touch loading state
      state.todos = action.payload;
    },
    addTodo: (state, action: PayloadAction<TodoItem>) => {
      state.todos.unshift(action.payload);
    },
    updateTodo: (state, action: PayloadAction<TodoItem>) => {
      const index = state.todos.findIndex((todo) => todo.id === action.payload.id);
      if (index !== -1) {
        state.todos[index] = action.payload;
      }
    },
    removeTodo: (state, action: PayloadAction<string>) => {
      state.todos = state.todos.filter((todo) => todo.id !== action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    upsertTodos: (state, action: PayloadAction<TodoItem[]>) => {
      const todosToUpsert = action.payload;
      if (todosToUpsert.length === 0) return;

      const todoMap = new Map(state.todos.map(todo => [todo.id, todo]));
      todosToUpsert.forEach(todo => {
        todoMap.set(todo.id, todo);
      });
      state.todos = Array.from(todoMap.values());
    },
    removeTodos: (state, action: PayloadAction<string[]>) => {
      const idsToRemove = new Set(action.payload);
      if (idsToRemove.size === 0) return;
      state.todos = state.todos.filter(todo => !idsToRemove.has(todo.id));
    },
    setTodoCategories: (state, action: PayloadAction<TodoCategory[]>) => {
      state.categories = action.payload;
    },
    silentSetTodoCategories: (state, action: PayloadAction<TodoCategory[]>) => {
      // Silent update - only updates categories, does not touch loading state
      state.categories = action.payload;
    },
    addTodoCategory: (state, action: PayloadAction<TodoCategory>) => {
      state.categories.push(action.payload);
    },
    updateTodoCategory: (state, action: PayloadAction<TodoCategory>) => {
      const index = state.categories.findIndex((cat) => cat.id === action.payload.id);
      if (index !== -1) {
        state.categories[index] = action.payload;
      }
    },
    removeTodoCategory: (state, action: PayloadAction<string>) => {
      state.categories = state.categories.filter((cat) => cat.id !== action.payload);
    },
  },
});

export const { setTodos, silentSetTodos, addTodo, updateTodo, removeTodo, setLoading, upsertTodos, removeTodos, setTodoCategories, silentSetTodoCategories, addTodoCategory, updateTodoCategory, removeTodoCategory } =
  todoSlice.actions;

// Selectors
const selectTodos = (state: { todo: TodoState }) => state.todo.todos;

export const selectPendingTodos = createSelector(
  [selectTodos],
  (todos) =>
    [...todos]
      .filter((todo) => !todo.completed)
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
);

export const selectCompletedTodos = createSelector(
  [selectTodos],
  (todos) =>
    [...todos]
      .filter((todo) => todo.completed)
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
);

export default todoSlice.reducer;

