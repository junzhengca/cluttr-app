import { Category } from '../types/inventory';

// Location categories (used for filtering, not item types)
export const locationCategories: Category[] = [
  { id: 'all', name: 'all', label: '全部', isCustom: false },
  { id: 'living-room', name: 'living-room', label: '客厅', isCustom: false },
  { id: 'kitchen', name: 'kitchen', label: '厨房', isCustom: false },
  { id: 'bedroom', name: 'bedroom', label: '卧室', isCustom: false },
  { id: 'study', name: 'study', label: '书房', isCustom: false },
  { id: 'storage', name: 'storage', label: '储物', isCustom: false },
];

// Item-type categories (used for categorizing items)
export const itemCategories: Category[] = [
  { id: 'appliances', name: 'appliances', label: '电器', isCustom: false, icon: 'desktop-outline', iconColor: '#4A90E2' },
  { id: 'kitchenware', name: 'kitchenware', label: '厨具', isCustom: false, icon: 'restaurant-outline', iconColor: '#FFA07A' },
  { id: 'digital', name: 'digital', label: '数码', isCustom: false, icon: 'phone-portrait-outline', iconColor: '#9B59B6' },
  { id: 'beauty', name: 'beauty', label: '美妆', isCustom: false, icon: 'sparkles', iconColor: '#D81B60' },
  { id: 'entertainment', name: 'entertainment', label: '娱乐', isCustom: false, icon: 'game-controller-outline', iconColor: '#DDA0DD' },
  { id: 'apparel', name: 'apparel', label: '服饰', isCustom: false, icon: 'shirt-outline', iconColor: '#E74C3C' },
  { id: 'home', name: 'home', label: '家居', isCustom: false, icon: 'home-outline', iconColor: '#16A085' },
  { id: 'other', name: 'other', label: '其他', isCustom: false, icon: 'cube-outline', iconColor: '#95A5A6' },
];

// Legacy export for backward compatibility
export const categories = locationCategories;

