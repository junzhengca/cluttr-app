import React from 'react';
import { View, Text } from 'react-native';
import styled from 'styled-components/native';
import { useTranslation } from 'react-i18next';
import { InventoryItem } from '../../types/inventory';
import {
  BatchItemCard,
  SwipeableRow,
  Button,
  ContextMenu,
} from '../../components';
import type { StyledProps } from '../../utils/styledComponents';

const EmptyBatchText = styled(Text)`
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.sm}px;
  color: ${({ theme }: StyledProps) => theme.colors.textLight};
  text-align: center;
  padding: ${({ theme }: StyledProps) => theme.spacing.xl}px;
  font-style: italic;
`;

const Section = styled(View)`
  margin-top: ${({ theme }: StyledProps) => theme.spacing.sm}px;
  margin-bottom: ${({ theme }: StyledProps) => theme.spacing.md}px;
`;

const SectionTitle = styled(Text)`
  font-size: 15px;
  font-weight: 700;
  color: ${({ theme }: StyledProps) => theme.colors.text};
  margin-bottom: 12px;
  margin-left: 4px;
`;

interface BatchListSectionProps {
  item: InventoryItem;
  currencySymbol: string;
  onAddBatch: () => void;
  onEditBatch: (batchId: string) => void;
  onDeleteBatch: (batchId: string) => void;
}

export const BatchListSection: React.FC<BatchListSectionProps> = ({
  item,
  currencySymbol,
  onAddBatch,
  onEditBatch,
  onDeleteBatch,
}) => {
  const { t } = useTranslation();

  return (
    <Section>
      <SectionTitle>{t('itemDetails.sections.batches')}</SectionTitle>
      <View style={{ marginBottom: 12 }}>
        <Button
          label={t('itemDetails.batch.addBatch')}
          onPress={onAddBatch}
          variant="secondary"
          icon="add"
        />
      </View>
      {(item.batches || []).length > 0 ? (
        (item.batches || []).map((batch, index) => {
          const batchMenuOptions = [
            {
              id: 'edit',
              label: t('itemDetails.actions.modify'),
              icon: 'pencil-outline',
              onPress: () => {
                if (batch.id) {
                  onEditBatch(batch.id);
                }
              },
            },
            {
              id: 'delete',
              label: t('itemDetails.actions.delete'),
              icon: 'trash-can-outline',
              onPress: () => {
                if (batch.id) {
                  onDeleteBatch(batch.id);
                }
              },
              isDestructive: true,
            },
          ];

          return (
            <SwipeableRow
              key={batch.id || index}
              onEdit={() => {
                if (batch.id) {
                  onEditBatch(batch.id);
                }
              }}
              onDelete={() => {
                if (batch.id) {
                  onDeleteBatch(batch.id);
                }
              }}
              editLabel={t('itemDetails.actions.modify')}
              deleteLabel={t('itemDetails.actions.delete')}
              style={{ marginBottom: 12 }}
            >
              <ContextMenu items={batchMenuOptions}>
                <BatchItemCard batch={batch} currencySymbol={currencySymbol} />
              </ContextMenu>
            </SwipeableRow>
          );
        })
      ) : (
        <EmptyBatchText>{t('itemDetails.noBatches')}</EmptyBatchText>
      )}
    </Section>
  );
};
