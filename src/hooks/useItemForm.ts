import { useRef, useCallback, useEffect, useState } from 'react';
import { TextInput } from 'react-native';
import type { InventoryItem } from '../types/inventory';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ItemFormMode = 'create' | 'edit';

export interface ItemFormValues {
  name: string;
  location: string;
  categoryId: string | null;
  // Batch fields (create mode only — stay at defaults in edit mode)
  price: string;
  amount: string;
  unit: string;
  vendor: string;
  expiryDate: Date | null;
  // Advanced fields
  detailedLocation: string;
  status: string;
  warningThreshold: string;
}

export interface UseItemFormOptions {
  mode: ItemFormMode;
  /** Create mode: seed for the location selector (e.g. last-used location). */
  initialLocation?: string;
  /** Create mode: seed for the category selector. */
  initialCategoryId?: string | null;
  /** Edit mode: the item being edited; populates the form when set. */
  initialData?: Partial<InventoryItem> | null;
  onFormValidChange?: (isValid: boolean) => void;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_LOCATION = '';
const DEFAULT_PRICE = '';
const DEFAULT_AMOUNT = '1';
const DEFAULT_UNIT = 'pcs';
const DEFAULT_VENDOR = '';
const DEFAULT_STATUS = 'using';
const DEFAULT_WARNING_THRESHOLD = '';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const datesEqual = (a: Date | null, b: Date | null): boolean => {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  return a.getTime() === b.getTime();
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Unified form hook for the item form bottom sheet (create + edit modes).
 *
 * Shared core (both modes):
 *  - name             – uncontrolled text input (ref-based, IME-safe)
 *  - location         – selector state
 *  - categoryId       – selector state
 *  - detailedLocation – uncontrolled text input
 *  - status           – selector state
 *  - warningThreshold – uncontrolled numeric input
 *
 * Create-only extension:
 *  - price / amount / unit / vendor – uncontrolled batch inputs
 *  - expiryDate                     – date picker state
 *  - piggy-mode easter-egg detection on name changes
 *  - initial-location sync (last-used / recognized item)
 *
 * Edit-only extension:
 *  - `initialData` population effect (re-keys the form on each new item)
 *
 * Uses the dual-state IME pattern: values live in refs (updated on
 * onChangeText), `default*` state feeds `defaultValue`, and `formKey`
 * remounts inputs on reset.
 */
export const useItemForm = (options: UseItemFormOptions) => {
  const {
    mode,
    initialLocation,
    initialCategoryId = null,
    initialData,
    onFormValidChange,
  } = options;

  // --- Refs (uncontrolled inputs) ----------------------------------------

  const nameInputRef = useRef<TextInput>(null);
  const nameValueRef = useRef('');

  const priceInputRef = useRef<TextInput>(null);
  const priceValueRef = useRef(DEFAULT_PRICE);

  const amountInputRef = useRef<TextInput>(null);
  const amountValueRef = useRef(DEFAULT_AMOUNT);

  const unitInputRef = useRef<TextInput>(null);
  const unitValueRef = useRef(DEFAULT_UNIT);

  const vendorInputRef = useRef<TextInput>(null);
  const vendorValueRef = useRef(DEFAULT_VENDOR);

  const detailedLocationInputRef = useRef<TextInput>(null);
  const detailedLocationValueRef = useRef('');

  const warningThresholdInputRef = useRef<TextInput>(null);
  const warningThresholdValueRef = useRef(DEFAULT_WARNING_THRESHOLD);

  // --- Initial values (for dirty-state tracking) -------------------------

  const initialValuesRef = useRef({
    name: '',
    location: initialLocation ?? DEFAULT_LOCATION,
    categoryId: initialCategoryId,
    price: DEFAULT_PRICE,
    amount: DEFAULT_AMOUNT,
    unit: DEFAULT_UNIT,
    vendor: DEFAULT_VENDOR,
    expiryDate: null as Date | null,
    detailedLocation: '',
    status: DEFAULT_STATUS,
    warningThreshold: DEFAULT_WARNING_THRESHOLD,
  });

  // --- State -------------------------------------------------------------

  const [defaultName, setDefaultName] = useState('');
  const [defaultPrice, setDefaultPrice] = useState(DEFAULT_PRICE);
  const [defaultAmount, setDefaultAmount] = useState(DEFAULT_AMOUNT);
  const [defaultUnit, setDefaultUnit] = useState(DEFAULT_UNIT);
  const [defaultVendor, setDefaultVendor] = useState(DEFAULT_VENDOR);
  const [defaultDetailedLocation, setDefaultDetailedLocation] = useState('');
  const [defaultWarningThreshold, setDefaultWarningThreshold] = useState(
    DEFAULT_WARNING_THRESHOLD
  );

  const [selectedLocation, setSelectedLocation] = useState(
    initialLocation ?? DEFAULT_LOCATION
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    initialCategoryId
  );
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [selectedStatusId, setSelectedStatusId] = useState(DEFAULT_STATUS);
  const [formKey, setFormKey] = useState(0);

  // --- Easter Egg State (create mode only) --------------------------------
  const [isPiggyMode, setIsPiggyMode] = useState(false);

  // --- Validation --------------------------------------------------------

  const getIsFormValid = useCallback(() => {
    const hasName = nameValueRef.current.trim().length > 0;
    const hasLocation = selectedLocation.length > 0;
    return hasName && hasLocation;
  }, [selectedLocation]);

  // Notify parent when location changes (affects validity)
  useEffect(() => {
    onFormValidChange?.(getIsFormValid());
  }, [selectedLocation, getIsFormValid, onFormValidChange]);

  // Sync initial values when the caller provides a new initial location
  // (create mode: last-used / recognized-item location).
  useEffect(() => {
    if (initialLocation !== undefined) {
      initialValuesRef.current.location = initialLocation;
      setSelectedLocation(initialLocation);
    }
  }, [initialLocation]);

  // --- Edit-mode initialization (populate from initialData) ---------------

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      const name = initialData.name ?? '';
      const location = initialData.location ?? DEFAULT_LOCATION;
      const categoryId = initialData.categoryId ?? null;
      const detailedLocation = initialData.detailedLocation ?? '';
      const status = initialData.status ?? DEFAULT_STATUS;
      const warningThreshold =
        initialData.warningThreshold?.toString() ?? DEFAULT_WARNING_THRESHOLD;

      initialValuesRef.current = {
        ...initialValuesRef.current,
        name,
        location,
        categoryId,
        detailedLocation,
        status,
        warningThreshold,
      };

      // Update refs and state
      nameValueRef.current = name;
      detailedLocationValueRef.current = detailedLocation;
      warningThresholdValueRef.current = warningThreshold;

      setDefaultName(name);
      setDefaultDetailedLocation(detailedLocation);
      setDefaultWarningThreshold(warningThreshold);

      setSelectedLocation(location);
      setSelectedCategoryId(categoryId);
      setSelectedStatusId(status);

      setFormKey((prev) => prev + 1);
    }
  }, [mode, initialData]);

  // --- Input handlers ----------------------------------------------------

  const handleNameChangeText = useCallback(
    (text: string) => {
      const wasValid = getIsFormValid();
      nameValueRef.current = text;
      const isValid = getIsFormValid();
      if (wasValid !== isValid) {
        onFormValidChange?.(isValid);
      }
      if (mode === 'create') {
        setIsPiggyMode(/(pig|猪)/i.test(text));
      }
    },
    [mode, getIsFormValid, onFormValidChange]
  );

  const handleNameBlur = useCallback(() => undefined, []);

  // Batch field handlers — simple ref updates, no validation impact
  const handlePriceChange = useCallback((text: string) => {
    priceValueRef.current = text;
  }, []);
  const handlePriceBlur = useCallback(() => undefined, []);

  const handleAmountChange = useCallback((text: string) => {
    amountValueRef.current = text;
  }, []);
  const handleAmountBlur = useCallback(() => undefined, []);

  const handleUnitChange = useCallback((text: string) => {
    unitValueRef.current = text;
  }, []);
  const handleUnitBlur = useCallback(() => undefined, []);

  const handleVendorChange = useCallback((text: string) => {
    vendorValueRef.current = text;
  }, []);
  const handleVendorBlur = useCallback(() => undefined, []);

  // Advanced field handlers
  const handleDetailedLocationChange = useCallback((text: string) => {
    detailedLocationValueRef.current = text;
  }, []);
  const handleDetailedLocationBlur = useCallback(() => undefined, []);

  const handleWarningThresholdChange = useCallback((text: string) => {
    warningThresholdValueRef.current = text;
  }, []);
  const handleWarningThresholdBlur = useCallback(() => undefined, []);

  // --- Form helpers ------------------------------------------------------

  const getFormValues = useCallback(
    (): ItemFormValues => ({
      name: nameValueRef.current,
      location: selectedLocation,
      categoryId: selectedCategoryId,
      price: priceValueRef.current,
      amount: amountValueRef.current,
      unit: unitValueRef.current,
      vendor: vendorValueRef.current,
      expiryDate,
      detailedLocation: detailedLocationValueRef.current,
      status: selectedStatusId,
      warningThreshold: warningThresholdValueRef.current,
    }),
    [selectedLocation, selectedCategoryId, expiryDate, selectedStatusId]
  );

  const isFormDirty = useCallback((): boolean => {
    const initial = initialValuesRef.current;
    return (
      nameValueRef.current !== initial.name ||
      selectedLocation !== initial.location ||
      selectedCategoryId !== initial.categoryId ||
      priceValueRef.current !== initial.price ||
      amountValueRef.current !== initial.amount ||
      unitValueRef.current !== initial.unit ||
      vendorValueRef.current !== initial.vendor ||
      !datesEqual(expiryDate, initial.expiryDate) ||
      detailedLocationValueRef.current !== initial.detailedLocation ||
      selectedStatusId !== initial.status ||
      warningThresholdValueRef.current !== initial.warningThreshold
    );
  }, [selectedLocation, selectedCategoryId, expiryDate, selectedStatusId]);

  const resetForm = useCallback(() => {
    if (mode === 'edit' && initialData) {
      // Re-populate from initialData
      const name = initialData.name ?? '';
      const location = initialData.location ?? DEFAULT_LOCATION;
      const categoryId = initialData.categoryId ?? null;
      const detailedLocation = initialData.detailedLocation ?? '';
      const status = initialData.status ?? DEFAULT_STATUS;
      const warningThreshold =
        initialData.warningThreshold?.toString() ?? DEFAULT_WARNING_THRESHOLD;

      initialValuesRef.current = {
        ...initialValuesRef.current,
        name,
        location,
        categoryId,
        detailedLocation,
        status,
        warningThreshold,
      };

      nameValueRef.current = name;
      detailedLocationValueRef.current = detailedLocation;
      warningThresholdValueRef.current = warningThreshold;

      setDefaultName(name);
      setDefaultDetailedLocation(detailedLocation);
      setDefaultWarningThreshold(warningThreshold);

      setSelectedLocation(location);
      setSelectedCategoryId(categoryId);
      setSelectedStatusId(status);
    } else {
      // Reset to defaults (create mode, or edit mode with no item loaded)
      initialValuesRef.current = {
        name: '',
        location: initialLocation ?? DEFAULT_LOCATION,
        categoryId: initialCategoryId,
        price: DEFAULT_PRICE,
        amount: DEFAULT_AMOUNT,
        unit: DEFAULT_UNIT,
        vendor: DEFAULT_VENDOR,
        expiryDate: null,
        detailedLocation: '',
        status: DEFAULT_STATUS,
        warningThreshold: DEFAULT_WARNING_THRESHOLD,
      };

      nameValueRef.current = '';
      priceValueRef.current = DEFAULT_PRICE;
      amountValueRef.current = DEFAULT_AMOUNT;
      unitValueRef.current = DEFAULT_UNIT;
      vendorValueRef.current = DEFAULT_VENDOR;
      detailedLocationValueRef.current = '';
      warningThresholdValueRef.current = DEFAULT_WARNING_THRESHOLD;

      setDefaultName('');
      setDefaultPrice(DEFAULT_PRICE);
      setDefaultAmount(DEFAULT_AMOUNT);
      setDefaultUnit(DEFAULT_UNIT);
      setDefaultVendor(DEFAULT_VENDOR);
      setDefaultDetailedLocation('');
      setDefaultWarningThreshold(DEFAULT_WARNING_THRESHOLD);
      setSelectedLocation(initialLocation ?? DEFAULT_LOCATION);
      setSelectedCategoryId(initialCategoryId);
      setExpiryDate(null);
      setSelectedStatusId(DEFAULT_STATUS);
    }
    setIsPiggyMode(false);
    setFormKey((prev) => prev + 1);
  }, [mode, initialData, initialLocation, initialCategoryId]);

  // --- Public API --------------------------------------------------------

  return {
    // Refs
    nameInputRef,
    priceInputRef,
    amountInputRef,
    unitInputRef,
    vendorInputRef,
    detailedLocationInputRef,
    warningThresholdInputRef,
    // Default values (for uncontrolled inputs)
    defaultName,
    defaultPrice,
    defaultAmount,
    defaultUnit,
    defaultVendor,
    defaultDetailedLocation,
    defaultWarningThreshold,
    // State
    selectedLocation,
    selectedCategoryId,
    expiryDate,
    selectedStatusId,
    formKey,
    isPiggyMode,
    // Setters
    setSelectedLocation,
    setSelectedCategoryId,
    setExpiryDate,
    setSelectedStatusId,
    // Methods
    getIsFormValid,
    getFormValues,
    isFormDirty,
    resetForm,
    // Input handlers — name
    handleNameChangeText,
    handleNameBlur,
    // Input handlers — batch fields
    handlePriceChange,
    handlePriceBlur,
    handleAmountChange,
    handleAmountBlur,
    handleUnitChange,
    handleUnitBlur,
    handleVendorChange,
    handleVendorBlur,
    // Input handlers — advanced fields
    handleDetailedLocationChange,
    handleDetailedLocationBlur,
    handleWarningThresholdChange,
    handleWarningThresholdBlur,
  };
};
