import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { fireWrite, isoNow } from './firebase/firestoreRefs';

/**
 * createCrudService
 *
 * Factory for the shared shape of the home-scoped CRUD services
 * (inventory, todos, locations, inventory/todo categories): generate an id
 * and ISO timestamps, fire-and-forget the Firestore write (latency
 * compensation updates the local snapshot immediately, even offline), and
 * return the optimistically constructed entity.
 *
 * Per-domain differences (create-input shape, field trimming/defaults,
 * optimistic entity construction) are captured by `buildCreate`.
 */
export interface CrudServiceConfig<TEntity, TCreateInput> {
  /** Home-scoped collection ref builder from `firestoreRefs.ts`. */
  collection: (
    homeId: string
  ) => FirebaseFirestoreTypes.CollectionReference<FirebaseFirestoreTypes.DocumentData>;
  /** Domain id generator from `utils/idGenerator`. */
  generateId: () => string;
  /** Human-readable label used in fire-and-forget error toasts. */
  entityLabel: string;
  /**
   * Build the Firestore doc payload (without timestamps — the factory adds
   * `createdAt`/`updatedAt`) and the optimistic entity returned to callers.
   */
  buildCreate: (
    input: TCreateInput,
    ctx: { id: string; homeId: string; now: string }
  ) => {
    docData: Record<string, unknown>;
    entity: TEntity;
  };
}

export interface CrudService<TEntity, TCreateInput, TUpdateInput> {
  create(homeId: string, input: TCreateInput): TEntity;
  update(homeId: string, id: string, updates: TUpdateInput): void;
  remove(homeId: string, id: string): void;
}

export function createCrudService<
  TEntity,
  TCreateInput,
  TUpdateInput extends object,
>(
  config: CrudServiceConfig<TEntity, TCreateInput>
): CrudService<TEntity, TCreateInput, TUpdateInput> {
  const { collection, generateId, entityLabel, buildCreate } = config;

  return {
    create(homeId: string, input: TCreateInput): TEntity {
      const id = generateId();
      const now = isoNow();
      const { docData, entity } = buildCreate(input, { id, homeId, now });

      fireWrite(
        collection(homeId)
          .doc(id)
          .set({ ...docData, createdAt: now, updatedAt: now }),
        `Failed to create ${entityLabel}`
      );

      return entity;
    },

    update(homeId: string, id: string, updates: TUpdateInput): void {
      fireWrite(
        collection(homeId)
          .doc(id)
          .update({ ...updates, updatedAt: isoNow() }),
        `Failed to update ${entityLabel}`
      );
    },

    remove(homeId: string, id: string): void {
      fireWrite(
        collection(homeId).doc(id).delete(),
        `Failed to delete ${entityLabel}`
      );
    },
  };
}
