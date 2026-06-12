/**
 * Unit tests for todoSlice
 *
 * Covers reducer behavior (setTodos, addTodo, updateTodo, removeTodo,
 * setLoading, setError, setTodoCategories) and the memoized selectors
 * selectPendingTodos / selectCompletedTodos (including memoization
 * identity checks).
 */

import reducer, {
  setTodos,
  addTodo,
  updateTodo,
  removeTodo,
  setLoading,
  setError,
  setTodoCategories,
  selectPendingTodos,
  selectCompletedTodos,
} from '../todoSlice';
import type { TodoItem, TodoCategory } from '../../../types/inventory';

const makeTodo = (overrides: Partial<TodoItem> = {}): TodoItem => ({
  id: 'todo-1',
  homeId: 'home-1',
  text: 'Buy milk',
  completed: false,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

const makeCategory = (overrides: Partial<TodoCategory> = {}): TodoCategory => ({
  id: 'cat-1',
  homeId: 'home-1',
  name: 'Groceries',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

type TodoState = ReturnType<typeof reducer>;

const getInitialState = (): TodoState => reducer(undefined, { type: '@@INIT' });

const makeRootState = (todo: TodoState) => ({ todo });

describe('todoSlice reducer', () => {
  it('has the expected initial state', () => {
    const state = getInitialState();
    expect(state.todos).toEqual([]);
    expect(state.categories).toEqual([]);
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });

  describe('setTodos', () => {
    it('replaces the todos array', () => {
      const todos = [makeTodo({ id: 'a' }), makeTodo({ id: 'b' })];
      const state = reducer(getInitialState(), setTodos(todos));
      expect(state.todos).toEqual(todos);
    });

    it('replaces existing todos with an empty array', () => {
      const withTodos = reducer(getInitialState(), setTodos([makeTodo()]));
      const state = reducer(withTodos, setTodos([]));
      expect(state.todos).toEqual([]);
    });
  });

  describe('addTodo', () => {
    it('prepends the new todo', () => {
      const existing = makeTodo({ id: 'a' });
      const withTodos = reducer(getInitialState(), setTodos([existing]));

      const added = makeTodo({ id: 'b' });
      const state = reducer(withTodos, addTodo(added));

      expect(state.todos).toHaveLength(2);
      expect(state.todos[0]).toEqual(added); // unshift => first
      expect(state.todos[1]).toEqual(existing);
    });

    it('adds to an empty list', () => {
      const todo = makeTodo();
      const state = reducer(getInitialState(), addTodo(todo));
      expect(state.todos).toEqual([todo]);
    });
  });

  describe('updateTodo', () => {
    it('replaces the todo at the matching index', () => {
      const todos = [
        makeTodo({ id: 'a', text: 'A' }),
        makeTodo({ id: 'b', text: 'B' }),
      ];
      const withTodos = reducer(getInitialState(), setTodos(todos));

      const updated = makeTodo({ id: 'b', text: 'B updated', completed: true });
      const state = reducer(withTodos, updateTodo(updated));

      expect(state.todos).toHaveLength(2);
      expect(state.todos[0].text).toBe('A'); // untouched
      expect(state.todos[1]).toEqual(updated); // index preserved
    });

    it('is a no-op when the id is not found', () => {
      const todos = [makeTodo({ id: 'a' })];
      const withTodos = reducer(getInitialState(), setTodos(todos));

      const state = reducer(withTodos, updateTodo(makeTodo({ id: 'missing' })));

      expect(state.todos).toEqual(todos);
    });
  });

  describe('removeTodo', () => {
    it('removes the todo with the matching id', () => {
      const todos = [makeTodo({ id: 'a' }), makeTodo({ id: 'b' })];
      const withTodos = reducer(getInitialState(), setTodos(todos));

      const state = reducer(withTodos, removeTodo('a'));

      expect(state.todos).toHaveLength(1);
      expect(state.todos[0].id).toBe('b');
    });

    it('is a no-op when the id is not found', () => {
      const todos = [makeTodo({ id: 'a' })];
      const withTodos = reducer(getInitialState(), setTodos(todos));

      const state = reducer(withTodos, removeTodo('missing'));

      expect(state.todos).toEqual(todos);
    });
  });

  describe('setLoading', () => {
    it('toggles the loading flag', () => {
      const loaded = reducer(getInitialState(), setLoading(false));
      expect(loaded.loading).toBe(false);
      const reloading = reducer(loaded, setLoading(true));
      expect(reloading.loading).toBe(true);
    });
  });

  describe('setError', () => {
    it('sets and clears the error', () => {
      const errored = reducer(getInitialState(), setError('boom'));
      expect(errored.error).toBe('boom');
      const cleared = reducer(errored, setError(null));
      expect(cleared.error).toBeNull();
    });
  });

  describe('setTodoCategories', () => {
    it('replaces the categories array', () => {
      const categories = [
        makeCategory({ id: 'c1' }),
        makeCategory({ id: 'c2' }),
      ];
      const state = reducer(getInitialState(), setTodoCategories(categories));
      expect(state.categories).toEqual(categories);
    });

    it('replaces existing categories with an empty array', () => {
      const withCategories = reducer(
        getInitialState(),
        setTodoCategories([makeCategory()])
      );
      const state = reducer(withCategories, setTodoCategories([]));
      expect(state.categories).toEqual([]);
    });
  });
});

describe('todoSlice selectors', () => {
  const pendingOld = makeTodo({
    id: 'p1',
    completed: false,
    createdAt: '2024-01-01T00:00:00.000Z',
  });
  const pendingNew = makeTodo({
    id: 'p2',
    completed: false,
    createdAt: '2024-03-01T00:00:00.000Z',
  });
  const completedOld = makeTodo({
    id: 'c1',
    completed: true,
    createdAt: '2024-02-01T00:00:00.000Z',
  });
  const completedNew = makeTodo({
    id: 'c2',
    completed: true,
    createdAt: '2024-04-01T00:00:00.000Z',
  });

  const buildState = () =>
    makeRootState(
      reducer(
        getInitialState(),
        setTodos([pendingOld, completedNew, pendingNew, completedOld])
      )
    );

  describe('selectPendingTodos', () => {
    it('returns only pending todos sorted by createdAt descending', () => {
      const result = selectPendingTodos(buildState());
      expect(result.map((t) => t.id)).toEqual(['p2', 'p1']);
    });

    it('returns an empty array when all todos are completed', () => {
      const state = makeRootState(
        reducer(getInitialState(), setTodos([completedOld, completedNew]))
      );
      expect(selectPendingTodos(state)).toEqual([]);
    });

    it('handles todos with missing createdAt', () => {
      const noDate = makeTodo({ id: 'nd', completed: false, createdAt: '' });
      const state = makeRootState(
        reducer(getInitialState(), setTodos([noDate, pendingNew]))
      );
      expect(selectPendingTodos(state).map((t) => t.id)).toEqual(['p2', 'nd']);
    });

    it('returns the same array reference for the same input state (memoization)', () => {
      const state = buildState();
      const first = selectPendingTodos(state);
      const second = selectPendingTodos(state);
      expect(second).toBe(first);
    });

    it('keeps the same reference when the todos array reference is unchanged', () => {
      const state = buildState();
      const first = selectPendingTodos(state);
      // New root/slice state objects, but the same todos array reference
      const equivalentState = makeRootState({ ...state.todo });
      const second = selectPendingTodos(equivalentState);
      expect(second).toBe(first);
    });

    it('returns a new array when todos change', () => {
      const state = buildState();
      const first = selectPendingTodos(state);
      const changedState = makeRootState(
        reducer(state.todo, addTodo(makeTodo({ id: 'p3', completed: false })))
      );
      const second = selectPendingTodos(changedState);
      expect(second).not.toBe(first);
      expect(second.map((t) => t.id)).toContain('p3');
    });
  });

  describe('selectCompletedTodos', () => {
    it('returns only completed todos sorted by createdAt descending', () => {
      const result = selectCompletedTodos(buildState());
      expect(result.map((t) => t.id)).toEqual(['c2', 'c1']);
    });

    it('returns an empty array when no todos are completed', () => {
      const state = makeRootState(
        reducer(getInitialState(), setTodos([pendingOld, pendingNew]))
      );
      expect(selectCompletedTodos(state)).toEqual([]);
    });

    it('returns the same array reference for the same input state (memoization)', () => {
      const state = buildState();
      const first = selectCompletedTodos(state);
      const second = selectCompletedTodos(state);
      expect(second).toBe(first);
    });

    it('returns a new array when todos change', () => {
      const state = buildState();
      const first = selectCompletedTodos(state);
      const changedState = makeRootState(reducer(state.todo, removeTodo('c1')));
      const second = selectCompletedTodos(changedState);
      expect(second).not.toBe(first);
      expect(second.map((t) => t.id)).toEqual(['c2']);
    });
  });
});
