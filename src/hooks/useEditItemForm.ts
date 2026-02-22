import { useRef, useCallback, useEffect, useState } from 'react';
import { TextInput } from 'react-native';
import type { InventoryItem } from '../types/inventory';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EditItemFormValues {
    name: string;
    location: string;
    categoryId: string | null;
    // Advanced fields
    detailedLocation: string;
    status: string;
    warningThreshold: string;
}

export interface UseEditItemFormOptions {
    initialData?: Partial<InventoryItem> | null;
    onFormValidChange?: (isValid: boolean) => void;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_LOCATION = '';
const DEFAULT_STATUS = 'using';
const DEFAULT_WARNING_THRESHOLD = '';

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Dedicated form hook for the **edit item** bottom sheet.
 *
 * Manages:
 *  1. name       – uncontrolled text input (ref-based)
 *  2. location   – selector state
 *  3. categoryId – selector state
 *  4. detailedLocation - uncontrolled text input
 *  5. status     - selector state
 *  6. warningThreshold - uncontrolled numeric input
 *
 * Modeled after `useCreateItemForm` but for editing existing items.
 * Does NOT include batch-related fields (price, amount, unit, vendor, expiry).
 */
export const useEditItemForm = (options: UseEditItemFormOptions = {}) => {
    const {
        initialData,
        onFormValidChange,
    } = options;

    // --- Refs (uncontrolled inputs) ----------------------------------------

    const nameInputRef = useRef<TextInput>(null);
    const nameValueRef = useRef('');

    const detailedLocationInputRef = useRef<TextInput>(null);
    const detailedLocationValueRef = useRef('');

    const warningThresholdInputRef = useRef<TextInput>(null);
    const warningThresholdValueRef = useRef(DEFAULT_WARNING_THRESHOLD);

    // --- Initial values (for dirty-state tracking) -------------------------

    const initialValuesRef = useRef({
        name: '',
        location: DEFAULT_LOCATION,
        categoryId: null as string | null,
        detailedLocation: '',
        status: DEFAULT_STATUS,
        warningThreshold: DEFAULT_WARNING_THRESHOLD,
    });

    // --- State -------------------------------------------------------------

    const [defaultName, setDefaultName] = useState('');
    const [defaultDetailedLocation, setDefaultDetailedLocation] = useState('');
    const [defaultWarningThreshold, setDefaultWarningThreshold] = useState(DEFAULT_WARNING_THRESHOLD);

    const [selectedLocation, setSelectedLocation] = useState(DEFAULT_LOCATION);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [selectedStatusId, setSelectedStatusId] = useState(DEFAULT_STATUS);
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

    // --- Initialization ----------------------------------------------------

    useEffect(() => {
        if (initialData) {
            const name = initialData.name ?? '';
            const location = initialData.location ?? DEFAULT_LOCATION;
            const categoryId = initialData.categoryId ?? null;
            const detailedLocation = initialData.detailedLocation ?? '';
            const status = initialData.status ?? DEFAULT_STATUS;
            const warningThreshold = initialData.warningThreshold?.toString() ?? DEFAULT_WARNING_THRESHOLD;

            initialValuesRef.current = {
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
    }, [initialData]);

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
        (): EditItemFormValues => ({
            name: nameValueRef.current,
            location: selectedLocation,
            categoryId: selectedCategoryId,
            detailedLocation: detailedLocationValueRef.current,
            status: selectedStatusId,
            warningThreshold: warningThresholdValueRef.current,
        }),
        [selectedLocation, selectedCategoryId, selectedStatusId],
    );

    const isFormDirty = useCallback((): boolean => {
        const initial = initialValuesRef.current;
        return (
            nameValueRef.current !== initial.name ||
            selectedLocation !== initial.location ||
            selectedCategoryId !== initial.categoryId ||
            detailedLocationValueRef.current !== initial.detailedLocation ||
            selectedStatusId !== initial.status ||
            warningThresholdValueRef.current !== initial.warningThreshold
        );
    }, [selectedLocation, selectedCategoryId, selectedStatusId]);

    const resetForm = useCallback(() => {
        if (initialData) {
            // Re-populate from initialData
            const name = initialData.name ?? '';
            const location = initialData.location ?? DEFAULT_LOCATION;
            const categoryId = initialData.categoryId ?? null;
            const detailedLocation = initialData.detailedLocation ?? '';
            const status = initialData.status ?? DEFAULT_STATUS;
            const warningThreshold = initialData.warningThreshold?.toString() ?? DEFAULT_WARNING_THRESHOLD;

            initialValuesRef.current = {
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
            // Reset to defaults
            initialValuesRef.current = {
                name: '',
                location: DEFAULT_LOCATION,
                categoryId: null,
                detailedLocation: '',
                status: DEFAULT_STATUS,
                warningThreshold: DEFAULT_WARNING_THRESHOLD,
            };

            nameValueRef.current = '';
            detailedLocationValueRef.current = '';
            warningThresholdValueRef.current = DEFAULT_WARNING_THRESHOLD;

            setDefaultName('');
            setDefaultDetailedLocation('');
            setDefaultWarningThreshold(DEFAULT_WARNING_THRESHOLD);

            setSelectedLocation(DEFAULT_LOCATION);
            setSelectedCategoryId(null);
            setSelectedStatusId(DEFAULT_STATUS);
        }
        setFormKey((prev) => prev + 1);
    }, [initialData]);

    // --- Public API --------------------------------------------------------

    return {
        // Refs
        nameInputRef,
        detailedLocationInputRef,
        warningThresholdInputRef,
        // Default values (for uncontrolled inputs)
        defaultName,
        defaultDetailedLocation,
        defaultWarningThreshold,
        // State
        selectedLocation,
        selectedCategoryId,
        selectedStatusId,
        formKey,
        // Setters
        setSelectedLocation,
        setSelectedCategoryId,
        setSelectedStatusId,
        // Methods
        getIsFormValid,
        getFormValues,
        isFormDirty,
        resetForm,
        // Input handlers — name
        handleNameChangeText,
        handleNameBlur,
        // Input handlers — advanced fields
        handleDetailedLocationChange,
        handleDetailedLocationBlur,
        handleWarningThresholdChange,
        handleWarningThresholdBlur,
    };
};
