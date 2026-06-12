import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { TodoItem, TodoCategory } from '../../types/inventory';

interface TodoState {
  todos: TodoItem[];
  categories: TodoCategory[];
  loading: boolean;
  addingTodo: boolean;
  updatingTodoIds: string[];
  error: string | null;
}

const initialState: TodoState = {
  todos: [],
  categories: [],
  loading: true,
  addingTodo: false,
  updatingTodoIds: [],
  error: null,
};

const todoSlice = createSlice({
  name: 'todo',
  initialState,
  reducers: {
    setTodos: (state, action: PayloadAction<TodoItem[]>) => {
      state.todos = action.payload;
    },
    addTodo: (state, action: PayloadAction<TodoItem>) => {
      state.todos.unshift(action.payload);
    },
    updateTodo: (state, action: PayloadAction<TodoItem>) => {
      const index = state.todos.findIndex(
        (todo) => todo.id === action.payload.id
      );
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
    setAddingTodo: (state, action: PayloadAction<boolean>) => {
      state.addingTodo = action.payload;
    },
    addUpdatingTodoId: (state, action: PayloadAction<string>) => {
      if (!state.updatingTodoIds.includes(action.payload)) {
        state.updatingTodoIds.push(action.payload);
      }
    },
    removeUpdatingTodoId: (state, action: PayloadAction<string>) => {
      state.updatingTodoIds = state.updatingTodoIds.filter(
        (id) => id !== action.payload
      );
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setTodoCategories: (state, action: PayloadAction<TodoCategory[]>) => {
      state.categories = action.payload;
    },
  },
});

export const {
  setTodos,
  addTodo,
  updateTodo,
  removeTodo,
  setLoading,
  setAddingTodo,
  addUpdatingTodoId,
  removeUpdatingTodoId,
  setError,
  setTodoCategories,
} = todoSlice.actions;

// Selectors
const selectTodos = (state: { todo: TodoState }) => state.todo.todos;
const selectLoading = (state: { todo: TodoState }) => state.todo.loading;
const selectAddingTodo = (state: { todo: TodoState }) => state.todo.addingTodo;
const selectUpdatingTodoIds = (state: { todo: TodoState }) =>
  state.todo.updatingTodoIds;
const selectError = (state: { todo: TodoState }) => state.todo.error;

export {
  selectTodos,
  selectLoading,
  selectAddingTodo,
  selectUpdatingTodoIds,
  selectError,
};

export const selectPendingTodos = createSelector([selectTodos], (todos) =>
  [...todos]
    .filter((todo) => !todo.completed)
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
);

export const selectCompletedTodos = createSelector([selectTodos], (todos) =>
  [...todos]
    .filter((todo) => todo.completed)
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
);

export default todoSlice.reducer;
