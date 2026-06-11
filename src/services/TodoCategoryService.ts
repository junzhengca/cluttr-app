import { generateCategoryId } from '../utils/idGenerator';
import { TodoCategory } from '../types/inventory';
import { todoCategoriesCol, fireWrite, isoNow } from './firebase/firestoreRefs';

/**
 * TodoCategoryService
 *
 * Slim Firestore write helpers for `homes/{homeId}/todoCategories`. Reads
 * are live snapshots managed by todoSaga.
 */
class TodoCategoryService {
    createCategory(
        homeId: string,
        input: { name: string; description?: string; color?: string; icon?: string },
    ): TodoCategory {
        const id = generateCategoryId();
        const now = isoNow();

        fireWrite(
            todoCategoriesCol(homeId).doc(id).set({
                name: input.name.trim(),
                description: input.description,
                color: input.color,
                icon: input.icon,
                createdAt: now,
                updatedAt: now,
            }),
            'Failed to create todo category',
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
            todoCategoriesCol(homeId).doc(categoryId).update({ ...updates, updatedAt: isoNow() }),
            'Failed to update todo category',
        );
    }

    deleteCategory(homeId: string, categoryId: string): void {
        fireWrite(
            todoCategoriesCol(homeId).doc(categoryId).delete(),
            'Failed to delete todo category',
        );
    }
}

export const todoCategoryService = new TodoCategoryService();
export type { TodoCategoryService };
