import { Category } from '../types/inventory';

// Item-type categories (used for categorizing items)
// Note: This file is kept for reference only.
// Default categories are NO LONGER created automatically via file storage.
// Categories are now managed via CRUD API endpoints only.
// Users can create their own custom categories through the UI.

const SYSTEM_TIMESTAMP = '1970-01-01T00:00:00.000Z';

export const itemCategories: Omit<Category, 'homeId'>[] = [
  { id: 'appliances', name: 'Appliances', label: 'Appliances', isCustom: false, icon: 'desktop-outline', color: '#4A90E2', createdAt: SYSTEM_TIMESTAMP, updatedAt: SYSTEM_TIMESTAMP },
  { id: 'kitchenware', name: 'Kitchenware', label: 'Kitchenware', isCustom: false, icon: 'restaurant-outline', color: '#FFA07A', createdAt: SYSTEM_TIMESTAMP, updatedAt: SYSTEM_TIMESTAMP },
  { id: 'digital', name: 'Digital', label: 'Digital', isCustom: false, icon: 'phone-portrait-outline', color: '#9B59B6', createdAt: SYSTEM_TIMESTAMP, updatedAt: SYSTEM_TIMESTAMP },
  { id: 'beauty', name: 'Beauty', label: 'Beauty', isCustom: false, icon: 'sparkles', color: '#D81B60', createdAt: SYSTEM_TIMESTAMP, updatedAt: SYSTEM_TIMESTAMP },
  { id: 'entertainment', name: 'Entertainment', label: 'Entertainment', isCustom: false, icon: 'game-controller-outline', color: '#16A085', createdAt: SYSTEM_TIMESTAMP, updatedAt: SYSTEM_TIMESTAMP },
  { id: 'apparel', name: 'Apparel', label: 'Apparel', isCustom: false, icon: 'shirt-outline', color: '#F39C12', createdAt: SYSTEM_TIMESTAMP, updatedAt: SYSTEM_TIMESTAMP },
  { id: 'home', name: 'Home', label: 'Home', isCustom: false, icon: 'home-outline', color: '#2ECC71', createdAt: SYSTEM_TIMESTAMP, updatedAt: SYSTEM_TIMESTAMP },
  { id: 'other', name: 'Other', label: 'Other', isCustom: false, icon: 'cube-outline', color: '#95A5A6', createdAt: SYSTEM_TIMESTAMP, updatedAt: SYSTEM_TIMESTAMP },
];
