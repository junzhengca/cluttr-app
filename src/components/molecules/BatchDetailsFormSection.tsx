import React from 'react';
import { TextInput } from 'react-native';
import styled from 'styled-components/native';
import { useTranslation } from 'react-i18next';

import type { StyledProps } from '../../utils/styledComponents';
import { useTheme } from '../../theme/ThemeProvider';
import { useSettings } from '../../store/hooks';
import { FormSection, UncontrolledInput, NumberInput } from '../atoms';
import { getCurrencySymbol } from './CurrencySelector';

// ---------------------------------------------------------------------------
// Styled helpers
// ---------------------------------------------------------------------------

const Row = styled.View`
  flex-direction: row;
  gap: ${({ theme }: StyledProps) => theme.spacing.sm}px;
`;

const PriceColumn = styled.View`
  flex: 1;
`;

const AmountColumn = styled.View`
  flex: 1;
`;

const SubLabel = styled.Text`
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.sm}px;
  font-weight: ${({ theme }: StyledProps) => theme.typography.fontWeight.medium};
  color: ${({ theme }: StyledProps) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }: StyledProps) => theme.spacing.xs}px;
`;

const UnitRow = styled.View`
  flex-direction: row;
  gap: ${({ theme }: StyledProps) => theme.spacing.sm}px;
  margin-top: ${({ theme }: StyledProps) => theme.spacing.sm}px;
`;

const UnitInputWrapper = styled.View`
  flex: 1;
`;

const VendorInputWrapper = styled.View`
  flex: 2;
`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BatchDetailsFormSectionProps {
    /** Default values for uncontrolled inputs (IME-safe) */
    defaultPrice: string;
    defaultAmount: string;
    defaultUnit: string;
    defaultVendor: string;
    /** Refs for each input */
    priceInputRef: React.RefObject<TextInput | null>;
    amountInputRef: React.RefObject<TextInput | null>;
    unitInputRef: React.RefObject<TextInput | null>;
    vendorInputRef: React.RefObject<TextInput | null>;
    /** Change handlers */
    onPriceChange: (text: string) => void;
    onAmountChange: (text: string) => void;
    onUnitChange: (text: string) => void;
    onVendorChange: (text: string) => void;
    /** Blur handlers */
    onPriceBlur: () => void;
    onAmountBlur: () => void;
    onUnitBlur: () => void;
    onVendorBlur: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Shared form section for item batch details.
 *
 * Layout (inspired by the reference design):
 * ┌──────────────────────────────────────────┐
 * │  Batch Details (section label)           │
 * │  ┌──────────────┐  ┌──────────────────┐  │
 * │  │ Price ($)     │  │ Amount  [- 1 +]  │  │
 * │  └──────────────┘  └──────────────────┘  │
 * │  ┌────────┐  ┌──────────────────────────┐│
 * │  │ Unit   │  │ Vendor                   ││
 * │  └────────┘  └──────────────────────────┘│
 * └──────────────────────────────────────────┘
 *
 * Reuses existing `NumberInput` (with +/- stepper) for the amount field
 * and `UncontrolledInput` for IME-safe text entry on all other fields.
 */
export const BatchDetailsFormSection: React.FC<BatchDetailsFormSectionProps> = ({
    defaultPrice,
    defaultAmount,
    defaultUnit,
    defaultVendor,
    priceInputRef,
    amountInputRef,
    unitInputRef,
    vendorInputRef,
    onPriceChange,
    onAmountChange,
    onUnitChange,
    onVendorChange,
    onPriceBlur,
    onAmountBlur,
    onUnitBlur,
    onVendorBlur,
}) => {
    const theme = useTheme();
    const { t } = useTranslation();
    const { settings } = useSettings();

    const currencySymbol = getCurrencySymbol(settings.currency);

    return (
        <FormSection label={t('createItem.batchSection')}>
            {/* Row 1 — Price + Amount */}
            <Row>
                <PriceColumn>
                    <SubLabel>
                        {t('createItem.fields.price')} ({currencySymbol})
                    </SubLabel>
                    <UncontrolledInput
                        ref={priceInputRef}
                        defaultValue={defaultPrice}
                        onChangeText={onPriceChange}
                        onBlur={onPriceBlur}
                        placeholder={t('createItem.placeholders.price')}
                        placeholderTextColor={theme.colors.textLight}
                        keyboardType="numeric"
                    />
                </PriceColumn>

                <AmountColumn>
                    <SubLabel>{t('createItem.fields.amount')}</SubLabel>
                    <NumberInput
                        ref={amountInputRef}
                        defaultValue={defaultAmount}
                        onChangeText={onAmountChange}
                        onBlur={onAmountBlur}
                        placeholder={t('createItem.placeholders.amount')}
                        placeholderTextColor={theme.colors.textLight}
                        keyboardType="numeric"
                        min={1}
                    />
                </AmountColumn>
            </Row>

            {/* Row 2 — Unit + Vendor */}
            <UnitRow>
                <UnitInputWrapper>
                    <SubLabel>{t('createItem.fields.unit')}</SubLabel>
                    <UncontrolledInput
                        ref={unitInputRef}
                        defaultValue={defaultUnit}
                        onChangeText={onUnitChange}
                        onBlur={onUnitBlur}
                        placeholder={t('createItem.placeholders.unit')}
                        placeholderTextColor={theme.colors.textLight}
                    />
                </UnitInputWrapper>

                <VendorInputWrapper>
                    <SubLabel>{t('createItem.fields.vendor')}</SubLabel>
                    <UncontrolledInput
                        ref={vendorInputRef}
                        defaultValue={defaultVendor}
                        onChangeText={onVendorChange}
                        onBlur={onVendorBlur}
                        placeholder={t('createItem.placeholders.vendor')}
                        placeholderTextColor={theme.colors.textLight}
                    />
                </VendorInputWrapper>
            </UnitRow>
        </FormSection>
    );
};
