import { TodoCategory } from '../types/inventory';

// System timestamp for default entities (indicates "always existed")
const SYSTEM_TIMESTAMP = '1970-01-01T00:00:00.000Z';

// Default todo categories for grocery shopping
// Names are translation keys that will be resolved via i18n
export const todoCategories: Omit<TodoCategory, 'homeId'>[] = [
  { id: 'produce', name: 'produce', createdAt: SYSTEM_TIMESTAMP, updatedAt: SYSTEM_TIMESTAMP, version: 1, clientUpdatedAt: SYSTEM_TIMESTAMP },
  { id: 'dairy', name: 'dairy', createdAt: SYSTEM_TIMESTAMP, updatedAt: SYSTEM_TIMESTAMP, version: 1, clientUpdatedAt: SYSTEM_TIMESTAMP },
  { id: 'meat', name: 'meat', createdAt: SYSTEM_TIMESTAMP, updatedAt: SYSTEM_TIMESTAMP, version: 1, clientUpdatedAt: SYSTEM_TIMESTAMP },
  { id: 'seafood', name: 'seafood', createdAt: SYSTEM_TIMESTAMP, updatedAt: SYSTEM_TIMESTAMP, version: 1, clientUpdatedAt: SYSTEM_TIMESTAMP },
  { id: 'bakery', name: 'bakery', createdAt: SYSTEM_TIMESTAMP, updatedAt: SYSTEM_TIMESTAMP, version: 1, clientUpdatedAt: SYSTEM_TIMESTAMP },
  { id: 'frozen', name: 'frozen', createdAt: SYSTEM_TIMESTAMP, updatedAt: SYSTEM_TIMESTAMP, version: 1, clientUpdatedAt: SYSTEM_TIMESTAMP },
  { id: 'pantry', name: 'pantry', createdAt: SYSTEM_TIMESTAMP, updatedAt: SYSTEM_TIMESTAMP, version: 1, clientUpdatedAt: SYSTEM_TIMESTAMP },
  { id: 'beverages', name: 'beverages', createdAt: SYSTEM_TIMESTAMP, updatedAt: SYSTEM_TIMESTAMP, version: 1, clientUpdatedAt: SYSTEM_TIMESTAMP },
  { id: 'snacks', name: 'snacks', createdAt: SYSTEM_TIMESTAMP, updatedAt: SYSTEM_TIMESTAMP, version: 1, clientUpdatedAt: SYSTEM_TIMESTAMP },
  { id: 'household', name: 'household', createdAt: SYSTEM_TIMESTAMP, updatedAt: SYSTEM_TIMESTAMP, version: 1, clientUpdatedAt: SYSTEM_TIMESTAMP },
  { id: 'personal-care', name: 'personal-care', createdAt: SYSTEM_TIMESTAMP, updatedAt: SYSTEM_TIMESTAMP, version: 1, clientUpdatedAt: SYSTEM_TIMESTAMP },
  { id: 'other', name: 'other', createdAt: SYSTEM_TIMESTAMP, updatedAt: SYSTEM_TIMESTAMP, version: 1, clientUpdatedAt: SYSTEM_TIMESTAMP },
];
