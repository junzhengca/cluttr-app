import React from 'react';
import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import styled from 'styled-components/native';
import { useTranslation } from 'react-i18next';
import type { StyledProps } from '../../utils/styledComponents';
import { Member } from '../../types/user';
import { SwipeableRow } from './SwipeableRow';

const CardWrapper = styled(View)<{ noMarginBottom?: boolean }>`
  margin-bottom: ${({
    theme,
    noMarginBottom,
  }: StyledProps & { noMarginBottom?: boolean }) =>
    noMarginBottom ? 0 : theme.spacing.lg}px;
`;

const CardContent = styled(View)`
  flex-direction: row;
  align-items: center;
  width: 100%;
`;

const AvatarContainer = styled(View)`
  width: 36px;
  height: 36px;
  border-radius: 12px;
  overflow: hidden;
  margin-right: ${({ theme }: StyledProps) => theme.spacing.md}px;
  background-color: ${({ theme }: StyledProps) => theme.colors.primaryLight};
  align-items: center;
  justify-content: center;
`;

const AvatarImage = styled(Image)`
  width: 100%;
  height: 100%;
`;

const AvatarPlaceholder = styled(View)`
  width: 100%;
  height: 100%;
  background-color: ${({ theme }: StyledProps) => theme.colors.primaryLight};
  align-items: center;
  justify-content: center;
`;

const InfoContainer = styled(View)`
  flex: 1;
`;

const NameRow = styled(View)`
  flex-direction: row;
  align-items: center;
  margin-bottom: ${({ theme }: StyledProps) => theme.spacing.xs}px;
`;

const MemberName = styled(Text)`
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.md}px;
  font-weight: ${({ theme }: StyledProps) => theme.typography.fontWeight.bold};
  color: ${({ theme }: StyledProps) => theme.colors.text};
  margin-right: ${({ theme }: StyledProps) => theme.spacing.sm}px;
`;

const OwnerBadge = styled(Text)`
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.sm}px;
  color: ${({ theme }: StyledProps) => theme.colors.textSecondary};
`;

export interface MemberCardProps {
  member: Member;
  isOwner?: boolean;
  onRemove?: (memberId: string) => void;
  /** Omit bottom margin (e.g. when this is the last card in the list) */
  noMarginBottom?: boolean;
}

export const MemberCard: React.FC<MemberCardProps> = ({
  member,
  isOwner = false,
  onRemove,
  noMarginBottom = false,
}) => {
  const { t } = useTranslation();
  const displayName = member.nickname || member.email;

  const cardContent = (
    <CardContent>
      <AvatarContainer>
        {member.avatarUrl ? (
          <AvatarImage
            source={{ uri: member.avatarUrl }}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : (
          <AvatarPlaceholder>
            <Ionicons name="person" size={24} color="white" />
          </AvatarPlaceholder>
        )}
      </AvatarContainer>
      <InfoContainer>
        <NameRow>
          <MemberName>{displayName}</MemberName>
          {isOwner && <OwnerBadge>{t('share.members.ownerBadge')}</OwnerBadge>}
        </NameRow>
      </InfoContainer>
    </CardContent>
  );

  // SwipeableRow renders plain children when no actions are provided (owner rows)
  return (
    <CardWrapper noMarginBottom={noMarginBottom}>
      <SwipeableRow
        onDelete={
          !isOwner && onRemove ? () => onRemove(member.userId) : undefined
        }
        deleteLabel={t('common.delete')}
      >
        {cardContent}
      </SwipeableRow>
    </CardWrapper>
  );
};
