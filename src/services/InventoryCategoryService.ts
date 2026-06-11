import { generateCategoryId } from '../utils/idGenerator';
import { InventoryCategory } from '../types/inventory';
import { inventoryCategoriesCol, fireWrite, isoNow } from './firebase/firestoreRefs';

/**
 * InventoryCategoryService
 *
 * Slim Firestore write helpers for `homes/{homeId}/inventoryCategories`.
 * Reads are live snapshots managed by inventoryCategorySaga.
 */
class InventoryCategoryService {
    createCategory(
        homeId: string,
        input: { name: string; description?: string; color?: string; icon?: string },
    ): InventoryCategory {
        const id = generateCategoryId();
        const now = isoNow();

        fireWrite(
            inventoryCategoriesCol(homeId).doc(id).set({
                name: input.name.trim(),
                description: input.description,
                color: input.color,
                icon: input.icon,
                createdAt: now,
                updatedAt: now,
            }),
            'Failed to create category',
        );

        return {
            id,
            homeId,
            name: input.name.trim(),
            description: input.description,
            color: input.color,
            icon: input.icon,
            createdAt: now,
            updatedAt: now,
        };
    }

    updateCategory(
        homeId: string,
        categoryId: string,
        updates: { name?: string; description?: string; color?: string; icon?: string },
    ): void {
        fireWrite(
            inventoryCategoriesCol(homeId).doc(categoryId).update({
                ...updates,
                updatedAt: isoNow(),
            }),
            'Failed to update category',
        );
    }

    deleteCategory(homeId: string, categoryId: string): void {
        fireWrite(
            inventoryCategoriesCol(homeId).doc(categoryId).delete(),
            'Failed to delete category',
        );
    }
}

export const inventoryCategoryService = new InventoryCategoryService();
export type { InventoryCategoryService };
