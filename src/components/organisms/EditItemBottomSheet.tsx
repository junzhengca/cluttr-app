import React, { useRef, useCallback, useImperativeHandle, forwardRef, useState } from 'react';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import type { InventoryItem } from '../../types/inventory';
import { useInventory } from '../../store/hooks';
import { ItemFormBottomSheet } from './ItemFormBottomSheet';

export interface EditItemBottomSheetProps {
  bottomSheetRef: React.RefObject<BottomSheetModal | null>;
  onItemUpdated?: () => void;
}

export interface EditItemBottomSheetRef {
  present: (itemId: string) => void;
}

/**
 * Edit item bottom sheet using shared ItemFormBottomSheet component.
 *
 * Uses uncontrolled inputs with refs to prevent IME composition interruption
 * for Chinese/Japanese input methods.
 */
export const EditItemBottomSheet = forwardRef<
  EditItemBottomSheetRef,
  EditItemBottomSheetProps
>(({ bottomSheetRef, onItemUpdated }, ref) => {
  const { updateItem, items } = useInventory();

  // Track which item ID is currently being edited
  const currentItemIdRef = useRef<string | null>(null);
  // State for initial data (triggers form population in hook's useEffect)
  const [initialData, setInitialData] = useState<Partial<InventoryItem> | null>(null);

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
      console.log('[EditItemBottomSheet] handleSubmit called with icon:', values.icon, 'iconColor:', values.iconColor);
      const itemId = currentItemIdRef.current;
      console.log('[EditItemBottomSheet] currentItemIdRef.current:', itemId);
      if (!itemId) {
        console.log('[EditItemBottomSheet] NO itemId - returning early!');
        return;
      }
      console.log('[EditItemBottomSheet] About to call updateItem with itemId:', itemId);
      updateItem(itemId, values);
      // Clear the ref after update is dispatched
      currentItemIdRef.current = null;
      console.log('[EditItemBottomSheet] updateItem called');
    },
    [updateItem]
  );

  const handleSuccess = useCallback(() => {
    onItemUpdated?.();
  }, [onItemUpdated]);

  const handleSheetClose = useCallback(() => {
    // Don't clear currentItemIdRef here - it's needed for the form submission
    // It will be cleared after successful update in handleSuccess
    setInitialData(null);
  }, []);

  // Expose present method
  useImperativeHandle(
    ref,
    () => ({
      present: (itemId: string) => {
        console.log('[EditItemBottomSheet] present called with itemId:', itemId);
        console.log('[EditItemBottomSheet] items:', items);

        const item = items.find((i) => i.id === itemId);
        if (!item) {
          console.log('[EditItemBottomSheet] Item not found!');
          return;
        }

        console.log('[EditItemBottomSheet] Item found:', item);
        console.log('[EditItemBottomSheet] bottomSheetRef.current:', bottomSheetRef.current);

        // Store the current item ID
        currentItemIdRef.current = itemId;

        // Set initialData - this triggers form population
        setInitialData(item);

        // Present the bottom sheet immediately
        // The form will be populated on the next render cycle
        setTimeout(() => {
          console.log('[EditItemBottomSheet] Calling present()');
          bottomSheetRef.current?.present();
        }, 0);
      },
    }),
    [items, bottomSheetRef]
  );

  return (
    <ItemFormBottomSheet
      bottomSheetRef={bottomSheetRef}
      mode="edit"
      initialData={initialData}
      onSubmit={handleSubmit}
      onSuccess={handleSuccess}
      onSheetClose={handleSheetClose}
    />
  );
});

EditItemBottomSheet.displayName = 'EditItemBottomSheet';
