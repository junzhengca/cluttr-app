import { call, put, select, takeLatest, takeEvery } from 'redux-saga/effects';
import type { RootState } from '../types';
import {
  setTodos,
  addTodo as addTodoSlice,
  updateTodo as updateTodoSlice,
  removeTodo as removeTodoSlice,
  setLoading,
  setAddingTodo,
  addUpdatingTodoId,
  removeUpdatingTodoId,
  setError,
  setTodoCategories,
  addTodoCategory as addTodoCategorySlice,
  updateTodoCategory as updateTodoCategorySlice,
  removeTodoCategory as removeTodoCategorySlice,
} from '../slices/todoSlice';
import { todoService } from '../../services/TodoService';
import { todoCategoryService } from '../../services/TodoCategoryService';
import type { ApiClient } from '../../services/ApiClient';
import type { TodoItem, TodoCategory } from '../../types/inventory';
import { sagaLogger } from '../../utils/Logger';
import { getGlobalToast } from '../../components/organisms/ToastProvider';
import i18n from '../../i18n/i18n';

// Action types
const LOAD_TODOS = 'todo/LOAD_TODOS';
const ADD_TODO = 'todo/ADD_TODO';
const TOGGLE_TODO = 'todo/TOGGLE_TODO';
const DELETE_TODO = 'todo/DELETE_TODO';
const UPDATE_TODO = 'todo/UPDATE_TODO';
const LOAD_TODO_CATEGORIES = 'todo/LOAD_TODO_CATEGORIES';
const ADD_TODO_CATEGORY = 'todo/ADD_TODO_CATEGORY';
const UPDATE_TODO_CATEGORY = 'todo/UPDATE_TODO_CATEGORY';
const DELETE_TODO_CATEGORY = 'todo/DELETE_TODO_CATEGORY';

// Action creators
export const loadTodos = () => ({ type: LOAD_TODOS });
export const addTodo = (text: string, note?: string, categoryId?: string) => ({
  type: ADD_TODO,
  payload: { text, note, categoryId },
});
export const toggleTodo = (id: string) => ({ type: TOGGLE_TODO, payload: id });
export const deleteTodoAction = (id: string) => ({
  type: DELETE_TODO,
  payload: id,
});
export const updateTodoText = (id: string, text: string, note?: string) => ({
  type: UPDATE_TODO,
  payload: { id, text, note },
});
export const loadTodoCategoriesAction = () => ({ type: LOAD_TODO_CATEGORIES });
export const addTodoCategoryAction = (name: string) => ({
  type: ADD_TODO_CATEGORY,
  payload: { name },
});
export const updateTodoCategoryAction = (id: string, name: string) => ({
  type: UPDATE_TODO_CATEGORY,
  payload: { id, name },
});
export const deleteTodoCategoryAction = (id: string) => ({
  type: DELETE_TODO_CATEGORY,
  payload: id,
});

/**
 * Get API client from Redux state
 */
function* getApiClient(): Generator<unknown, ApiClient, unknown> {
  const state = (yield select()) as RootState;
  const apiClient = state.auth.apiClient;
  if (!apiClient) {
    sagaLogger.error('No API client available');
    throw new Error('No API client available');
  }
  return apiClient;
}

/**
 * Get active home ID from Redux state
 */
function* getActiveHomeId(): Generator<unknown, string, unknown> {
  const state = (yield select()) as RootState;
  const activeHomeId = state.auth.activeHomeId;
  if (!activeHomeId) {
    sagaLogger.error('No active home - cannot perform todo operation');
    throw new Error('No active home selected');
  }
  return activeHomeId;
}

function* loadTodosSaga(): Generator<unknown, void, unknown> {
  try {
    const apiClient = (yield call(getApiClient)) as ApiClient;
    const homeId = (yield call(getActiveHomeId)) as string;

    yield put(setLoading(true));
    yield put(setError(null));

    const todos = (yield call(
      [todoService, 'fetchTodos'],
      apiClient,
      homeId
    )) as TodoItem[];
    yield put(setTodos(todos));
  } catch (error) {
    sagaLogger.error('Error loading todos', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to load todos';
    yield put(setError(errorMessage));
  } finally {
    yield put(setLoading(false));
  }
}

function* addTodoSaga(action: {
  type: string;
  payload: { text: string; note?: string; categoryId?: string };
}): Generator<unknown, void, unknown> {
  const { text, note, categoryId } = action.payload;
  if (!text.trim()) return;

  sagaLogger.verbose(`addTodoSaga - Creating todo: "${text}"`);

  try {
    const apiClient = (yield call(getApiClient)) as ApiClient;
    const homeId = (yield call(getActiveHomeId)) as string;

    yield put(setAddingTodo(true));
    yield put(setError(null));

    const newTodo = (yield call(
      [todoService, 'createTodo'],
      apiClient,
      homeId,
      { text, note, categoryId }
    )) as TodoItem | null;

    if (newTodo) {
      sagaLogger.verbose(
        `Todo created: id=${newTodo.id}, text="${newTodo.text}"`
      );
      yield put(addTodoSlice(newTodo));
    } else {
      sagaLogger.error('Failed to create todo: newTodo is null/undefined');
      yield put(setError('Failed to create todo'));
    }
  } catch (error) {
    sagaLogger.error('Error adding todo', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to add todo';
    yield put(setError(errorMessage));
  } finally {
    yield put(setAddingTodo(false));
  }
}

function* toggleTodoSaga(action: {
  type: string;
  payload: string;
}): Generator<unknown, void, unknown> {
  const id = action.payload;

  try {
    const apiClient = (yield call(getApiClient)) as ApiClient;
    const homeId = (yield call(getActiveHomeId)) as string;

    yield put(setError(null));

    // Optimistically update UI first
    const state = (yield select()) as RootState;
    const currentTodos = state.todo.todos;
    const todoToUpdate = currentTodos.find((todo) => todo.id === id);
    if (todoToUpdate) {
      const optimisticTodo = {
        ...todoToUpdate,
        completed: !todoToUpdate.completed,
      };
      yield put(updateTodoSlice(optimisticTodo));
    }

    // Then call API
    const updatedTodo = (yield call(
      [todoService, 'toggleTodo'],
      apiClient,
      homeId,
      id
    )) as TodoItem | null;

    if (updatedTodo) {
      yield put(updateTodoSlice(updatedTodo));
    }
  } catch (error) {
    sagaLogger.error('Error toggling todo', error);
    const errorMessage =
      error instanceof Error ? error.message : i18n.t('todo.toggleError', 'Failed to toggle todo');
    yield put(setError(errorMessage));
    // Revert optimistic update on error
    const state = (yield select()) as RootState;
    const currentTodos = state.todo.todos;
    const todoToUpdate = currentTodos.find((todo) => todo.id === id);
    if (todoToUpdate) {
      const revertedTodo = {
        ...todoToUpdate,
        completed: !todoToUpdate.completed,
      };
      yield put(updateTodoSlice(revertedTodo));
    }
    const toast = getGlobalToast();
    if (toast) toast(errorMessage, 'error');
  }
}

function* deleteTodoSaga(action: {
  type: string;
  payload: string;
}): Generator<unknown, void, unknown> {
  const id = action.payload;

  try {
    const apiClient = (yield call(getApiClient)) as ApiClient;
    const homeId = (yield call(getActiveHomeId)) as string;

    yield put(setError(null));

    // Optimistically remove from UI first
    yield put(removeTodoSlice(id));

    // Then call API
    const success = (yield call(
      [todoService, 'deleteTodo'],
      apiClient,
      homeId,
      id
    )) as boolean;

    if (!success) {
      // Revert on failure
      sagaLogger.error('Failed to delete todo');
      const errorMessage = i18n.t('todo.deleteError', 'Failed to delete todo');
      yield put(setError(errorMessage));
      const toast = getGlobalToast();
      if (toast) toast(errorMessage, 'error');
      // Reload todos to get correct state
      yield call(loadTodosSaga);
    }
  } catch (error) {
    sagaLogger.error('Error deleting todo', error);
    const errorMessage =
      error instanceof Error ? error.message : i18n.t('todo.deleteError', 'Failed to delete todo');
    yield put(setError(errorMessage));
    const toast = getGlobalToast();
    if (toast) toast(errorMessage, 'error');
    // Reload todos to revert optimistic update
    yield call(loadTodosSaga);
  }
}

/**
 * On each UPDATE_TODO: apply optimistic update, then immediately call API.
 */
function* updateTodoSaga(action: {
  type: string;
  payload: { id: string; text: string; note?: string };
}): Generator<unknown, void, unknown> {
  const { id, text, note } = action.payload;

  const state = (yield select()) as RootState;
  const previousTodo = state.todo.todos.find((t) => t.id === id);
  if (!previousTodo) {
    sagaLogger.error('updateTodoSaga: todo not found', id);
    const errorMessage = i18n.t('todo.updateError', 'Failed to save todo');
    yield put(setError(errorMessage));
    const toast = getGlobalToast();
    if (toast) toast(errorMessage, 'error');
    return;
  }

  const optimisticTodo: TodoItem = {
    ...previousTodo,
    text: text.trim(),
    note: note !== undefined ? note : previousTodo.note,
  };
  yield put(updateTodoSlice(optimisticTodo));
  yield put(addUpdatingTodoId(id));

  const payloadSent = {
    text: optimisticTodo.text.trim(),
    note: optimisticTodo.note ?? previousTodo.note ?? '',
  };

  try {
    const apiClient = (yield call(getApiClient)) as ApiClient;
    const homeId = (yield call(getActiveHomeId)) as string;

    const updatedTodo = (yield call(
      [todoService, 'updateTodo'],
      apiClient,
      homeId,
      id,
      { text: payloadSent.text, note: payloadSent.note }
    )) as TodoItem | null;

    if (updatedTodo) {
      const stateAfter = (yield select()) as RootState;
      const now = stateAfter.todo.todos.find((t) => t.id === id);
      const stillCurrent =
        now &&
        now.text.trim() === payloadSent.text &&
        (now.note ?? '') === (payloadSent.note ?? '');
      if (stillCurrent) {
        yield put(updateTodoSlice(updatedTodo));
      }
    }
  } catch (error) {
    sagaLogger.error('Error updating todo', error);
    const errorMessage =
      error instanceof Error ? error.message : i18n.t('todo.updateError', 'Failed to save todo');
    const stateAfter = (yield select()) as RootState;
    const now = stateAfter.todo.todos.find((t) => t.id === id);
    const stillCurrent =
      now &&
      now.text.trim() === payloadSent.text &&
      (now.note ?? '') === (payloadSent.note ?? '');
    if (stillCurrent) {
      yield put(updateTodoSlice(previousTodo));
      yield put(setError(errorMessage));
      const toast = getGlobalToast();
      if (toast) toast(errorMessage, 'error');
    }
  } finally {
    yield put(removeUpdatingTodoId(id));
  }
}

function* loadTodoCategoriesSaga(): Generator<unknown, void, unknown> {
  try {
    const apiClient = (yield call(getApiClient)) as ApiClient;
    const homeId = (yield call(getActiveHomeId)) as string;

    yield put(setLoading(true));
    yield put(setError(null));

    const categories = (yield call(
      [todoCategoryService, 'fetchCategories'],
      apiClient,
      homeId
    )) as TodoCategory[];

    yield put(setTodoCategories(categories));
  } catch (error) {
    sagaLogger.error('Error loading todo categories', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to load categories';
    yield put(setError(errorMessage));
  } finally {
    yield put(setLoading(false));
  }
}

function* addTodoCategorySaga(action: {
  type: string;
  payload: { name: string };
}): Generator<unknown, void, unknown> {
  const { name } = action.payload;
  if (!name.trim()) return;

  try {
    const apiClient = (yield call(getApiClient)) as ApiClient;
    const homeId = (yield call(getActiveHomeId)) as string;

    yield put(setLoading(true));
    yield put(setError(null));

    const newCategory = (yield call(
      [todoCategoryService, 'createCategory'],
      apiClient,
      homeId,
      { name }
    )) as TodoCategory | null;

    if (newCategory) {
      yield put(addTodoCategorySlice(newCategory));
    }
  } catch (error) {
    sagaLogger.error('Error adding todo category', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to add category';
    yield put(setError(errorMessage));
  } finally {
    yield put(setLoading(false));
  }
}

function* updateTodoCategorySaga(action: {
  type: string;
  payload: { id: string; name: string };
}): Generator<unknown, void, unknown> {
  const { id, name } = action.payload;

  try {
    const apiClient = (yield call(getApiClient)) as ApiClient;
    const homeId = (yield call(getActiveHomeId)) as string;

    yield put(setLoading(true));
    yield put(setError(null));

    const updatedCategory = (yield call(
      [todoCategoryService, 'updateCategory'],
      apiClient,
      homeId,
      id,
      { name }
    )) as TodoCategory | null;

    if (updatedCategory) {
      yield put(updateTodoCategorySlice(updatedCategory));
    }
  } catch (error) {
    sagaLogger.error('Error updating todo category', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to update category';
    yield put(setError(errorMessage));
  } finally {
    yield put(setLoading(false));
  }
}

function* deleteTodoCategorySaga(action: {
  type: string;
  payload: string;
}): Generator<unknown, void, unknown> {
  const id = action.payload;

  try {
    const apiClient = (yield call(getApiClient)) as ApiClient;
    const homeId = (yield call(getActiveHomeId)) as string;

    yield put(setLoading(true));
    yield put(setError(null));

    // Optimistically remove from UI first
    yield put(removeTodoCategorySlice(id));

    // Then call API
    const success = (yield call(
      [todoCategoryService, 'deleteCategory'],
      apiClient,
      homeId,
      id
    )) as boolean;

    if (!success) {
      // Revert on failure
      sagaLogger.error('Failed to delete todo category');
      yield put(setError('Failed to delete category'));
      // Reload categories to get correct state
      yield call(loadTodoCategoriesSaga);
    }
  } catch (error) {
    sagaLogger.error('Error deleting todo category', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to delete category';
    yield put(setError(errorMessage));
    // Reload categories to revert optimistic update
    yield call(loadTodoCategoriesSaga);
  } finally {
    yield put(setLoading(false));
  }
}

// Watcher
export function* todoSaga(): Generator<unknown, void, unknown> {
  yield takeLatest(LOAD_TODOS, loadTodosSaga);
  yield takeLatest(ADD_TODO, addTodoSaga);
  yield takeEvery(TOGGLE_TODO, toggleTodoSaga);
  yield takeEvery(DELETE_TODO, deleteTodoSaga);
  yield takeEvery(UPDATE_TODO, updateTodoSaga);

  // Todo categories
  yield takeLatest(LOAD_TODO_CATEGORIES, loadTodoCategoriesSaga);
  yield takeLatest(ADD_TODO_CATEGORY, addTodoCategorySaga);
  yield takeLatest(UPDATE_TODO_CATEGORY, updateTodoCategorySaga);
  yield takeLatest(DELETE_TODO_CATEGORY, deleteTodoCategorySaga);
}
