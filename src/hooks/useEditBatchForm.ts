import { useRef, useCallback, useState, useEffect } from 'react';
import { TextInput } from 'react-native';
import type { ItemBatch } from '../types/inventory';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EditBatchFormValues {
    price: string;
    amount: string;
    unit: string;
    vendor: string;
    expiryDate: Date | null;
    note: string;
}

export interface UseEditBatchFormOptions {
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

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export const useEditBatchForm = (options: UseEditBatchFormOptions = {}) => {
    const { initialData, onFormValidChange } = options;

    // --- Refs (uncontrolled inputs) ----------------------------------------

    const priceInputRef = useRef<TextInput>(null);
    const priceValueRef = useRef('');

    const amountInputRef = useRef<TextInput>(null);
    const amountValueRef = useRef('');

    const unitInputRef = useRef<TextInput>(null);
    const unitValueRef = useRef('');

    const vendorInputRef = useRef<TextInput>(null);
    const vendorValueRef = useRef('');

    const noteInputRef = useRef<TextInput>(null);
    const noteValueRef = useRef('');

    // --- Initial values (for dirty-state tracking) -------------------------

    const initialValuesRef = useRef({
        price: DEFAULT_PRICE,
        amount: DEFAULT_AMOUNT,
        unit: DEFAULT_UNIT,
        vendor: DEFAULT_VENDOR,
        expiryDate: null as Date | null,
        note: DEFAULT_NOTE,
    });

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
        const amountStr = amountValueRef.current || '0';
        const amount = parseInt(amountStr, 10);
        return !isNaN(amount) && amount > 0;
    }, []);

    // Notify parent when form validity changes
    useEffect(() => {
        onFormValidChange?.(getIsFormValid());
    }, [getIsFormValid, onFormValidChange]);

    // --- Initialization ----------------------------------------------------

    useEffect(() => {
        if (initialData) {
            const price = initialData.price?.toString() ?? DEFAULT_PRICE;
            const amount = initialData.amount?.toString() ?? DEFAULT_AMOUNT;
            const unit = initialData.unit ?? DEFAULT_UNIT;
            const vendor = initialData.vendor ?? DEFAULT_VENDOR;
            const parsedExpiryDate = initialData.expiryDate ? new Date(initialData.expiryDate) : null;
            const note = initialData.note ?? DEFAULT_NOTE;

            initialValuesRef.current = {
                price,
                amount,
                unit,
                vendor,
                expiryDate: parsedExpiryDate,
                note,
            };

            priceValueRef.current = price;
            amountValueRef.current = amount;
            unitValueRef.current = unit;
            vendorValueRef.current = vendor;
            noteValueRef.current = note;

            setDefaultPrice(price);
            setDefaultAmount(amount);
            setDefaultUnit(unit);
            setDefaultVendor(vendor);
            setExpiryDate(parsedExpiryDate);
            setDefaultNote(note);

            setFormKey((prev) => prev + 1);
        }
    }, [initialData]);

    // --- Input handlers ----------------------------------------------------

    const handlePriceChange = useCallback((text: string) => {
        priceValueRef.current = text;
    }, []);
    const handlePriceBlur = useCallback(() => undefined, []);

    const handleAmountChange = useCallback((text: string) => {
        amountValueRef.current = text;
        onFormValidChange?.(getIsFormValid());
    }, [getIsFormValid, onFormValidChange]);
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
        (): EditBatchFormValues => ({
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
            expiryDate?.getTime() !== initial.expiryDate?.getTime() ||
            noteValueRef.current !== initial.note
        );
    }, [expiryDate]);

    const resetForm = useCallback(() => {
        if (initialData) {
            const price = initialData.price?.toString() ?? DEFAULT_PRICE;
            const amount = initialData.amount?.toString() ?? DEFAULT_AMOUNT;
            const unit = initialData.unit ?? DEFAULT_UNIT;
            const vendor = initialData.vendor ?? DEFAULT_VENDOR;
            const parsedExpiryDate = initialData.expiryDate ? new Date(initialData.expiryDate) : null;
            const note = initialData.note ?? DEFAULT_NOTE;

            initialValuesRef.current = {
                price,
                amount,
                unit,
                vendor,
                expiryDate: parsedExpiryDate,
                note,
            };

            priceValueRef.current = price;
            amountValueRef.current = amount;
            unitValueRef.current = unit;
            vendorValueRef.current = vendor;
            noteValueRef.current = note;

            setDefaultPrice(price);
            setDefaultAmount(amount);
            setDefaultUnit(unit);
            setDefaultVendor(vendor);
            setExpiryDate(parsedExpiryDate);
            setDefaultNote(note);
        } else {
            initialValuesRef.current = {
                price: DEFAULT_PRICE,
                amount: DEFAULT_AMOUNT,
                unit: DEFAULT_UNIT,
                vendor: DEFAULT_VENDOR,
                expiryDate: null,
                note: DEFAULT_NOTE,
            };

            priceValueRef.current = DEFAULT_PRICE;
            amountValueRef.current = DEFAULT_AMOUNT;
            unitValueRef.current = DEFAULT_UNIT;
            vendorValueRef.current = DEFAULT_VENDOR;
            noteValueRef.current = DEFAULT_NOTE;

            setDefaultPrice(DEFAULT_PRICE);
            setDefaultAmount(DEFAULT_AMOUNT);
            setDefaultUnit(DEFAULT_UNIT);
            setDefaultVendor(DEFAULT_VENDOR);
            setExpiryDate(null);
            setDefaultNote(DEFAULT_NOTE);
        }
        setFormKey((prev) => prev + 1);
    }, [initialData]);

    // --- Public API --------------------------------------------------------

    return {
        // Refs
        priceInputRef,
        amountInputRef,
        unitInputRef,
        vendorInputRef,
        noteInputRef,
        // Default values
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
