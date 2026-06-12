/**
 * Unit tests for inventorySlice
 *
 * Covers reducer behavior (setItems, updateItem, setLoading, setError,
 * updatingItemIds Set semantics) and selectors (selectItemById,
 * selectIsItemUpdating).
 *
 * Note: updatingItemIds is a Set (non-serializable by design); the app
 * enables Immer's MapSet plugin in src/store/index.ts, mirrored here.
 */

import { enableMapSet } from 'immer';
import reducer, {
  setItems,
  updateItem,
  setLoading,
  setError,
  addUpdatingItemId,
  removeUpdatingItemId,
  selectItemById,
  selectIsItemUpdating,
} from '../inventorySlice';
import type { InventoryItem } from '../../../types/inventory';

enableMapSet();

const makeItem = (overrides: Partial<InventoryItem> = {}): InventoryItem => ({
  id: 'item-1',
  homeId: 'home-1',
  name: 'Milk',
  location: 'kitchen',
  detailedLocation: '',
  status: 'using',
  icon: 'home',
  iconColor: '#ffffff',
  batches: [],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

type InventoryState = ReturnType<typeof reducer>;

const getInitialState = (): InventoryState => reducer(undefined, { type: '@@INIT' });

const makeRootState = (inventory: InventoryState) => ({ inventory });

describe('inventorySlice reducer', () => {
  it('has the expected initial state', () => {
    const state = getInitialState();
    expect(state.items).toEqual([]);
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
    expect(state.updatingItemIds).toBeInstanceOf(Set);
    expect(state.updatingItemIds.size).toBe(0);
  });

  describe('setItems', () => {
    it('replaces the items array', () => {
      const items = [makeItem({ id: 'a' }), makeItem({ id: 'b' })];
      const state = reducer(getInitialState(), setItems(items));
      expect(state.items).toEqual(items);
    });

    it('replaces existing items with an empty array', () => {
      const withItems = reducer(getInitialState(), setItems([makeItem()]));
      const state = reducer(withItems, setItems([]));
      expect(state.items).toEqual([]);
    });
  });

  describe('updateItem', () => {
    it('replaces the item at the matching index', () => {
      const items = [makeItem({ id: 'a', name: 'A' }), makeItem({ id: 'b', name: 'B' })];
      const withItems = reducer(getInitialState(), setItems(items));

      const updated = makeItem({ id: 'b', name: 'B updated' });
      const state = reducer(withItems, updateItem(updated));

      expect(state.items).toHaveLength(2);
      expect(state.items[0].name).toBe('A'); // untouched
      expect(state.items[1]).toEqual(updated); // index preserved
    });

    it('is a no-op when the id is not found', () => {
      const items = [makeItem({ id: 'a' })];
      const withItems = reducer(getInitialState(), setItems(items));

      const state = reducer(withItems, updateItem(makeItem({ id: 'missing' })));

      expect(state.items).toEqual(items);
      expect(state.items).toHaveLength(1);
    });

    it('is a no-op on an empty items array', () => {
      const state = reducer(getInitialState(), updateItem(makeItem()));
      expect(state.items).toEqual([]);
    });
  });

  describe('setLoading', () => {
    it('sets loading to false', () => {
      const state = reducer(getInitialState(), setLoading(false));
      expect(state.loading).toBe(false);
    });

    it('sets loading back to true', () => {
      const loaded = reducer(getInitialState(), setLoading(false));
      const state = reducer(loaded, setLoading(true));
      expect(state.loading).toBe(true);
    });
  });

  describe('setError', () => {
    it('sets an error message', () => {
      const state = reducer(getInitialState(), setError('boom'));
      expect(state.error).toBe('boom');
    });

    it('clears the error with null', () => {
      const errored = reducer(getInitialState(), setError('boom'));
      const state = reducer(errored, setError(null));
      expect(state.error).toBeNull();
    });
  });

  describe('updatingItemIds Set semantics', () => {
    it('adds an id to the set', () => {
      const state = reducer(getInitialState(), addUpdatingItemId('a'));
      expect(state.updatingItemIds.has('a')).toBe(true);
      expect(state.updatingItemIds.size).toBe(1);
    });

    it('deduplicates ids (Set semantics)', () => {
      let state = reducer(getInitialState(), addUpdatingItemId('a'));
      state = reducer(state, addUpdatingItemId('a'));
      expect(state.updatingItemIds.size).toBe(1);
    });

    it('tracks multiple ids', () => {
      let state = reducer(getInitialState(), addUpdatingItemId('a'));
      state = reducer(state, addUpdatingItemId('b'));
      expect(state.updatingItemIds.has('a')).toBe(true);
      expect(state.updatingItemIds.has('b')).toBe(true);
      expect(state.updatingItemIds.size).toBe(2);
    });

    it('removes an id from the set', () => {
      let state = reducer(getInitialState(), addUpdatingItemId('a'));
      state = reducer(state, addUpdatingItemId('b'));
      state = reducer(state, removeUpdatingItemId('a'));
      expect(state.updatingItemIds.has('a')).toBe(false);
      expect(state.updatingItemIds.has('b')).toBe(true);
    });

    it('removing a missing id is a no-op', () => {
      const state = reducer(getInitialState(), removeUpdatingItemId('missing'));
      expect(state.updatingItemIds.size).toBe(0);
    });

    it('does not mutate the previous state Set', () => {
      const before = getInitialState();
      reducer(before, addUpdatingItemId('a'));
      expect(before.updatingItemIds.size).toBe(0);
    });
  });
});

describe('inventorySlice selectors', () => {
  describe('selectItemById', () => {
    it('returns the matching item', () => {
      const item = makeItem({ id: 'a' });
      const state = makeRootState(reducer(getInitialState(), setItems([item, makeItem({ id: 'b' })])));
      expect(selectItemById(state, 'a')).toEqual(item);
    });

    it('returns null when no item matches', () => {
      const state = makeRootState(reducer(getInitialState(), setItems([makeItem({ id: 'a' })])));
      expect(selectItemById(state, 'missing')).toBeNull();
    });

    it('returns null for an empty inventory', () => {
      const state = makeRootState(getInitialState());
      expect(selectItemById(state, 'a')).toBeNull();
    });
  });

  describe('selectIsItemUpdating', () => {
    it('returns true when the id is in updatingItemIds', () => {
      const inventory = reducer(getInitialState(), addUpdatingItemId('a'));
      const state = makeRootState(inventory);
      expect(selectIsItemUpdating(state, 'a')(state)).toBe(true);
    });

    it('returns false when the id is not in updatingItemIds', () => {
      const state = makeRootState(getInitialState());
      expect(selectIsItemUpdating(state, 'a')(state)).toBe(false);
    });

    it('reflects removal of the id', () => {
      let inventory = reducer(getInitialState(), addUpdatingItemId('a'));
      inventory = reducer(inventory, removeUpdatingItemId('a'));
      const state = makeRootState(inventory);
      expect(selectIsItemUpdating(state, 'a')(state)).toBe(false);
    });
  });
});
