import { generateItemId } from '../utils/idGenerator';
import { InventoryItem } from '../types/inventory';
import {
    inventoryCol,
    inventoryItemFromDoc,
    fireWrite,
    isoNow,
} from './firebase/firestoreRefs';

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
    createInventoryItem(
        homeId: string,
        input: Omit<InventoryItem, 'id' | 'homeId' | 'createdAt' | 'updatedAt'>,
    ): InventoryItem {
        const id = generateItemId();
        const now = isoNow();

        fireWrite(
            inventoryCol(homeId).doc(id).set({
                name: input.name,
                location: input.location,
                detailedLocation: input.detailedLocation,
                status: input.status,
                icon: input.icon,
                iconColor: input.iconColor,
                warningThreshold: input.warningThreshold,
                categoryId: input.categoryId,
                batches: input.batches ?? [],
                createdAt: now,
                updatedAt: now,
            }),
            'Failed to create inventory item',
        );

        return { ...input, id, homeId, createdAt: now, updatedAt: now };
    }

    updateInventoryItem(
        homeId: string,
        itemId: string,
        updates: Partial<Omit<InventoryItem, 'id' | 'homeId' | 'createdAt' | 'updatedAt'>>,
    ): void {
        fireWrite(
            inventoryCol(homeId).doc(itemId).update({ ...updates, updatedAt: isoNow() }),
            'Failed to update inventory item',
        );
    }

    deleteInventoryItem(homeId: string, itemId: string): void {
        fireWrite(
            inventoryCol(homeId).doc(itemId).delete(),
            'Failed to delete inventory item',
        );
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
