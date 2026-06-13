/**
 * Unit tests for createCrudService
 *
 * Covers:
 * - create: synchronous optimistic entity with generated id + ISO timestamps
 * - create: fire-and-forget write (fireWrite receives the doc promise, never awaited)
 * - update/remove: payload shapes and error messages
 * - buildCreate hook: receives input + ctx, its output is respected
 */

import { createCrudService, CrudServiceConfig } from '../createCrudService';
import { fireWrite, fireCountedWrite, isoNow } from '../firebase/firestoreRefs';

jest.mock('../firebase/firestoreRefs', () => ({
  fireWrite: jest.fn(),
  fireCountedWrite: jest.fn(),
  isoNow: jest.fn(),
}));

interface TestEntity {
  id: string;
  homeId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface TestCreateInput {
  name: string;
}

interface TestUpdateInput {
  name?: string;
  quantity?: number;
}

const FIXED_NOW = '2026-06-11T12:00:00.000Z';
const ISO_8601 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

const mockedFireWrite = fireWrite as unknown as jest.Mock;
const mockedFireCountedWrite = fireCountedWrite as unknown as jest.Mock;
const mockedIsoNow = isoNow as unknown as jest.Mock;

/**
 * Build a fresh Firestore collection/doc mock chain. The write promises never
 * resolve, so any code path that awaited them would hang — synchronous returns
 * from the service prove the writes are fire-and-forget.
 */
const makeFirestoreMocks = () => {
  const setPromise = new Promise<void>(() => {});
  const updatePromise = new Promise<void>(() => {});
  const deletePromise = new Promise<void>(() => {});
  const docRef = {
    set: jest.fn().mockReturnValue(setPromise),
    update: jest.fn().mockReturnValue(updatePromise),
    delete: jest.fn().mockReturnValue(deletePromise),
  };
  const collectionRef = { doc: jest.fn().mockReturnValue(docRef) };
  const collection = jest.fn().mockReturnValue(collectionRef);
  return {
    collection,
    collectionRef,
    docRef,
    setPromise,
    updatePromise,
    deletePromise,
  };
};

type Mocks = ReturnType<typeof makeFirestoreMocks>;

const makeService = (mocks: Mocks) => {
  const generateId = jest.fn().mockReturnValue('generated-id-1');
  const buildCreate = jest.fn(
    (
      input: TestCreateInput,
      ctx: { id: string; homeId: string; now: string }
    ) => ({
      docData: { name: input.name.trim() },
      entity: {
        id: ctx.id,
        homeId: ctx.homeId,
        name: input.name.trim(),
        createdAt: ctx.now,
        updatedAt: ctx.now,
      },
    })
  );
  const config: CrudServiceConfig<TestEntity, TestCreateInput> = {
    collection: mocks.collection as unknown as CrudServiceConfig<
      TestEntity,
      TestCreateInput
    >['collection'],
    generateId,
    entityLabel: 'widget',
    buildCreate,
  };
  const service = createCrudService<
    TestEntity,
    TestCreateInput,
    TestUpdateInput
  >(config);
  return { service, generateId, buildCreate };
};

describe('createCrudService', () => {
  beforeEach(() => {
    mockedIsoNow.mockReturnValue(FIXED_NOW);
  });

  describe('create', () => {
    it('returns the optimistic entity synchronously with generated id and ISO timestamps', () => {
      const mocks = makeFirestoreMocks();
      const { service } = makeService(mocks);

      const result = service.create('home-1', { name: '  Milk  ' });

      // Synchronous, plain entity — not a Promise.
      expect(result).not.toBeInstanceOf(Promise);
      expect(result).toEqual({
        id: 'generated-id-1',
        homeId: 'home-1',
        name: 'Milk',
        createdAt: FIXED_NOW,
        updatedAt: FIXED_NOW,
      });
      expect(result.createdAt).toMatch(ISO_8601);
      expect(result.updatedAt).toMatch(ISO_8601);
    });

    it('writes the doc payload (buildCreate docData + timestamps) via fireWrite, never awaiting it', () => {
      const mocks = makeFirestoreMocks();
      const { service } = makeService(mocks);

      // setPromise never resolves; create returning synchronously proves the
      // write is fire-and-forget.
      const result = service.create('home-1', { name: '  Milk  ' });
      expect(result.id).toBe('generated-id-1');

      expect(mocks.collection).toHaveBeenCalledWith('home-1');
      expect(mocks.collectionRef.doc).toHaveBeenCalledWith('generated-id-1');
      expect(mocks.docRef.set).toHaveBeenCalledTimes(1);
      expect(mocks.docRef.set).toHaveBeenCalledWith({
        name: 'Milk',
        createdAt: FIXED_NOW,
        updatedAt: FIXED_NOW,
      });
      expect(mockedFireWrite).toHaveBeenCalledTimes(1);
      expect(mockedFireWrite).toHaveBeenCalledWith(
        mocks.setPromise,
        'Failed to create widget'
      );
    });

    it('passes input and ctx to buildCreate and respects its output', () => {
      const mocks = makeFirestoreMocks();
      const { service } = makeService(mocks);
      const customEntity: TestEntity = {
        id: 'custom-id',
        homeId: 'custom-home',
        name: 'Custom',
        createdAt: 'custom-created',
        updatedAt: 'custom-updated',
      };
      const buildCreate = jest.fn(() => ({
        docData: { name: 'From hook', extra: 42 },
        entity: customEntity,
      }));
      const service2 = createCrudService<
        TestEntity,
        TestCreateInput,
        TestUpdateInput
      >({
        collection: mocks.collection as unknown as CrudServiceConfig<
          TestEntity,
          TestCreateInput
        >['collection'],
        generateId: () => 'generated-id-2',
        entityLabel: 'widget',
        buildCreate,
      });

      const input = { name: 'ignored by hook' };
      const result = service2.create('home-9', input);

      expect(buildCreate).toHaveBeenCalledTimes(1);
      expect(buildCreate).toHaveBeenCalledWith(input, {
        id: 'generated-id-2',
        homeId: 'home-9',
        now: FIXED_NOW,
      });
      // The hook's entity is returned verbatim (same reference).
      expect(result).toBe(customEntity);
      // The hook's docData is what gets written (plus timestamps).
      expect(mocks.docRef.set).toHaveBeenCalledWith({
        name: 'From hook',
        extra: 42,
        createdAt: FIXED_NOW,
        updatedAt: FIXED_NOW,
      });
      // `service` from makeService is unused here on purpose.
      expect(service).toBeDefined();
    });
  });

  describe('update', () => {
    it('fires an update with the updates spread plus a fresh updatedAt', () => {
      const mocks = makeFirestoreMocks();
      const { service } = makeService(mocks);

      service.update('home-1', 'item-7', { name: 'Bread', quantity: 3 });

      expect(mocks.collection).toHaveBeenCalledWith('home-1');
      expect(mocks.collectionRef.doc).toHaveBeenCalledWith('item-7');
      expect(mocks.docRef.update).toHaveBeenCalledTimes(1);
      expect(mocks.docRef.update).toHaveBeenCalledWith({
        name: 'Bread',
        quantity: 3,
        updatedAt: FIXED_NOW,
      });
      expect(mockedFireWrite).toHaveBeenCalledWith(
        mocks.updatePromise,
        'Failed to update widget'
      );
      expect(mocks.docRef.set).not.toHaveBeenCalled();
      expect(mocks.docRef.delete).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('fires a delete on the doc ref', () => {
      const mocks = makeFirestoreMocks();
      const { service } = makeService(mocks);

      service.remove('home-1', 'item-7');

      expect(mocks.collection).toHaveBeenCalledWith('home-1');
      expect(mocks.collectionRef.doc).toHaveBeenCalledWith('item-7');
      expect(mocks.docRef.delete).toHaveBeenCalledTimes(1);
      expect(mockedFireWrite).toHaveBeenCalledWith(
        mocks.deletePromise,
        'Failed to delete widget'
      );
      expect(mocks.docRef.set).not.toHaveBeenCalled();
      expect(mocks.docRef.update).not.toHaveBeenCalled();
    });
  });

  describe('counterField (counted collections)', () => {
    const makeCountedService = (mocks: Mocks) =>
      createCrudService<TestEntity, TestCreateInput, TestUpdateInput>({
        collection: mocks.collection as unknown as CrudServiceConfig<
          TestEntity,
          TestCreateInput
        >['collection'],
        generateId: () => 'generated-id-1',
        entityLabel: 'widget',
        counterField: 'inventory',
        buildCreate: (input, ctx) => ({
          docData: { name: input.name },
          entity: {
            id: ctx.id,
            homeId: ctx.homeId,
            name: input.name,
            createdAt: ctx.now,
            updatedAt: ctx.now,
          },
        }),
      });

    it('routes create through fireCountedWrite with a +1 delta and batches the doc set', () => {
      const mocks = makeFirestoreMocks();
      const service = makeCountedService(mocks);

      const result = service.create('home-1', { name: 'Milk' });

      expect(result.id).toBe('generated-id-1');
      expect(mockedFireWrite).not.toHaveBeenCalled();
      expect(mockedFireCountedWrite).toHaveBeenCalledTimes(1);
      const [homeId, field, delta, populate, errorMessage] =
        mockedFireCountedWrite.mock.calls[0];
      expect(homeId).toBe('home-1');
      expect(field).toBe('inventory');
      expect(delta).toBe(1);
      expect(errorMessage).toBe('Failed to create widget');

      // The populate callback adds the doc write to the supplied batch.
      const batch = { set: jest.fn(), delete: jest.fn() };
      populate(batch);
      expect(batch.set).toHaveBeenCalledWith(mocks.docRef, {
        name: 'Milk',
        createdAt: FIXED_NOW,
        updatedAt: FIXED_NOW,
      });
    });

    it('routes remove through fireCountedWrite with a -1 delta and batches the doc delete', () => {
      const mocks = makeFirestoreMocks();
      const service = makeCountedService(mocks);

      service.remove('home-1', 'item-7');

      expect(mockedFireWrite).not.toHaveBeenCalled();
      expect(mockedFireCountedWrite).toHaveBeenCalledTimes(1);
      const [homeId, field, delta, populate, errorMessage] =
        mockedFireCountedWrite.mock.calls[0];
      expect(homeId).toBe('home-1');
      expect(field).toBe('inventory');
      expect(delta).toBe(-1);
      expect(errorMessage).toBe('Failed to delete widget');

      const batch = { set: jest.fn(), delete: jest.fn() };
      populate(batch);
      expect(mocks.collectionRef.doc).toHaveBeenCalledWith('item-7');
      expect(batch.delete).toHaveBeenCalledWith(mocks.docRef);
    });

    it('keeps update as a plain (uncounted) fireWrite', () => {
      const mocks = makeFirestoreMocks();
      const service = makeCountedService(mocks);

      service.update('home-1', 'item-7', { name: 'Bread' });

      expect(mockedFireCountedWrite).not.toHaveBeenCalled();
      expect(mockedFireWrite).toHaveBeenCalledWith(
        mocks.updatePromise,
        'Failed to update widget'
      );
    });
  });
});
