import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  Alert,
  TouchableOpacity,
  Platform,
} from 'react-native';
import styled from 'styled-components/native';
import { useTranslation } from 'react-i18next';
import Ionicons from '@react-native-vector-icons/ionicons/static';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import storage from '@react-native-firebase/storage';
import type { StyledProps } from '../../utils/styledComponents';
import { uiLogger } from '../../utils/Logger';
import { SectionTitle } from '../../components';
import { useAppDispatch } from '../../store/hooks';
import { setUser } from '../../store/slices/authSlice';
import { userService } from '../../services/UserService';
import { useTheme } from '../../theme/ThemeProvider';
import type { User } from '../../types/user';
import {
  SettingsSectionCard,
  ProfileCardContent,
  AvatarContainer,
  AvatarImage,
  AvatarPlaceholder,
} from './styles';

const UserNameContainer = styled(View)`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  margin-bottom: ${({ theme }: StyledProps) => theme.spacing.xs}px;
`;

const UserName = styled(Text)`
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.lg}px;
  font-weight: ${({ theme }: StyledProps) => theme.typography.fontWeight.bold};
  color: ${({ theme }: StyledProps) => theme.colors.text};
  margin-right: ${({ theme }: StyledProps) => theme.spacing.sm}px;
`;

const EditNicknameButton = styled(TouchableOpacity)`
  padding: ${({ theme }: StyledProps) => theme.spacing.xs}px;
`;

const UserEmail = styled(Text)`
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.md}px;
  color: ${({ theme }: StyledProps) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }: StyledProps) => theme.spacing.xs}px;
`;

const UserId = styled(Text)`
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.sm}px;
  color: ${({ theme }: StyledProps) => theme.colors.textSecondary};
`;

interface AvatarSectionProps {
  user: User;
  onEditNickname: (currentNickname: string) => void;
}

export const AvatarSection: React.FC<AvatarSectionProps> = ({
  user,
  onEditNickname,
}) => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const theme = useTheme();
  const [isUploading, setIsUploading] = useState(false);

  const handleAvatarPress = useCallback(async () => {
    try {
      // Request permissions
      if (Platform.OS !== 'web') {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            t('profile.avatar.uploadError.title'),
            t('profile.avatar.uploadError.permissionDenied')
          );
          return;
        }
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) {
        return;
      }

      if (!result.assets || result.assets.length === 0) {
        return;
      }

      if (!user) {
        throw new Error('Not signed in');
      }

      const imageUri = result.assets[0].uri;
      setIsUploading(true);

      // Resize image to max 1024x1024 to reduce payload size
      // Since we're using square aspect ratio (1:1), 1024x1024 is appropriate
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 1024, height: 1024 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Upload to Firebase Storage. A unique filename per upload ensures the
      // new download URL busts the image cache.
      const avatarRef = storage().ref(
        `avatars/${user.id}/avatar-${Date.now()}.jpg`
      );
      await avatarRef.putFile(manipulatedImage.uri);
      const downloadUrl = await avatarRef.getDownloadURL();

      // Persist the avatar URL on the user profile
      const updatedUser = await userService.updateProfile(user.id, {
        avatarUrl: downloadUrl,
      });
      dispatch(setUser(updatedUser));

      Alert.alert(
        t('profile.avatar.uploadSuccess.title'),
        t('profile.avatar.uploadSuccess.message')
      );
    } catch (error) {
      uiLogger.error('Avatar upload error', error);
      Alert.alert(
        t('profile.avatar.uploadError.title'),
        t('profile.avatar.uploadError.message')
      );
    } finally {
      setIsUploading(false);
    }
  }, [t, user, dispatch]);

  return (
    <>
      <SectionTitle title={t('profile.title')} icon="person-outline" />
      <SettingsSectionCard>
        <ProfileCardContent>
          <AvatarContainer onPress={handleAvatarPress} disabled={isUploading}>
            {isUploading ? (
              <View
                style={{
                  width: '100%',
                  height: '100%',
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                }}
              >
                <ActivityIndicator size="small" color="white" />
              </View>
            ) : user.avatarUrl ? (
              <AvatarImage
                source={{ uri: user.avatarUrl }}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            ) : (
              <AvatarPlaceholder>
                <Text style={{ fontSize: 40, color: 'white' }}>👤</Text>
              </AvatarPlaceholder>
            )}
          </AvatarContainer>
          <UserNameContainer>
            <UserName>{user.nickname || user.email}</UserName>
            <EditNicknameButton
              onPress={() => onEditNickname(user.nickname || '')}
            >
              <Ionicons
                name="create-outline"
                size={20}
                color={theme.colors.primary}
              />
            </EditNicknameButton>
          </UserNameContainer>
          {user.nickname && <UserEmail>{user.email}</UserEmail>}
          {user.id && (
            <UserId>
              {t('profile.userId')}: {user.id}
            </UserId>
          )}
        </ProfileCardContent>
      </SettingsSectionCard>
    </>
  );
};
