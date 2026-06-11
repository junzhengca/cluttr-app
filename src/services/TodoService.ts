import { generateTodoId } from '../utils/idGenerator';
import { TodoItem } from '../types/inventory';
import { todosCol, fireWrite, isoNow } from './firebase/firestoreRefs';

/**
 * TodoService
 *
 * Slim Firestore write helpers for `homes/{homeId}/todos`. Reads are live
 * snapshots managed by todoSaga; writes are fire-and-forget so the
 * latency-compensated local snapshot updates the UI immediately.
 */
class TodoService {
    createTodo(
        homeId: string,
        input: { text: string; note?: string; categoryId?: string },
    ): TodoItem {
        const id = generateTodoId();
        const now = isoNow();

        fireWrite(
            todosCol(homeId).doc(id).set({
                text: input.text.trim(),
                completed: false,
                completedAt: null,
                position: 0,
                note: input.note,
                categoryId: input.categoryId,
                createdAt: now,
                updatedAt: now,
            }),
            'Failed to create todo',
        );

        return {
            id,
            homeId,
            text: input.text.trim(),
            completed: false,
            completedAt: null,
            position: 0,
            note: input.note,
            categoryId: input.categoryId,
            createdAt: now,
            updatedAt: now,
        };
    }

    updateTodo(
        homeId: string,
        todoId: string,
        updates: Partial<Omit<TodoItem, 'id' | 'homeId' | 'createdAt' | 'updatedAt'>>,
    ): void {
        fireWrite(
            todosCol(homeId).doc(todoId).update({ ...updates, updatedAt: isoNow() }),
            'Failed to update todo',
        );
    }

    deleteTodo(homeId: string, todoId: string): void {
        fireWrite(todosCol(homeId).doc(todoId).delete(), 'Failed to delete todo');
    }
}

export const todoService = new TodoService();
export type { TodoService };
