import React from 'react';
import { TouchableOpacity, ScrollView, View, Text } from 'react-native';
import styled, { useTheme } from 'styled-components/native';
import { useTranslation } from 'react-i18next';
import type { StyledProps, StyledPropsWith } from '../../utils/styledComponents';
import type { Theme } from '../../theme/types';
import { SectionTitle } from '../atoms';

export type CurrencyOption = {
  id: string;
  symbol: string;
  code: string;
  label: string;
};

export interface CurrencySelectorProps {
  selectedCurrencyId?: string;
  onCurrencySelect?: (currencyId: string) => void;
}

const Container = styled(View)`
  margin-bottom: ${({ theme }: StyledProps) => theme.spacing.xl}px;
`;

/**
 * Container with negative horizontal margins to enable edge-to-edge scrolling.
 * The ScrollView's contentContainerStyle adds horizontal padding to restore
 * proper spacing while allowing content to scroll to the screen edges.
 */
const ScrollContainer = styled(View)<{ horizontalPadding: number }>`
  margin-horizontal: -${({ horizontalPadding }: { horizontalPadding: number }) => horizontalPadding}px;
`;

const OptionsScroll = styled(ScrollView)`
  flex-direction: row;
`;

const OptionsContainer = styled(View)`
  flex-direction: row;
  justify-content: flex-start;
  gap: ${({ theme }: StyledProps) => theme.spacing.md}px;
`;

const CurrencyButton = styled(TouchableOpacity) <{ isSelected: boolean }>`
  width: 50px;
  height: 50px;
  border-radius: 25px;
  background-color: ${({ theme }: StyledProps) => theme.colors.surface};
  border-width: 2px;
  border-color: ${({ theme, isSelected }: StyledPropsWith<{ isSelected: boolean }>) =>
    isSelected ? theme.colors.primary : theme.colors.borderLight};
  align-items: center;
  justify-content: center;
`;

const CurrencyButtonText = styled(Text) <{ isSelected: boolean }>`
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.lg}px;
  font-weight: ${({ theme, isSelected }: StyledPropsWith<{ isSelected: boolean }>) =>
    isSelected ? theme.typography.fontWeight.bold : theme.typography.fontWeight.bold};
  color: ${({ theme, isSelected }: StyledPropsWith<{ isSelected: boolean }>) =>
    isSelected ? theme.colors.primary : theme.colors.textLight};
`;

export const defaultCurrencies: CurrencyOption[] = [
  { id: 'usd', symbol: '$', code: 'USD', label: '$ USD' },
  { id: 'eur', symbol: '€', code: 'EUR', label: '€ EUR' },
  { id: 'jpy', symbol: '¥', code: 'JPY', label: '¥ JPY' },
  { id: 'gbp', symbol: '£', code: 'GBP', label: '£ GBP' },
  { id: 'cny', symbol: '¥', code: 'CNY', label: '¥ CNY' },
  { id: 'aud', symbol: '$', code: 'AUD', label: '$ AUD' },
  { id: 'cad', symbol: '$', code: 'CAD', label: '$ CAD' },
  { id: 'chf', symbol: 'Fr', code: 'CHF', label: 'Fr CHF' },
  { id: 'hkd', symbol: '$', code: 'HKD', label: '$ HKD' },
  { id: 'sgd', symbol: '$', code: 'SGD', label: '$ SGD' },
  { id: 'krw', symbol: '₩', code: 'KRW', label: '₩ KRW' },
  { id: 'inr', symbol: '₹', code: 'INR', label: '₹ INR' },
  { id: 'brl', symbol: 'R$', code: 'BRL', label: 'R$ BRL' },
  { id: 'mxn', symbol: '$', code: 'MXN', label: '$ MXN' },
];

/**
 * Get currency symbol by currency ID
 * @param currencyId - The currency ID (e.g., 'cny', 'usd', 'eur', 'gbp')
 * @returns The currency symbol (e.g., '¥', '$', '€', '£') or '$' as default
 */
export const getCurrencySymbol = (currencyId: string): string => {
  const currency = defaultCurrencies.find((c) => c.id === currencyId);
  return currency?.symbol || '$';
};

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  selectedCurrencyId = 'usd',
  onCurrencySelect,
}) => {
  const { t } = useTranslation();
  const theme = useTheme() as Theme;

  // Filter defaultCurrencies to get unique symbols
  const uniqueCurrencies = React.useMemo(() => {
    const seenSymbols = new Set<string>();
    return defaultCurrencies.filter((currency) => {
      if (seenSymbols.has(currency.symbol)) {
        return false;
      }
      seenSymbols.add(currency.symbol);
      return true;
    });
  }, []);

  const horizontalPadding = theme.spacing.md;

  const scrollContentStyle = {
    paddingLeft: horizontalPadding,
    paddingRight: horizontalPadding,
  };

  return (
    <Container>
      <SectionTitle title={t('settings.currency')} iconText="$" />
      <ScrollContainer horizontalPadding={horizontalPadding}>
        <OptionsScroll
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={scrollContentStyle}
        >
          <OptionsContainer>
            {uniqueCurrencies.map((currency) => {
              const isSelected = getCurrencySymbol(selectedCurrencyId) === currency.symbol;
              return (
                <CurrencyButton
                  key={currency.symbol}
                  isSelected={isSelected}
                  onPress={() => onCurrencySelect?.(currency.id)}
                  activeOpacity={0.7}
                >
                  <CurrencyButtonText isSelected={isSelected}>
                    {currency.symbol}
                  </CurrencyButtonText>
                </CurrencyButton>
              );
            })}
          </OptionsContainer>
        </OptionsScroll>
      </ScrollContainer>
    </Container>
  );
};

