import React from 'react';
import { TextInput } from 'react-native';
import styled from 'styled-components/native';
import { useTheme } from '../../../theme/ThemeProvider';
import type { StyledProps } from '../../../utils/styledComponents';
import { FormSection, UncontrolledInput } from '../../atoms';
import {
  LocationSelector,
  CategorySelector,
  BatchDetailsFormSection,
  DatePicker,
  StatusFormSelector,
  CollapsibleSection,
} from '../../molecules';

// ---------------------------------------------------------------------------
// Styled helpers
// ---------------------------------------------------------------------------

const FormContainer = styled.View<{ gapSize: 'xs' | 'sm' }>`
  flex-direction: column;
  gap: ${({ theme, gapSize }: StyledProps & { gapSize: 'xs' | 'sm' }) =>
    theme.spacing[gapSize]}px;
`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ItemFormFieldsBaseProps {
  // Form state
  selectedLocation: string;
  selectedCategoryId: string | null;
  selectedStatusId: string;
  formKey: number;
  // Input refs
  nameInputRef: React.RefObject<TextInput | null>;
  detailedLocationInputRef: React.RefObject<TextInput | null>;
  warningThresholdInputRef: React.RefObject<TextInput | null>;
  // Default values for uncontrolled inputs
  defaultName: string;
  defaultDetailedLocation: string;
  defaultWarningThreshold: string;
  // Handlers — selectors
  onLocationSelect: (location: string) => void;
  onCategorySelect: (categoryId: string | null) => void;
  onStatusSelect: (statusId: string) => void;
  // Handlers — text inputs
  onNameChangeText: (text: string) => void;
  onNameBlur: () => void;
  onDetailedLocationChange: (text: string) => void;
  onDetailedLocationBlur: () => void;
  onWarningThresholdChange: (text: string) => void;
  onWarningThresholdBlur: () => void;
  onOpeningNestedModal?: (isOpening: boolean) => void;
  // Translations
  translations: {
    fields: {
      name: string;
      location: string;
      category: string;
      expiryDate?: string;
      advanced: string;
      detailedLocation: string;
      status: string;
      warningThreshold: string;
    };
    placeholders: {
      name: string;
      detailedLocation: string;
      warningThreshold: string;
    };
  };
}

export interface ItemFormFieldsCreateProps extends ItemFormFieldsBaseProps {
  mode: 'create';
  // Input refs — batch
  priceInputRef: React.RefObject<TextInput | null>;
  amountInputRef: React.RefObject<TextInput | null>;
  unitInputRef: React.RefObject<TextInput | null>;
  vendorInputRef: React.RefObject<TextInput | null>;
  // Default values for uncontrolled batch inputs
  defaultPrice: string;
  defaultAmount: string;
  defaultUnit: string;
  defaultVendor: string;
  // Handlers — batch
  onPriceChange: (text: string) => void;
  onPriceBlur: () => void;
  onAmountChange: (text: string) => void;
  onAmountBlur: () => void;
  onUnitChange: (text: string) => void;
  onUnitBlur: () => void;
  onVendorChange: (text: string) => void;
  onVendorBlur: () => void;
  // Expiry date
  expiryDate: Date | null;
  onExpiryDateChange: (date: Date | null) => void;
}

export interface ItemFormFieldsEditProps extends ItemFormFieldsBaseProps {
  mode: 'edit';
}

export type ItemFormFieldsProps =
  | ItemFormFieldsCreateProps
  | ItemFormFieldsEditProps;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Mode-aware form fields for the item form bottom sheet.
 *
 * Create mode (compact sections, xs gap):
 *  1. Name
 *  2. Location
 *  3. Category
 *  4. Batch details (price, amount, unit, vendor)
 *  5. Expiry date
 *  6. Advanced (collapsible): detailed location, status, warning threshold
 *
 * Edit mode (regular sections, sm gap):
 *  1. Name
 *  2. Location
 *  3. Category
 *  4. Advanced (collapsible): detailed location, status, warning threshold
 *
 * Batch details and expiry are create-only — edit manages batches separately.
 */
export const ItemFormFields: React.FC<ItemFormFieldsProps> = (props) => {
  const theme = useTheme();
  const isCreate = props.mode === 'create';
  const compact = isCreate;
  const gapSize = isCreate ? 'xs' : 'sm';
  const { translations } = props;

  return (
    <FormContainer key={props.formKey} gapSize={gapSize}>
      {/* Row 1 — Name */}
      <FormSection compact={compact} label={translations.fields.name}>
        <UncontrolledInput
          ref={props.nameInputRef}
          defaultValue={props.defaultName}
          onChangeText={props.onNameChangeText}
          onBlur={props.onNameBlur}
          placeholder={translations.placeholders.name}
          placeholderTextColor={theme.colors.textLight}
        />
      </FormSection>

      {/* Row 2 — Location */}
      <FormSection compact={compact} label={translations.fields.location}>
        <LocationSelector
          selectedLocationId={props.selectedLocation}
          onSelect={(id: string | null) => id && props.onLocationSelect(id)}
          showAllOption={false}
          edgeToEdge={true}
          onOpeningNestedModal={props.onOpeningNestedModal}
        />
      </FormSection>

      {/* Row 3 — Category (edit mode: reduced bottom margin so spacing above
          More Options matches below) */}
      <FormSection
        compact={compact}
        label={translations.fields.category}
        style={!isCreate ? { marginBottom: theme.spacing.sm } : undefined}
      >
        <CategorySelector
          selectedCategoryId={props.selectedCategoryId}
          onSelect={props.onCategorySelect}
          onOpeningNestedModal={props.onOpeningNestedModal}
          autoSelectFirst={true}
          edgeToEdge={true}
        />
      </FormSection>

      {props.mode === 'create' && (
        <>
          {/* Row 4 — Batch Details (price, amount, unit, vendor) */}
          <BatchDetailsFormSection
            compact
            defaultPrice={props.defaultPrice}
            defaultAmount={props.defaultAmount}
            defaultUnit={props.defaultUnit}
            defaultVendor={props.defaultVendor}
            priceInputRef={props.priceInputRef}
            amountInputRef={props.amountInputRef}
            unitInputRef={props.unitInputRef}
            vendorInputRef={props.vendorInputRef}
            onPriceChange={props.onPriceChange}
            onAmountChange={props.onAmountChange}
            onUnitChange={props.onUnitChange}
            onVendorChange={props.onVendorChange}
            onPriceBlur={props.onPriceBlur}
            onAmountBlur={props.onAmountBlur}
            onUnitBlur={props.onUnitBlur}
            onVendorBlur={props.onVendorBlur}
          />

          {/* Row 5 — Expiry Date (reduced bottom margin so spacing above More
              Options matches below) */}
          <FormSection
            compact
            label={translations.fields.expiryDate}
            style={{ marginBottom: theme.spacing.sm }}
          >
            <DatePicker
              value={props.expiryDate}
              onChange={props.onExpiryDateChange}
              minimumDate={new Date()}
            />
          </FormSection>
        </>
      )}

      {/* Advanced Section */}
      <CollapsibleSection title={translations.fields.advanced}>
        <FormContainer gapSize={gapSize}>
          <FormSection compact={compact} label={translations.fields.detailedLocation}>
            <UncontrolledInput
              ref={props.detailedLocationInputRef}
              defaultValue={props.defaultDetailedLocation}
              onChangeText={props.onDetailedLocationChange}
              onBlur={props.onDetailedLocationBlur}
              placeholder={translations.placeholders.detailedLocation}
              placeholderTextColor={theme.colors.textLight}
            />
          </FormSection>

          <FormSection compact={compact} label={translations.fields.status}>
            <StatusFormSelector
              selectedStatusId={props.selectedStatusId}
              onSelect={props.onStatusSelect}
            />
          </FormSection>

          <FormSection compact={compact} label={translations.fields.warningThreshold}>
            <UncontrolledInput
              ref={props.warningThresholdInputRef}
              defaultValue={props.defaultWarningThreshold}
              onChangeText={props.onWarningThresholdChange}
              onBlur={props.onWarningThresholdBlur}
              placeholder={translations.placeholders.warningThreshold}
              placeholderTextColor={theme.colors.textLight}
              keyboardType="numeric"
            />
          </FormSection>
        </FormContainer>
      </CollapsibleSection>
    </FormContainer>
  );
};
