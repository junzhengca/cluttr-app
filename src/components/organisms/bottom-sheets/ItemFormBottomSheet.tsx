import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Alert } from 'react-native';
import { ThemeProvider as StyledThemeProvider } from 'styled-components/native';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useStore } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import type { InventoryItem, ItemBatch } from '../../../types/inventory';
import { ThemeContext, useTheme } from '../../../theme/ThemeProvider';
import { useKeyboardVisibility } from '../../../hooks/useKeyboardVisibility';
import { useItemForm } from '../../../hooks/useItemForm';
import { useBottomSheetLifecycle } from '../../../hooks/useBottomSheetLifecycle';
import { useAppDispatch } from '../../../store/hooks';
import type { RootState } from '../../../store';
import { BottomSheetHeader, GlassButton } from '../../atoms';
import { ItemFormFields } from '../forms/ItemFormFields';
import { uiLogger } from '../../../utils/Logger';
import { generateItemId } from '../../../utils/idGenerator';
import {
  ContentContainer,
  FooterContainer,
  renderStandardBackdrop,
  STANDARD_SHEET_PROPS,
} from './shared/sheetPrimitives';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY_LOCATION = 'LAST_CREATED_ITEM_LOCATION';

/** Sensible defaults for fields the create-item form no longer exposes. */
const DEFAULT_ICON = 'cube-outline' as const;
const DEFAULT_COLOR = '#95A5A6';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FormMode = 'create' | 'edit';

export interface ItemFormSubmitValues {
  name: string;
  location: string;
  detailedLocation: string;
  status: string;
  categoryId: string | null;
  warningThreshold: number;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  batches?: ItemBatch[];
}

interface ItemFormBottomSheetBaseProps {
  bottomSheetRef: React.RefObject<BottomSheetModal | null>;
}

export interface ItemFormBottomSheetCreateProps
  extends ItemFormBottomSheetBaseProps {
  mode: 'create';
  /** Seed values (e.g. recognized item data) — only location/categoryId are used. */
  initialData?: Partial<InventoryItem> | null;
  onItemCreated?: () => void;
  onSheetClose?: () => void;
}

export interface ItemFormBottomSheetEditProps
  extends ItemFormBottomSheetBaseProps {
  mode: 'edit';
  onItemUpdated?: () => void;
}

export type ItemFormBottomSheetProps =
  | ItemFormBottomSheetCreateProps
  | ItemFormBottomSheetEditProps;

export interface ItemFormBottomSheetRef {
  /** Edit mode: look up the item in the store, populate the form, present. */
  present: (itemId: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Unified bottom sheet for creating ('create' mode) and editing ('edit' mode)
 * an inventory item.
 *
 * Create mode: name/location/category + first-batch fields (price, amount,
 * unit, vendor, expiry) + advanced collapsible; persists the last-used
 * location; auto-focuses the name input; piggy-mode easter egg.
 *
 * Edit mode: same item fields without batch fields (batches are managed
 * separately); presented imperatively via `ref.present(itemId)`.
 */
export const ItemFormBottomSheet = forwardRef<
  ItemFormBottomSheetRef,
  ItemFormBottomSheetProps
>((props, ref) => {
  const { mode, bottomSheetRef } = props;
  const externalInitialData = props.mode === 'create' ? props.initialData : undefined;
  const onItemCreated = props.mode === 'create' ? props.onItemCreated : undefined;
  const onSheetClose = props.mode === 'create' ? props.onSheetClose : undefined;
  const onItemUpdated = props.mode === 'edit' ? props.onItemUpdated : undefined;

  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const store = useStore();
  const { isKeyboardVisible } = useKeyboardVisibility();

  // --- Edit mode: item being edited ---------------------------------------

  const currentItemIdRef = useRef<string | null>(null);
  // State for initial data (triggers form population in hook's useEffect)
  const [editInitialData, setEditInitialData] =
    useState<Partial<InventoryItem> | null>(null);

  // --- Create mode: persisted last-used location --------------------------

  const [lastLocation, setLastLocation] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (mode !== 'create') return;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY_LOCATION);
        if (stored) setLastLocation(stored);
      } catch (error) {
        uiLogger.error('Failed to load last created item location', error);
      }
    })();
  }, [mode]);

  const resolvedInitialLocation =
    mode === 'create' ? externalInitialData?.location ?? lastLocation : undefined;

  // --- Form hook -----------------------------------------------------------

  const [isLoading, setIsLoading] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  const handleFormValidChange = useCallback((isValid: boolean) => {
    setIsFormValid(isValid);
  }, []);

  const {
    nameInputRef,
    priceInputRef,
    amountInputRef,
    unitInputRef,
    vendorInputRef,
    detailedLocationInputRef,
    warningThresholdInputRef,
    defaultName,
    defaultPrice,
    defaultAmount,
    defaultUnit,
    defaultVendor,
    defaultDetailedLocation,
    defaultWarningThreshold,
    selectedLocation,
    selectedCategoryId,
    expiryDate,
    selectedStatusId,
    formKey,
    isPiggyMode,
    setSelectedLocation,
    setSelectedCategoryId,
    setExpiryDate,
    setSelectedStatusId,
    getFormValues,
    isFormDirty,
    resetForm,
    handleNameChangeText,
    handleNameBlur,
    handlePriceChange,
    handlePriceBlur,
    handleAmountChange,
    handleAmountBlur,
    handleUnitChange,
    handleUnitBlur,
    handleVendorChange,
    handleVendorBlur,
    handleDetailedLocationChange,
    handleDetailedLocationBlur,
    handleWarningThresholdChange,
    handleWarningThresholdBlur,
  } = useItemForm({
    mode,
    initialLocation: resolvedInitialLocation,
    initialCategoryId:
      mode === 'create' ? externalInitialData?.categoryId ?? null : null,
    initialData: mode === 'edit' ? editInitialData : null,
    onFormValidChange: handleFormValidChange,
  });

  // --- Sheet lifecycle (dirty-close confirmation) --------------------------

  const handleClosed = useCallback(() => {
    if (mode === 'create') {
      onSheetClose?.();
    } else {
      // Reset initial data when sheet closes to avoid stale data next time
      setEditInitialData(null);
    }
  }, [mode, onSheetClose]);

  const handleOpened = useCallback(
    (index: number) => {
      if (mode === 'create' && index === 0) {
        // Sheet opening — auto-focus name input
        nameInputRef.current?.focus();
      }
    },
    [mode, nameInputRef],
  );

  const { handleSheetChange, handleClose, setOpeningNestedModal } =
    useBottomSheetLifecycle({
      bottomSheetRef,
      isFormDirty,
      resetForm,
      onClosed: handleClosed,
      onOpened: handleOpened,
    });

  // --- Submit ---------------------------------------------------------------

  const handleSubmit = useCallback(async () => {
    const formValues = getFormValues();
    uiLogger.info('ItemFormBottomSheet handleSubmit', formValues);

    const itemId = currentItemIdRef.current;
    if (mode === 'edit' && !itemId) {
      uiLogger.error('No itemId found for update');
      return;
    }

    if (!formValues.name.trim()) {
      Alert.alert(
        t(`${mode}Item.errors.title`),
        t(`${mode}Item.errors.enterName`),
      );
      return;
    }
    if (!formValues.location) {
      Alert.alert(
        t(`${mode}Item.errors.title`),
        t(`${mode}Item.errors.selectLocation`),
      );
      return;
    }

    setIsLoading(true);
    try {
      const parsedWarningThreshold = parseInt(formValues.warningThreshold, 10);
      const warningThreshold = isNaN(parsedWarningThreshold)
        ? 0
        : parsedWarningThreshold;

      if (mode === 'create') {
        const now = new Date().toISOString();

        // Build the first batch from user-entered values
        const parsedAmount = parseInt(formValues.amount || '1', 10);
        const parsedPrice = parseFloat(formValues.price);

        const firstBatch: ItemBatch = {
          id: generateItemId(),
          amount: isNaN(parsedAmount) || parsedAmount < 1 ? 1 : parsedAmount,
          price: isNaN(parsedPrice) ? undefined : parsedPrice,
          unit: formValues.unit.trim() || undefined,
          vendor: formValues.vendor.trim() || undefined,
          expiryDate: formValues.expiryDate?.toISOString(),
          createdAt: now,
        };

        const submitValues: ItemFormSubmitValues = {
          name: formValues.name.trim(),
          location: formValues.location,
          detailedLocation: formValues.detailedLocation.trim(),
          status: formValues.status,
          categoryId: formValues.categoryId,
          warningThreshold,
          icon: DEFAULT_ICON,
          iconColor: DEFAULT_COLOR,
          batches: [firstBatch],
        };

        dispatch({ type: 'inventory/CREATE_ITEM', payload: submitValues });

        // Persist last-used location
        try {
          await AsyncStorage.setItem(STORAGE_KEY_LOCATION, formValues.location);
          setLastLocation(formValues.location);
        } catch (error) {
          uiLogger.error('Failed to save last created item location', error);
        }
      } else {
        const updateValues = {
          name: formValues.name.trim(),
          location: formValues.location,
          detailedLocation: formValues.detailedLocation.trim(),
          status: formValues.status,
          categoryId: formValues.categoryId,
          warningThreshold,
        };

        dispatch({
          type: 'inventory/UPDATE_ITEM',
          payload: { id: itemId, updates: updateValues },
        });
      }

      handleClose(true);
      resetForm();
      if (mode === 'create') {
        onItemCreated?.();
      } else {
        onItemUpdated?.();
      }
    } catch (error) {
      uiLogger.error(`Error in ${mode} item`, error);
      Alert.alert(
        t(`${mode}Item.errors.title`),
        t(`${mode}Item.errors.${mode === 'create' ? 'createFailed' : 'updateFailed'}`),
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    mode,
    getFormValues,
    dispatch,
    handleClose,
    resetForm,
    onItemCreated,
    onItemUpdated,
    t,
  ]);

  // --- Expose present method (edit mode) ------------------------------------

  useImperativeHandle(
    ref,
    () => ({
      present: (itemId: string) => {
        uiLogger.info('present called with itemId', itemId);
        const state = store.getState() as RootState;
        const items = state.inventory.items;

        const item = items.find((i) => i.id === itemId);
        if (!item) {
          uiLogger.info('Item not found!');
          return;
        }

        // Store the current item ID
        currentItemIdRef.current = itemId;

        // Set initialData - this triggers form population
        setEditInitialData(item);

        // Present the bottom sheet immediately
        setTimeout(() => {
          bottomSheetRef.current?.present();
        }, 0);
      },
    }),
    [store, bottomSheetRef],
  );

  // --- Translations (memoised) ----------------------------------------------

  const translations = useMemo(
    () => ({
      fields: {
        name: t(`${mode}Item.fields.name`),
        location: t(`${mode}Item.fields.location`),
        category: t(`${mode}Item.fields.category`),
        ...(mode === 'create'
          ? { expiryDate: t('createItem.fields.expiryDate') }
          : {}),
        advanced: t(`${mode}Item.fields.advanced`),
        detailedLocation: t(`${mode}Item.fields.detailedLocation`),
        status: t(`${mode}Item.fields.status`),
        warningThreshold: t(`${mode}Item.fields.warningThreshold`),
      },
      placeholders: {
        name: t(`${mode}Item.placeholders.name`),
        detailedLocation: t(`${mode}Item.placeholders.detailedLocation`),
        warningThreshold: t(`${mode}Item.placeholders.warningThreshold`),
      },
    }),
    [mode, t],
  );

  // --- Theme overrides (piggy mode easter egg, create mode only) ------------

  const activeTheme = useMemo(() => {
    if (!isPiggyMode) return theme;
    return {
      ...theme,
      colors: {
        ...theme.colors,
        primary: '#FF69B4', // Hot pink
        primaryDark: '#C71585', // Medium violet red
        primaryLight: '#FFB6C1', // Light pink
        primaryLightest: '#FFC0CB', // Pink
        primaryExtraLight: '#FFE4E1', // Misty rose
        background: '#FFF0F5', // Lavender blush
      },
    };
  }, [theme, isPiggyMode]);

  // --- Render helpers --------------------------------------------------------

  const renderFooter = useCallback(
    () => (
      <FooterContainer
        bottomInset={insets.bottom}
        showSafeArea={!isKeyboardVisible}
      >
        <GlassButton
          text={
            mode === 'create'
              ? isLoading
                ? t('common.saving')
                : t('createItem.submit')
              : t('editItem.submit')
          }
          onPress={handleSubmit}
          icon={mode === 'create' ? 'add' : 'checkmark'}
          loading={mode === 'create' ? isLoading : undefined}
          tintColor={activeTheme.colors.primary}
          textColor={activeTheme.colors.surface}
          disabled={!isFormValid || isLoading}
          style={{ width: '100%' }}
        />
      </FooterContainer>
    ),
    [mode, handleSubmit, isLoading, isFormValid, isKeyboardVisible, insets.bottom, t, activeTheme],
  );

  const sharedFieldProps = {
    selectedLocation,
    selectedCategoryId,
    selectedStatusId,
    formKey,
    nameInputRef,
    detailedLocationInputRef,
    warningThresholdInputRef,
    defaultName,
    defaultDetailedLocation,
    defaultWarningThreshold,
    onLocationSelect: setSelectedLocation,
    onCategorySelect: setSelectedCategoryId,
    onStatusSelect: setSelectedStatusId,
    onNameChangeText: handleNameChangeText,
    onNameBlur: handleNameBlur,
    onDetailedLocationChange: handleDetailedLocationChange,
    onDetailedLocationBlur: handleDetailedLocationBlur,
    onWarningThresholdChange: handleWarningThresholdChange,
    onWarningThresholdBlur: handleWarningThresholdBlur,
    onOpeningNestedModal: setOpeningNestedModal,
    translations,
  };

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      {...STANDARD_SHEET_PROPS}
      backdropComponent={renderStandardBackdrop}
      topInset={insets.top}
      index={0}
      footerComponent={renderFooter}
      onChange={handleSheetChange}
      backgroundStyle={{ backgroundColor: activeTheme.colors.background }}
    >
      <ThemeContext.Provider value={{ theme: activeTheme }}>
        <StyledThemeProvider theme={activeTheme}>
          <ContentContainer>
            <BottomSheetHeader
              title={
                isPiggyMode
                  ? `${t('createItem.title')} 🐷`
                  : t(`${mode}Item.title`)
              }
              subtitle={
                isPiggyMode
                  ? `${t('createItem.subtitle')} 🐽`
                  : t(`${mode}Item.subtitle`)
              }
              onClose={handleClose}
            />
            <BottomSheetScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{
                paddingHorizontal: activeTheme.spacing.md,
                paddingBottom: activeTheme.spacing.lg,
              }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              enableOnPanDownToDismiss={false}
            >
              {mode === 'create' ? (
                <ItemFormFields
                  mode="create"
                  {...sharedFieldProps}
                  priceInputRef={priceInputRef}
                  amountInputRef={amountInputRef}
                  unitInputRef={unitInputRef}
                  vendorInputRef={vendorInputRef}
                  defaultPrice={defaultPrice}
                  defaultAmount={defaultAmount}
                  defaultUnit={defaultUnit}
                  defaultVendor={defaultVendor}
                  onPriceChange={handlePriceChange}
                  onPriceBlur={handlePriceBlur}
                  onAmountChange={handleAmountChange}
                  onAmountBlur={handleAmountBlur}
                  onUnitChange={handleUnitChange}
                  onUnitBlur={handleUnitBlur}
                  onVendorChange={handleVendorChange}
                  onVendorBlur={handleVendorBlur}
                  expiryDate={expiryDate}
                  onExpiryDateChange={setExpiryDate}
                />
              ) : (
                <ItemFormFields mode="edit" {...sharedFieldProps} />
              )}
            </BottomSheetScrollView>
          </ContentContainer>
        </StyledThemeProvider>
      </ThemeContext.Provider>
    </BottomSheetModal>
  );
});

ItemFormBottomSheet.displayName = 'ItemFormBottomSheet';
