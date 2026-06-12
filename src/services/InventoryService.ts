import { generateItemId } from '../utils/idGenerator';
import { InventoryItem } from '../types/inventory';
import { inventoryCol, inventoryItemFromDoc } from './firebase/firestoreRefs';
import { createCrudService } from './createCrudService';

type CreateInventoryInput = Omit<InventoryItem, 'id' | 'homeId' | 'createdAt' | 'updatedAt'>;
type UpdateInventoryInput = Partial<CreateInventoryInput>;

const crud = createCrudService<InventoryItem, CreateInventoryInput, UpdateInventoryInput>({
    collection: inventoryCol,
    generateId: generateItemId,
    entityLabel: 'inventory item',
    buildCreate: (input, { id, homeId, now }) => ({
        docData: {
            name: input.name,
            location: input.location,
            detailedLocation: input.detailedLocation,
            status: input.status,
            icon: input.icon,
            iconColor: input.iconColor,
            warningThreshold: input.warningThreshold,
            categoryId: input.categoryId,
            batches: input.batches ?? [],
        },
        entity: { ...input, id, homeId, createdAt: now, updatedAt: now },
    }),
});

/**
 * InventoryService
 *
 * Slim Firestore write helpers for `homes/{homeId}/inventory`. Reads are
 * live snapshots managed by inventorySaga; writes are fire-and-forget so the
 * latency-compensated local snapshot updates the UI immediately (even
 * offline) and the server reconciles in the background.
 */
class InventoryService {
    /**
     * Create a new inventory item. Returns the locally constructed item.
     */
    createInventoryItem(homeId: string, input: CreateInventoryInput): InventoryItem {
        return crud.create(homeId, input);
    }

    updateInventoryItem(homeId: string, itemId: string, updates: UpdateInventoryInput): void {
        crud.update(homeId, itemId, updates);
    }

    deleteInventoryItem(homeId: string, itemId: string): void {
        crud.remove(homeId, itemId);
    }

    /**
     * Direct doc read (cache-first fallback for screens that deep-link to an
     * item before the snapshot has it).
     */
    async getItemById(homeId: string, itemId: string): Promise<InventoryItem | null> {
        const snapshot = await inventoryCol(homeId).doc(itemId).get();
        return snapshot.exists() ? inventoryItemFromDoc(snapshot, homeId) : null;
    }
}

export const inventoryService = new InventoryService();
export type { InventoryService };
