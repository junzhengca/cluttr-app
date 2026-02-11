import { useRef, useCallback, useEffect, useState } from 'react';
import { TextInput } from 'react-native';
import { locations } from '../data/locations';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreateItemFormValues {
    name: string;
    location: string;
    categoryId: string | null;
    // Batch fields
    price: string;
    amount: string;
    unit: string;
    vendor: string;
    expiryDate: Date | null;
}

export interface UseCreateItemFormOptions {
    initialLocation?: string;
    initialCategoryId?: string | null;
    onFormValidChange?: (isValid: boolean) => void;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_LOCATION = locations.length > 0 ? locations[0].id : '';
const DEFAULT_PRICE = '';
const DEFAULT_AMOUNT = '1';
const DEFAULT_UNIT = '';
const DEFAULT_VENDOR = '';

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
 * Dedicated form hook for the **create item** bottom sheet.
 *
 * Manages:
 *  1. name       – uncontrolled text input (ref-based, IME-safe)
 *  2. location   – selector state
 *  3. categoryId – selector state
 *  4. price      – uncontrolled numeric input
 *  5. amount     – uncontrolled numeric input (stepper)
 *  6. unit       – uncontrolled text input
 *  7. vendor     – uncontrolled text input
 *
 * Intentionally separated from `useUncontrolledItemForm` so the create-item
 * form can evolve independently without affecting the edit-item form.
 */
export const useCreateItemForm = (options: UseCreateItemFormOptions = {}) => {
    const {
        initialLocation,
        initialCategoryId = null,
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
    });

    // --- State -------------------------------------------------------------

    const [defaultName, setDefaultName] = useState('');
    const [defaultPrice, setDefaultPrice] = useState(DEFAULT_PRICE);
    const [defaultAmount, setDefaultAmount] = useState(DEFAULT_AMOUNT);
    const [defaultUnit, setDefaultUnit] = useState(DEFAULT_UNIT);
    const [defaultVendor, setDefaultVendor] = useState(DEFAULT_VENDOR);

    const [selectedLocation, setSelectedLocation] = useState(
        initialLocation ?? DEFAULT_LOCATION,
    );
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
        initialCategoryId,
    );
    const [expiryDate, setExpiryDate] = useState<Date | null>(null);
    const [formKey, setFormKey] = useState(0);

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
    useEffect(() => {
        if (initialLocation !== undefined) {
            initialValuesRef.current.location = initialLocation;
            setSelectedLocation(initialLocation);
        }
    }, [initialLocation]);

    // --- Input handlers ----------------------------------------------------

    const handleNameChangeText = useCallback(
        (text: string) => {
            const wasValid = getIsFormValid();
            nameValueRef.current = text;
            const isValid = getIsFormValid();
            if (wasValid !== isValid) {
                onFormValidChange?.(isValid);
            }
        },
        [getIsFormValid, onFormValidChange],
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

    // --- Form helpers ------------------------------------------------------

    const getFormValues = useCallback(
        (): CreateItemFormValues => ({
            name: nameValueRef.current,
            location: selectedLocation,
            categoryId: selectedCategoryId,
            price: priceValueRef.current,
            amount: amountValueRef.current,
            unit: unitValueRef.current,
            vendor: vendorValueRef.current,
            expiryDate,
        }),
        [selectedLocation, selectedCategoryId, expiryDate],
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
            !datesEqual(expiryDate, initial.expiryDate)
        );
    }, [selectedLocation, selectedCategoryId, expiryDate]);

    const resetForm = useCallback(() => {
        initialValuesRef.current = {
            name: '',
            location: initialLocation ?? DEFAULT_LOCATION,
            categoryId: initialCategoryId,
            price: DEFAULT_PRICE,
            amount: DEFAULT_AMOUNT,
            unit: DEFAULT_UNIT,
            vendor: DEFAULT_VENDOR,
            expiryDate: null,
        };

        nameValueRef.current = '';
        priceValueRef.current = DEFAULT_PRICE;
        amountValueRef.current = DEFAULT_AMOUNT;
        unitValueRef.current = DEFAULT_UNIT;
        vendorValueRef.current = DEFAULT_VENDOR;

        setDefaultName('');
        setDefaultPrice(DEFAULT_PRICE);
        setDefaultAmount(DEFAULT_AMOUNT);
        setDefaultUnit(DEFAULT_UNIT);
        setDefaultVendor(DEFAULT_VENDOR);
        setSelectedLocation(initialLocation ?? DEFAULT_LOCATION);
        setSelectedCategoryId(initialCategoryId);
        setExpiryDate(null);
        setFormKey((prev) => prev + 1);
    }, [initialLocation, initialCategoryId]);

    // --- Public API --------------------------------------------------------

    return {
        // Refs
        nameInputRef,
        priceInputRef,
        amountInputRef,
        unitInputRef,
        vendorInputRef,
        // Default values (for uncontrolled inputs)
        defaultName,
        defaultPrice,
        defaultAmount,
        defaultUnit,
        defaultVendor,
        // State
        selectedLocation,
        selectedCategoryId,
        expiryDate,
        formKey,
        // Setters
        setSelectedLocation,
        setSelectedCategoryId,
        setExpiryDate,
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
    };
};
