import { useRef, useCallback, useState, useEffect } from 'react';
import { TextInput } from 'react-native';
import type { ItemBatch } from '../types/inventory';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BatchFormMode = 'add' | 'edit';

export interface BatchFormValues {
  price: string;
  amount: string;
  unit: string;
  vendor: string;
  expiryDate: Date | null;
  note: string;
}

export interface UseBatchFormOptions {
  mode: BatchFormMode;
  /** Edit mode: the batch being edited; populates the form when set. */
  initialData?: ItemBatch | null;
  onFormValidChange?: (isValid: boolean) => void;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_PRICE = '';
const DEFAULT_AMOUNT = '1';
const DEFAULT_UNIT = 'pcs';
const DEFAULT_VENDOR = '';
const DEFAULT_NOTE = '';

interface BatchValueSet {
  price: string;
  amount: string;
  unit: string;
  vendor: string;
  expiryDate: Date | null;
  note: string;
}

const defaultValues = (): BatchValueSet => ({
  price: DEFAULT_PRICE,
  amount: DEFAULT_AMOUNT,
  unit: DEFAULT_UNIT,
  vendor: DEFAULT_VENDOR,
  expiryDate: null,
  note: DEFAULT_NOTE,
});

const valuesFromBatch = (batch: ItemBatch): BatchValueSet => ({
  price: batch.price?.toString() ?? DEFAULT_PRICE,
  amount: batch.amount?.toString() ?? DEFAULT_AMOUNT,
  unit: batch.unit ?? DEFAULT_UNIT,
  vendor: batch.vendor ?? DEFAULT_VENDOR,
  expiryDate: batch.expiryDate ? new Date(batch.expiryDate) : null,
  note: batch.note ?? DEFAULT_NOTE,
});

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
 * Unified form hook for the batch form bottom sheet (add + edit modes),
 * consolidated from the former separate add/edit batch form hooks.
 *
 * Shared core (both modes):
 *  - price / amount / unit / vendor / note – uncontrolled text inputs
 *    (ref-based, IME-safe)
 *  - expiryDate                            – date picker state
 *  - validity = amount parses to a positive integer
 *
 * Edit-only extension:
 *  - `initialData` population effect (re-keys the form on each new batch)
 *  - dirty check / reset are relative to the populated batch values
 *
 * Uses the dual-state IME pattern: values live in refs (updated on
 * onChangeText), `default*` state feeds `defaultValue`, and `formKey`
 * remounts inputs on reset.
 */
export const useBatchForm = (options: UseBatchFormOptions) => {
  const { mode, initialData, onFormValidChange } = options;

  // --- Refs (uncontrolled inputs) ----------------------------------------
  // Add mode starts at the defaults; edit mode starts empty until
  // `initialData` populates the form (matches the source hooks).

  const priceInputRef = useRef<TextInput>(null);
  const priceValueRef = useRef(mode === 'add' ? DEFAULT_PRICE : '');

  const amountInputRef = useRef<TextInput>(null);
  const amountValueRef = useRef(mode === 'add' ? DEFAULT_AMOUNT : '');

  const unitInputRef = useRef<TextInput>(null);
  const unitValueRef = useRef(mode === 'add' ? DEFAULT_UNIT : '');

  const vendorInputRef = useRef<TextInput>(null);
  const vendorValueRef = useRef(mode === 'add' ? DEFAULT_VENDOR : '');

  const noteInputRef = useRef<TextInput>(null);
  const noteValueRef = useRef(mode === 'add' ? DEFAULT_NOTE : '');

  // --- Initial values (for dirty-state tracking) -------------------------

  const initialValuesRef = useRef<BatchValueSet>(defaultValues());

  // --- State -------------------------------------------------------------

  const [defaultPrice, setDefaultPrice] = useState(DEFAULT_PRICE);
  const [defaultAmount, setDefaultAmount] = useState(DEFAULT_AMOUNT);
  const [defaultUnit, setDefaultUnit] = useState(DEFAULT_UNIT);
  const [defaultVendor, setDefaultVendor] = useState(DEFAULT_VENDOR);
  const [defaultNote, setDefaultNote] = useState(DEFAULT_NOTE);

  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [formKey, setFormKey] = useState(0);

  // --- Validation --------------------------------------------------------

  const getIsFormValid = useCallback(() => {
    // Basic validation: amount must be > 0
    const amount = parseInt(amountValueRef.current || '0', 10);
    return !isNaN(amount) && amount > 0;
  }, []);

  // Notify parent when form validity changes
  useEffect(() => {
    onFormValidChange?.(getIsFormValid());
  }, [getIsFormValid, onFormValidChange]);

  // --- Apply a value set to refs + state -----------------------------------

  const applyValues = useCallback((values: BatchValueSet) => {
    initialValuesRef.current = values;

    priceValueRef.current = values.price;
    amountValueRef.current = values.amount;
    unitValueRef.current = values.unit;
    vendorValueRef.current = values.vendor;
    noteValueRef.current = values.note;

    setDefaultPrice(values.price);
    setDefaultAmount(values.amount);
    setDefaultUnit(values.unit);
    setDefaultVendor(values.vendor);
    setExpiryDate(values.expiryDate);
    setDefaultNote(values.note);
  }, []);

  // --- Edit-mode initialization (populate from initialData) ---------------

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      applyValues(valuesFromBatch(initialData));
      setFormKey((prev) => prev + 1);
    }
  }, [mode, initialData, applyValues]);

  // --- Input handlers ----------------------------------------------------

  const handlePriceChange = useCallback((text: string) => {
    priceValueRef.current = text;
  }, []);
  const handlePriceBlur = useCallback(() => undefined, []);

  const handleAmountChange = useCallback(
    (text: string) => {
      amountValueRef.current = text;
      onFormValidChange?.(getIsFormValid());
    },
    [getIsFormValid, onFormValidChange]
  );
  const handleAmountBlur = useCallback(() => undefined, []);

  const handleUnitChange = useCallback((text: string) => {
    unitValueRef.current = text;
  }, []);
  const handleUnitBlur = useCallback(() => undefined, []);

  const handleVendorChange = useCallback((text: string) => {
    vendorValueRef.current = text;
  }, []);
  const handleVendorBlur = useCallback(() => undefined, []);

  const handleNoteChange = useCallback((text: string) => {
    noteValueRef.current = text;
  }, []);
  const handleNoteBlur = useCallback(() => undefined, []);

  // --- Form helpers ------------------------------------------------------

  const getFormValues = useCallback(
    (): BatchFormValues => ({
      price: priceValueRef.current,
      amount: amountValueRef.current,
      unit: unitValueRef.current,
      vendor: vendorValueRef.current,
      expiryDate,
      note: noteValueRef.current,
    }),
    [expiryDate]
  );

  const isFormDirty = useCallback((): boolean => {
    const initial = initialValuesRef.current;
    return (
      priceValueRef.current !== initial.price ||
      amountValueRef.current !== initial.amount ||
      unitValueRef.current !== initial.unit ||
      vendorValueRef.current !== initial.vendor ||
      !datesEqual(expiryDate, initial.expiryDate) ||
      noteValueRef.current !== initial.note
    );
  }, [expiryDate]);

  const resetForm = useCallback(() => {
    if (mode === 'edit' && initialData) {
      // Re-populate from initialData
      applyValues(valuesFromBatch(initialData));
    } else {
      // Reset to defaults (add mode, or edit mode with no batch loaded)
      applyValues(defaultValues());
    }
    setFormKey((prev) => prev + 1);
  }, [mode, initialData, applyValues]);

  // --- Public API --------------------------------------------------------

  return {
    // Refs
    priceInputRef,
    amountInputRef,
    unitInputRef,
    vendorInputRef,
    noteInputRef,
    // Default values (for uncontrolled inputs)
    defaultPrice,
    defaultAmount,
    defaultUnit,
    defaultVendor,
    defaultNote,
    // State
    expiryDate,
    formKey,
    // Setters
    setExpiryDate,
    // Methods
    getIsFormValid,
    getFormValues,
    isFormDirty,
    resetForm,
    // Handlers
    handlePriceChange,
    handlePriceBlur,
    handleAmountChange,
    handleAmountBlur,
    handleUnitChange,
    handleUnitBlur,
    handleVendorChange,
    handleVendorBlur,
    handleNoteChange,
    handleNoteBlur,
  };
};
