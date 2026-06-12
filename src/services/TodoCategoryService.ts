import { generateCategoryId } from '../utils/idGenerator';
import { TodoCategory } from '../types/inventory';
import { todoCategoriesCol } from './firebase/firestoreRefs';
import { createCrudService } from './createCrudService';

type CreateTodoCategoryInput = { name: string; description?: string; color?: string; icon?: string };
type UpdateTodoCategoryInput = { name?: string; description?: string; color?: string; icon?: string };

const crud = createCrudService<TodoCategory, CreateTodoCategoryInput, UpdateTodoCategoryInput>({
    collection: todoCategoriesCol,
    generateId: generateCategoryId,
    entityLabel: 'todo category',
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
 * TodoCategoryService
 *
 * Slim Firestore write helpers for `homes/{homeId}/todoCategories`. Reads
 * are live snapshots managed by todoSaga.
 */
class TodoCategoryService {
    createCategory(homeId: string, input: CreateTodoCategoryInput): TodoCategory {
        return crud.create(homeId, input);
    }

    updateCategory(homeId: string, categoryId: string, updates: UpdateTodoCategoryInput): void {
        crud.update(homeId, categoryId, updates);
    }

    deleteCategory(homeId: string, categoryId: string): void {
        crud.remove(homeId, categoryId);
    }
}

export const todoCategoryService = new TodoCategoryService();
export type { TodoCategoryService };
