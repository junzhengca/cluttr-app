import firestore, {
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import { eventChannel, EventChannel } from 'redux-saga';
import type { IoniconsName } from '../../types/icons';
import {
  InventoryItem,
  InventoryCategory,
  Location,
  TodoItem,
  TodoCategory,
} from '../../types/inventory';
import { Home, HomeMemberEntry } from '../../types/home';
import { User } from '../../types/user';
import { getGlobalToast } from '../../utils/toastRegistry';
import { storageLogger } from '../../utils/Logger';

// Strip undefined values before writing — Firestore rejects them.
void firestore().settings({ ignoreUndefinedProperties: true });

export const db = firestore;

type DocSnapshot = FirebaseFirestoreTypes.DocumentSnapshot;

// ─── Collection refs ──────────────────────────────────────────────────────────

export const userRef = (uid: string) =>
  firestore().collection('users').doc(uid);
export const homesCol = () => firestore().collection('homes');
export const homeRef = (homeId: string) => homesCol().doc(homeId);
export const invitationRef = (code: string) =>
  firestore().collection('invitations').doc(code);

export const inventoryCol = (homeId: string) =>
  homeRef(homeId).collection('inventory');
export const inventoryCategoriesCol = (homeId: string) =>
  homeRef(homeId).collection('inventoryCategories');
export const locationsCol = (homeId: string) =>
  homeRef(homeId).collection('locations');
export const todosCol = (homeId: string) => homeRef(homeId).collection('todos');
export const todoCategoriesCol = (homeId: string) =>
  homeRef(homeId).collection('todoCategories');

/**
 * Per-home item counters (`homes/{id}/meta/counters`), maintained in the same
 * batch as every inventory/todo create/delete so security rules can enforce
 * the item soft caps. Purely a rules artifact — the app counts items from its
 * live snapshots and never reads this doc.
 */
export const homeCountersRef = (homeId: string) =>
  homeRef(homeId).collection('meta').doc('counters');

export type CountedCollection = 'inventory' | 'todos';

/** Live query for every home the user belongs to. */
export const homesQueryForUser = (uid: string) =>
  homesCol().where('memberIds', 'array-contains', uid);

// ─── Converters (RNFB has no withConverter) ──────────────────────────────────
// Timestamps are stored as ISO strings, matching the domain model.

const isoNow = () => new Date().toISOString();

function baseFields(doc: DocSnapshot, homeId: string) {
  const data = doc.data() ?? {};
  return {
    id: doc.id,
    homeId,
    createdAt: (data.createdAt as string) || isoNow(),
    updatedAt: (data.updatedAt as string) || isoNow(),
  };
}

export function inventoryItemFromDoc(
  doc: DocSnapshot,
  homeId: string
): InventoryItem {
  const data = doc.data() ?? {};
  return {
    ...baseFields(doc, homeId),
    name: (data.name as string) || '',
    location: (data.location as string) || '',
    detailedLocation: (data.detailedLocation as string) || '',
    status: (data.status as string) || '',
    icon: (data.icon as IoniconsName) || 'cube',
    iconColor: (data.iconColor as string) || '#3B82F6',
    warningThreshold: data.warningThreshold as number | undefined,
    batches: (data.batches as InventoryItem['batches']) || [],
    categoryId: data.categoryId as string | undefined,
  };
}

export function inventoryCategoryFromDoc(
  doc: DocSnapshot,
  homeId: string
): InventoryCategory {
  const data = doc.data() ?? {};
  return {
    ...baseFields(doc, homeId),
    name: (data.name as string) || '',
    description: data.description as string | undefined,
    icon: data.icon as string | undefined,
    color: data.color as string | undefined,
  };
}

export function locationFromDoc(doc: DocSnapshot, homeId: string): Location {
  const data = doc.data() ?? {};
  return {
    ...baseFields(doc, homeId),
    name: (data.name as string) || '',
    icon: data.icon as Location['icon'],
  };
}

export function todoItemFromDoc(doc: DocSnapshot, homeId: string): TodoItem {
  const data = doc.data() ?? {};
  return {
    ...baseFields(doc, homeId),
    text: (data.text as string) || '',
    completed: Boolean(data.completed),
    completedAt: data.completedAt as string | null | undefined,
    position: data.position as number | undefined,
    note: data.note as string | undefined,
    categoryId: data.categoryId as string | undefined,
  };
}

export function todoCategoryFromDoc(
  doc: DocSnapshot,
  homeId: string
): TodoCategory {
  const data = doc.data() ?? {};
  return {
    ...baseFields(doc, homeId),
    name: (data.name as string) || '',
    description: data.description as string | undefined,
    color: data.color as string | undefined,
    icon: data.icon as string | undefined,
    position: data.position as number | undefined,
  };
}

export function homeFromDoc(doc: DocSnapshot, uid: string): Home {
  const data = doc.data() ?? {};
  const members = (data.members as Record<string, HomeMemberEntry>) || {};
  const ownerId = (data.ownerId as string) || '';
  return {
    id: doc.id,
    name: (data.name as string) || '',
    address: data.address as string | undefined,
    ownerId,
    members,
    role: ownerId === uid ? 'owner' : 'member',
    isOwner: ownerId === uid,
    settings: data.settings as Home['settings'],
    invitationCode: data.invitationCode as string | undefined,
    limitOverrides: data.limitOverrides as Home['limitOverrides'],
    memberCount: Object.keys(members).length,
    createdAt: (data.createdAt as string) || isoNow(),
    updatedAt: (data.updatedAt as string) || isoNow(),
  };
}

export function userFromDoc(doc: DocSnapshot): User {
  const data = doc.data() ?? {};
  return {
    id: doc.id,
    email: (data.email as string) || '',
    nickname: data.nickname as string | undefined,
    avatarUrl: data.avatarUrl as string | undefined,
    createdAt: data.createdAt as string | undefined,
    updatedAt: data.updatedAt as string | undefined,
  };
}

// ─── Saga snapshot channel ────────────────────────────────────────────────────

export interface SnapshotEvent {
  snapshot?: FirebaseFirestoreTypes.QuerySnapshot;
  error?: Error & { code?: string };
}

/**
 * Wrap a Firestore query in a redux-saga event channel. The caller is
 * responsible for closing the channel (e.g. in a `finally` block) so the
 * underlying onSnapshot listener is detached.
 */
export function createSnapshotChannel(
  query: FirebaseFirestoreTypes.Query
): EventChannel<SnapshotEvent> {
  return eventChannel<SnapshotEvent>((emit) => {
    const unsubscribe = query.onSnapshot(
      (snapshot) => emit({ snapshot }),
      (error) => emit({ error: error as SnapshotEvent['error'] })
    );
    return unsubscribe;
  });
}

export function isPermissionDenied(error?: { code?: string }): boolean {
  return error?.code === 'firestore/permission-denied';
}

// ─── Write error handling ─────────────────────────────────────────────────────

/**
 * Fire-and-forget write helper. With Firestore offline persistence the local
 * snapshot reflects a write immediately, so callers don't await server acks
 * (awaiting would hang while offline). Errors are logged and surfaced as a
 * toast — the next snapshot already shows the authoritative state.
 */
export function fireWrite(
  promise: Promise<unknown>,
  errorMessage: string
): void {
  promise.catch((error) => {
    storageLogger.error(errorMessage, error);
    const toast = getGlobalToast();
    if (toast) toast(errorMessage, 'error');
  });
}

/**
 * Fire-and-forget batch that pairs a write with the matching ±1 update of the
 * home's item counter (rules require the two in one atomic batch for counted
 * collections). `populate` adds the item write(s) to the batch.
 */
export function fireCountedWrite(
  homeId: string,
  counterField: CountedCollection,
  delta: 1 | -1,
  populate: (batch: FirebaseFirestoreTypes.WriteBatch) => void,
  errorMessage: string
): void {
  const batch = firestore().batch();
  populate(batch);
  batch.set(
    homeCountersRef(homeId),
    { [counterField]: firestore.FieldValue.increment(delta) },
    { merge: true }
  );
  fireWrite(batch.commit(), errorMessage);
}

export { isoNow };
