import { call, put, select, takeLatest, takeEvery } from 'redux-saga/effects';
import type { RootState } from '../types';
import {
  setTodos,
  updateTodo as updateTodoSlice,
  setLoading,
  setAddingTodo,
  addUpdatingTodoId,
  removeUpdatingTodoId,
  setError,
  setTodoCategories,
} from '../slices/todoSlice';
import { setActiveHomeId } from '../slices/authSlice';
import { createSubscriptionSaga } from './firestoreSubscriptionSaga';
import { requireActiveHomeId } from './helpers/requireActiveHomeId';
import { handleSagaError } from './helpers/handleSagaError';
import { todoService } from '../../services/TodoService';
import { todoCategoryService } from '../../services/TodoCategoryService';
import {
  todosCol,
  todoCategoriesCol,
  todoItemFromDoc,
  todoCategoryFromDoc,
  isoNow,
} from '../../services/firebase/firestoreRefs';
import type { TodoItem, TodoCategory } from '../../types/inventory';
import { homeService } from '../../services/HomeService';
import { purchasesService } from '../../services/PurchasesService';
import { effectiveTodoCap } from '../../data/planLimits';
import { sagaLogger } from '../../utils/Logger';
import { getGlobalToast } from '../../utils/toastRegistry';
import i18n from '../../i18n/i18n';

// Action types
const LOAD_TODOS = 'todo/LOAD_TODOS';
const ADD_TODO = 'todo/ADD_TODO';
const TOGGLE_TODO = 'todo/TOGGLE_TODO';
const DELETE_TODO = 'todo/DELETE_TODO';
const UPDATE_TODO = 'todo/UPDATE_TODO';
const LOAD_TODO_CATEGORIES = 'todo/LOAD_TODO_CATEGORIES';
const SILENT_REFRESH_TODO_CATEGORIES = 'todo/SILENT_REFRESH_TODO_CATEGORIES';
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

/** Live todos listener for the active home. */
const subscribeTodosSaga = createSubscriptionSaga<TodoItem>({
  name: 'Todos',
  buildQuery: todosCol,
  fromDoc: todoItemFromDoc,
  sort: (a, b) => a.createdAt.localeCompare(b.createdAt),
  setItems: setTodos,
  setLoading,
  setError,
});

/** Live todo-categories listener for the active home. */
const subscribeTodoCategoriesSaga = createSubscriptionSaga<TodoCategory>({
  name: 'Todo categories',
  buildQuery: todoCategoriesCol,
  fromDoc: todoCategoryFromDoc,
  sort: (a, b) => a.createdAt.localeCompare(b.createdAt),
  setItems: setTodoCategories,
});

function* addTodoSaga(action: {
  type: string;
  payload: { text: string; note?: string; categoryId?: string };
}): Generator<unknown, void, unknown> {
  const { text, note, categoryId } = action.payload;
  if (!text.trim()) return;

  sagaLogger.verbose(`addTodoSaga - Creating todo: "${text}"`);

  try {
    const homeId = (yield call(requireActiveHomeId, 'todo')) as string;
    yield put(setAddingTodo(true));
    yield put(setError(null));

    // Backstop for the UI plan-limit gate (security rules enforce the Pro
    // soft cap server-side; this keeps the optimistic write from appearing
    // and then vanishing on the rules denial).
    const todoCount = (yield select(
      (state: RootState) => state.todo.todos.length
    )) as number;
    const cap = effectiveTodoCap(
      purchasesService.isProActive(),
      homeService.getCurrentHome()
    );
    if (todoCount >= cap) {
      sagaLogger.warn(`Todo cap reached (${todoCount}/${cap})`);
      const toast = getGlobalToast();
      if (toast) {
        toast(
          i18n.t('limits.todoCapReached', {
            max: cap,
            defaultValue: 'To-do limit reached ({{max}})',
          }),
          'error'
        );
      }
      return;
    }

    const newTodo = todoService.createTodo(homeId, { text, note, categoryId });
    sagaLogger.verbose(
      `Todo created: id=${newTodo.id}, text="${newTodo.text}"`
    );
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
    const homeId = (yield call(requireActiveHomeId, 'todo')) as string;
    yield put(setError(null));

    const state = (yield select()) as RootState;
    const todoToUpdate = state.todo.todos.find((todo) => todo.id === id);
    if (!todoToUpdate) return;

    const completed = !todoToUpdate.completed;

    // Optimistic local update; the snapshot confirms it
    yield put(updateTodoSlice({ ...todoToUpdate, completed }));

    todoService.updateTodo(homeId, id, {
      completed,
      completedAt: completed ? isoNow() : null,
    });
  } catch (error) {
    yield call(handleSagaError, error, {
      logMessage: 'Error toggling todo',
      setError,
      fallbackKey: 'todo.toggleError',
      fallbackText: 'Failed to toggle todo',
    });
  }
}

function* deleteTodoSaga(action: {
  type: string;
  payload: string;
}): Generator<unknown, void, unknown> {
  try {
    const homeId = (yield call(requireActiveHomeId, 'todo')) as string;
    yield put(setError(null));
    todoService.deleteTodo(homeId, action.payload);
  } catch (error) {
    yield call(handleSagaError, error, {
      logMessage: 'Error deleting todo',
      setError,
      fallbackKey: 'todo.deleteError',
      fallbackText: 'Failed to delete todo',
    });
  }
}

/**
 * On each UPDATE_TODO: apply optimistic update, then write to Firestore.
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

  try {
    const homeId = (yield call(requireActiveHomeId, 'todo')) as string;
    todoService.updateTodo(homeId, id, {
      text: optimisticTodo.text,
      note: optimisticTodo.note ?? '',
    });
  } catch (error) {
    yield call(handleSagaError, error, {
      logMessage: 'Error updating todo',
      setError,
      fallbackKey: 'todo.updateError',
      fallbackText: 'Failed to save todo',
    });
  } finally {
    yield put(removeUpdatingTodoId(id));
  }
}

function* addTodoCategorySaga(action: {
  type: string;
  payload: { name: string };
}): Generator<unknown, void, unknown> {
  const { name } = action.payload;
  if (!name.trim()) return;

  try {
    const homeId = (yield call(requireActiveHomeId, 'todo')) as string;
    yield put(setError(null));
    todoCategoryService.createCategory(homeId, { name });
  } catch (error) {
    sagaLogger.error('Error adding todo category', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to add category';
    yield put(setError(errorMessage));
  }
}

function* updateTodoCategorySaga(action: {
  type: string;
  payload: { id: string; name: string };
}): Generator<unknown, void, unknown> {
  const { id, name } = action.payload;

  try {
    const homeId = (yield call(requireActiveHomeId, 'todo')) as string;
    yield put(setError(null));
    todoCategoryService.updateCategory(homeId, id, { name });
  } catch (error) {
    sagaLogger.error('Error updating todo category', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to update category';
    yield put(setError(errorMessage));
  }
}

function* deleteTodoCategorySaga(action: {
  type: string;
  payload: string;
}): Generator<unknown, void, unknown> {
  try {
    const homeId = (yield call(requireActiveHomeId, 'todo')) as string;
    yield put(setError(null));
    todoCategoryService.deleteCategory(homeId, action.payload);
  } catch (error) {
    sagaLogger.error('Error deleting todo category', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to delete category';
    yield put(setError(errorMessage));
  }
}

/** Silent refreshes are no-ops: the live listener is already current. */
function* silentRefreshTodoCategoriesSaga(): Generator<unknown, void, unknown> {
  yield call(
    [sagaLogger, 'verbose'],
    'Silent todo category refresh skipped (live listener active)'
  );
}

// Watcher
export function* todoSaga(): Generator<unknown, void, unknown> {
  yield takeLatest([setActiveHomeId.type, LOAD_TODOS], subscribeTodosSaga);
  yield takeLatest(
    [setActiveHomeId.type, LOAD_TODO_CATEGORIES],
    subscribeTodoCategoriesSaga
  );
  yield takeLatest(ADD_TODO, addTodoSaga);
  yield takeEvery(TOGGLE_TODO, toggleTodoSaga);
  yield takeEvery(DELETE_TODO, deleteTodoSaga);
  yield takeEvery(UPDATE_TODO, updateTodoSaga);

  // Todo categories
  yield takeLatest(
    SILENT_REFRESH_TODO_CATEGORIES,
    silentRefreshTodoCategoriesSaga
  );
  yield takeLatest(ADD_TODO_CATEGORY, addTodoCategorySaga);
  yield takeLatest(UPDATE_TODO_CATEGORY, updateTodoCategorySaga);
  yield takeLatest(DELETE_TODO_CATEGORY, deleteTodoCategorySaga);
}
