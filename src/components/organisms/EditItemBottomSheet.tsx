import React, { useRef, useCallback, useEffect } from 'react';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useInventory } from '../../store/hooks';
import { ItemFormBottomSheet } from './ItemFormBottomSheet';

export interface EditItemBottomSheetProps {
  bottomSheetRef: React.RefObject<BottomSheetModal | null>;
  itemId: string;
  onItemUpdated?: () => void;
}

/**
 * Edit item bottom sheet using shared ItemFormBottomSheet component.
 * Reduced from ~537 lines to ~60 lines by sharing code with CreateItemBottomSheet.
 *
 * Uses uncontrolled inputs with refs to prevent IME composition interruption
 * for Chinese/Japanese input methods.
 *
 * Handles loading item data from the Redux store when the sheet opens.
 */
export const EditItemBottomSheet: React.FC<EditItemBottomSheetProps> = ({
  bottomSheetRef,
  itemId,
  onItemUpdated,
}) => {
  const { updateItem, items } = useInventory();

  // Track items and current item for form initialization
  const itemsRef = useRef(items);
  const currentItemIdRef = useRef<string | null>(null);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Get current item data from store
  const getCurrentItemData = useCallback(() => {
    if (!currentItemIdRef.current) return null;
    return itemsRef.current.find((i) => i.id === currentItemIdRef.current) ?? null;
  }, []);

  const handleSubmit = useCallback(
    async (values: {
      name: string;
      location: string;
      detailedLocation: string;
      status: string;
      price: number;
      amount?: number;
      warningThreshold: number;
      icon: keyof typeof Ionicons.glyphMap;
      iconColor: string;
      purchaseDate?: string;
      expiryDate?: string;
    }) => {
      if (!currentItemIdRef.current) return;
      updateItem(currentItemIdRef.current, values);
    },
    [updateItem]
  );

  const handleSuccess = useCallback(() => {
    onItemUpdated?.();
  }, [onItemUpdated]);

  const handleSheetOpen = useCallback(() => {
    // Set the current item ID when sheet opens
    currentItemIdRef.current = itemId;
  }, [itemId]);

  const handleSheetClose = useCallback(() => {
    // Clear the current item ID when sheet closes
    currentItemIdRef.current = null;
  }, []);

  return (
    <ItemFormBottomSheet
      bottomSheetRef={bottomSheetRef}
      mode="edit"
      initialData={getCurrentItemData()}
      onSubmit={handleSubmit}
      onSuccess={handleSuccess}
      onSheetOpen={handleSheetOpen}
      onSheetClose={handleSheetClose}
    />
  );
};
