import { generateTodoId } from '../utils/idGenerator';
import { TodoItem } from '../types/inventory';
import { todosCol } from './firebase/firestoreRefs';
import { createCrudService } from './createCrudService';

type CreateTodoInput = { text: string; note?: string; categoryId?: string };
type UpdateTodoInput = Partial<
  Omit<TodoItem, 'id' | 'homeId' | 'createdAt' | 'updatedAt'>
>;

const crud = createCrudService<TodoItem, CreateTodoInput, UpdateTodoInput>({
  collection: todosCol,
  generateId: generateTodoId,
  entityLabel: 'todo',
  counterField: 'todos',
  buildCreate: (input, { id, homeId, now }) => {
    const fields = {
      text: input.text.trim(),
      completed: false,
      completedAt: null,
      position: 0,
      note: input.note,
      categoryId: input.categoryId,
    };
    return {
      docData: fields,
      entity: { ...fields, id, homeId, createdAt: now, updatedAt: now },
    };
  },
});

/**
 * TodoService
 *
 * Slim Firestore write helpers for `homes/{homeId}/todos`. Reads are live
 * snapshots managed by todoSaga; writes are fire-and-forget so the
 * latency-compensated local snapshot updates the UI immediately.
 */
class TodoService {
  createTodo(homeId: string, input: CreateTodoInput): TodoItem {
    return crud.create(homeId, input);
  }

  updateTodo(homeId: string, todoId: string, updates: UpdateTodoInput): void {
    crud.update(homeId, todoId, updates);
  }

  deleteTodo(homeId: string, todoId: string): void {
    crud.remove(homeId, todoId);
  }
}

export const todoService = new TodoService();
export type { TodoService };
