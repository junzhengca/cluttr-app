import { generateCategoryId } from '../utils/idGenerator';
import { InventoryCategory } from '../types/inventory';
import { inventoryCategoriesCol } from './firebase/firestoreRefs';
import { createCrudService } from './createCrudService';

type CreateCategoryInput = { name: string; description?: string; color?: string; icon?: string };
type UpdateCategoryInput = { name?: string; description?: string; color?: string; icon?: string };

const crud = createCrudService<InventoryCategory, CreateCategoryInput, UpdateCategoryInput>({
    collection: inventoryCategoriesCol,
    generateId: generateCategoryId,
    entityLabel: 'category',
    buildCreate: (input, { id, homeId, now }) => {
        const fields = {
            name: input.name.trim(),
            description: input.description,
            color: input.color,
            icon: input.icon,
        };
        return {
            docData: fields,
            entity: { ...fields, id, homeId, createdAt: now, updatedAt: now },
        };
    },
});

/**
 * InventoryCategoryService
 *
 * Slim Firestore write helpers for `homes/{homeId}/inventoryCategories`.
 * Reads are live snapshots managed by inventoryCategorySaga.
 */
class InventoryCategoryService {
    createCategory(homeId: string, input: CreateCategoryInput): InventoryCategory {
        return crud.create(homeId, input);
    }

    updateCategory(homeId: string, categoryId: string, updates: UpdateCategoryInput): void {
        crud.update(homeId, categoryId, updates);
    }

    deleteCategory(homeId: string, categoryId: string): void {
        crud.remove(homeId, categoryId);
    }
}

export const inventoryCategoryService = new InventoryCategoryService();
export type { InventoryCategoryService };
