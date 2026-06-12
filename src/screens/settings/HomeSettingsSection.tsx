import React from 'react';
import { View, Text } from 'react-native';
import styled from 'styled-components/native';
import { useTranslation } from 'react-i18next';
import type { StyledProps } from '../../utils/styledComponents';

import {
  SettingsTextButton,
  PermissionConfigPanel,
  EmptyState,
  Button,
  MemberList,
  HorizontalSplitter,
  SectionTitle,
} from '../../components';
import { Member } from '../../types/user';
import { Home } from '../../types/home';
import { SettingsSectionCard } from './SettingsSectionCard';

const LoginPromptContainer = styled(View)`
  align-items: center;
  justify-content: center;
  padding: ${({ theme }: StyledProps) => theme.spacing.xl}px;
`;

const ButtonContainer = styled(View)`
  width: 100%;
  max-width: 300px;
  margin-top: ${({ theme }: StyledProps) => theme.spacing.lg}px;
`;

const CardFootnote = styled(Text)`
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.sm}px;
  font-weight: ${({ theme }: StyledProps) => theme.typography.fontWeight.regular};
  color: ${({ theme }: StyledProps) => theme.colors.textLight};
  text-align: center;
  margin-top: 0px;
  margin-bottom: 0px;
`;

export interface HomeSettingsSectionProps {
  isAuthenticated: boolean;
  currentHome: Home | undefined;
  members: Member[];
  isLoadingMembers: boolean;
  membersError: string | null;
  canShareInventory: boolean;
  canShareTodos: boolean;
  onLoginPress: () => void;
  onRemoveMember: (memberUserId: string) => void;
  onInvitePress: () => void;
  onToggleInventory: () => void;
  onToggleTodos: () => void;
  onEditHomePress: () => void;
  onDeleteHomePress: () => void;
  onLeaveHome: () => void;
}

export const HomeSettingsSection: React.FC<HomeSettingsSectionProps> = ({
  isAuthenticated,
  currentHome,
  members,
  isLoadingMembers,
  membersError,
  canShareInventory,
  canShareTodos,
  onLoginPress,
  onRemoveMember,
  onInvitePress,
  onToggleInventory,
  onToggleTodos,
  onEditHomePress,
  onDeleteHomePress,
  onLeaveHome,
}) => {
  const { t } = useTranslation();

  return (
    <>
      {currentHome && (
        <SectionTitle title={t('settings.homeSettings')} icon="home-outline" />
      )}
      <SettingsSectionCard>
        {!isAuthenticated ? (
          <>
            <LoginPromptContainer>
              <EmptyState
                icon="lock-closed"
                title={t('share.loginRequired.title')}
                description={t('share.loginRequired.description')}
              />
              <ButtonContainer>
                <Button
                  onPress={onLoginPress}
                  label={t('login.submit')}
                  icon="log-in"
                  variant="primary"
                />
              </ButtonContainer>
            </LoginPromptContainer>
          </>
        ) : (
          <>
            <MemberList
              owner={members.find((member) => member.isOwner) ?? null}
              members={members.filter((member) => !member.isOwner)}
              isLoading={isLoadingMembers}
              error={membersError}
              onRemoveMember={currentHome?.role === 'owner' ? onRemoveMember : undefined}
              onInvitePress={onInvitePress}
              showInviteButton={currentHome?.role === 'owner'}
            />

            {currentHome?.role === 'owner' && (
              <PermissionConfigPanel
                canShareInventory={canShareInventory}
                canShareTodos={canShareTodos}
                onToggleInventory={onToggleInventory}
                onToggleTodos={onToggleTodos}
                isLoading={false}
              />
            )}
            {currentHome && (
              <>
                <HorizontalSplitter />
                {currentHome.role === 'owner' && (
                  <>
                    <SettingsTextButton
                      label={t('settings.editHome')}
                      icon="pencil-outline"
                      onPress={onEditHomePress}
                    />
                    <SettingsTextButton
                      label={t('settings.deleteHome.title')}
                      icon="trash-outline"
                      onPress={onDeleteHomePress}
                      variant="destructive"
                      noMarginBottom
                    />
                  </>
                )}
                {currentHome.role === 'member' && (
                  <SettingsTextButton
                    label={t('share.members.leaveHome', 'Leave Home')}
                    icon="log-out-outline"
                    onPress={onLeaveHome}
                    variant="destructive"
                    noMarginBottom
                  />
                )}
              </>
            )}
          </>
        )}
      </SettingsSectionCard>
      {currentHome && (
        <CardFootnote>
          {t('settings.appliesToHome', { homeName: currentHome.name })}
        </CardFootnote>
      )}
    </>
  );
};
