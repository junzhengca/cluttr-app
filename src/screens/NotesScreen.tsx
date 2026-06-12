import React, { useEffect, useState, useRef } from 'react';
import {
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styled from 'styled-components/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { StyledProps, StyledPropsWith } from '../utils/styledComponents';
import { useTranslation } from 'react-i18next';

import {
  PageHeader,
  EmptyState,
  LoginBottomSheet,
  SignupBottomSheet,
  HomeSwitcher,
  TodoCategoryPicker,
} from '../components';
import { useTodos, useAuth, useTodoCategories } from '../store/hooks';
import { useHome } from '../hooks/useHome';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useTheme } from '../theme/ThemeProvider';
import { NotesBanner, type TodoMode } from './notes/NotesBanner';
import { TodoListSection } from './notes/TodoListSection';
import { useNotesTodoActions } from './notes/useNotesTodoActions';

const Container = styled(View)`
  flex: 1;
  background-color: ${({ theme }: StyledProps) => theme.colors.background};
`;

const Content = styled(ScrollView)`
  flex: 1;
  padding: ${({ theme }: StyledProps) => theme.spacing.md}px;
`;

const AddTodoContainer = styled(View)<{ isFocused: boolean }>`
  background-color: ${({ theme }: StyledProps) => theme.colors.surface};
  border-radius: ${({ theme }: StyledProps) => theme.borderRadius.xl}px;
  margin-bottom: ${({ theme }: StyledProps) => theme.spacing.md}px;
  border-width: 1.5px;
  border-color: ${({
    theme,
    isFocused,
  }: StyledPropsWith<{ isFocused: boolean }>) =>
    isFocused ? theme.colors.inputFocus : theme.colors.borderLight};
  overflow: hidden;
`;

const TodoInputRow = styled(View)`
  flex-direction: row;
  align-items: center;
  padding-horizontal: ${({ theme }: StyledProps) => theme.spacing.md}px;
  height: 48px;
`;

const TodoInput = styled(TextInput)`
  flex: 1;
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.md}px;
  color: ${({ theme }: StyledProps) => theme.colors.text};
  height: 100%;
  padding-vertical: 0;
`;

const ToggleNotesButton = styled(TouchableOpacity)<{ isActive: boolean }>`
  background-color: ${({
    theme,
    isActive,
  }: StyledPropsWith<{ isActive: boolean }>) =>
    isActive ? theme.colors.primary : theme.colors.borderLight};
  border-radius: ${({ theme }: StyledProps) => theme.borderRadius.md}px;
  margin-left: ${({ theme }: StyledProps) => theme.spacing.sm}px;
  height: 28px;
  width: 28px;
  align-items: center;
  justify-content: center;
`;

const AddButton = styled(TouchableOpacity)<{ disabled?: boolean }>`
  background-color: ${({
    theme,
    disabled,
  }: StyledPropsWith<{ disabled?: boolean }>) =>
    disabled ? theme.colors.borderLight : theme.colors.primary};
  border-radius: ${({ theme }: StyledProps) => theme.borderRadius.md}px;
  margin-left: ${({ theme }: StyledProps) => theme.spacing.sm}px;
  height: 28px;
  width: 28px;
  align-items: center;
  justify-content: center;
`;

// Use regular Animated.View for height animation (non-native driver)
const NotesHeightWrapper = Animated.View;

const NotesInputContainer = styled(View)`
  padding-horizontal: ${({ theme }: StyledProps) => theme.spacing.md}px;
  padding-top: ${({ theme }: StyledProps) => theme.spacing.xs}px;
  padding-bottom: ${({ theme }: StyledProps) => theme.spacing.sm}px;
  border-top-width: 1px;
  border-top-color: ${({ theme }: StyledProps) => theme.colors.borderLight};
`;

const NotesInput = styled(TextInput)`
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.md}px;
  color: ${({ theme }: StyledProps) => theme.colors.text};
  min-height: 40px;
  padding-vertical: ${({ theme }: StyledProps) => theme.spacing.xs}px;
`;

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const NotesScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const {
    pendingTodos,
    completedTodos,
    loading,
    addingTodo,
    updatingTodoIds,
    addTodo,
    toggleTodoCompletion,
    removeTodo,
    updateTodo,
  } = useTodos();
  const { categories } = useTodoCategories();
  const theme = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { currentHome } = useHome();
  const canAccessNotes = React.useMemo(() => {
    if (!currentHome) return true;
    if (currentHome.role === 'owner') return true;
    return currentHome.settings?.canShareTodos ?? true;
  }, [currentHome]);

  const [mode, setMode] = useState<TodoMode>('planning');
  const {
    newTodoText,
    newTodoNote,
    selectedCategoryId,
    setSelectedCategoryId,
    showNotesField,
    setShowNotesField,
    isFocused,
    setIsFocused,
    handleTodoTextChange,
    handleTodoNoteChange,
    handleAddTodo,
    handleToggleTodo,
    handleDeleteTodo,
  } = useNotesTodoActions({ addTodo, toggleTodoCompletion, removeTodo });

  const loginBottomSheetRef = useRef<BottomSheetModal | null>(null);
  const signupBottomSheetRef = useRef<BottomSheetModal | null>(null);

  // Animation values for notes field - height cannot use native driver
  const notesHeight = useRef(new Animated.Value(0)).current;
  const notesOpacity = useRef(new Animated.Value(0)).current;

  // Banner mode transition (0 = planning, 1 = shopping)
  const bannerProgress = useRef(new Animated.Value(0)).current;

  // Animate banner when switching between planning and shopping
  useEffect(() => {
    Animated.timing(bannerProgress, {
      toValue: mode === 'shopping' ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [mode, bannerProgress]);

  // Animate notes field show/hide
  // Using non-native driver for both to avoid conflicts when mixing with height
  useEffect(() => {
    if (showNotesField) {
      Animated.parallel([
        Animated.timing(notesHeight, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false, // Height cannot use native driver
        }),
        Animated.timing(notesOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false, // Using false to avoid conflicts with height animation
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(notesHeight, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(notesOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [showNotesField, notesHeight, notesOpacity]);

  const handleSignupPress = () => {
    loginBottomSheetRef.current?.dismiss();
    signupBottomSheetRef.current?.present();
  };

  const handleLoginPress = () => {
    signupBottomSheetRef.current?.dismiss();
    loginBottomSheetRef.current?.present();
  };

  const handleLoginSuccess = async () => {
    // User will be automatically updated via auth state
  };

  const handleAvatarPress = () => {
    const rootNavigation = navigation.getParent();
    if (rootNavigation) {
      rootNavigation.navigate('Profile');
    }
  };

  // Calculate bottom padding: nav bar height (60) + margin (16*2) + safe area + extra spacing
  const bottomPadding = 60 + 32 + insets.bottom + 24;

  if (loading) {
    return (
      <Container>
        <PageHeader
          titleComponent={<HomeSwitcher />}
          showRightButtons={true}
          avatarUrl={user?.avatarUrl}
          onAvatarPress={handleAvatarPress}
        />
        <LoginBottomSheet
          bottomSheetRef={loginBottomSheetRef}
          onSignupPress={handleSignupPress}
          onLoginSuccess={handleLoginSuccess}
        />
        <SignupBottomSheet
          bottomSheetRef={signupBottomSheetRef}
          onLoginPress={handleLoginPress}
        />
      </Container>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Container>
        <PageHeader
          titleComponent={<HomeSwitcher />}
          showRightButtons={true}
          avatarUrl={user?.avatarUrl}
          onAvatarPress={handleAvatarPress}
        />
        {/* Check if user has access to notes */}
        {!canAccessNotes ? (
          <EmptyState
            icon="lock-closed"
            title={t('accessControl.notes.title')}
            description={t('accessControl.notes.description')}
          />
        ) : (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
          >
            <Content
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: bottomPadding }}
              keyboardDismissMode="interactive"
              keyboardShouldPersistTaps="handled"
            >
              <NotesBanner
                mode={mode}
                bannerProgress={bannerProgress}
                onToggleMode={() =>
                  setMode(mode === 'planning' ? 'shopping' : 'planning')
                }
              />

              {mode === 'planning' && (
                <AddTodoContainer isFocused={isFocused}>
                  <TodoInputRow>
                    <TodoInput
                      placeholder={t('notes.addTodo')}
                      placeholderTextColor={theme.colors.textLight}
                      value={newTodoText}
                      onChangeText={handleTodoTextChange}
                      onSubmitEditing={handleAddTodo}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      autoCorrect={false}
                      spellCheck={false}
                      textContentType="none"
                      autoComplete="off"
                    />
                    <ToggleNotesButton
                      isActive={showNotesField}
                      onPress={() => setShowNotesField(!showNotesField)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons
                        name={
                          showNotesField
                            ? 'document-text'
                            : 'document-text-outline'
                        }
                        size={18}
                        color={
                          showNotesField ? 'white' : theme.colors.textSecondary
                        }
                      />
                    </ToggleNotesButton>
                    <AddButton
                      onPress={
                        addingTodo || !newTodoText.trim()
                          ? undefined
                          : handleAddTodo
                      }
                      activeOpacity={0.7}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      disabled={addingTodo || !newTodoText.trim()}
                    >
                      {addingTodo ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Ionicons
                          name="add"
                          size={18}
                          color={
                            !newTodoText.trim()
                              ? theme.colors.textSecondary
                              : 'white'
                          }
                        />
                      )}
                    </AddButton>
                  </TodoInputRow>
                  <NotesHeightWrapper
                    style={{
                      height: notesHeight.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 80],
                      }),
                      opacity: notesOpacity,
                      overflow: 'hidden',
                    }}
                    pointerEvents={showNotesField ? 'auto' : 'none'}
                  >
                    <NotesInputContainer>
                      <NotesInput
                        placeholder={t('notes.addNote')}
                        placeholderTextColor={theme.colors.textLight}
                        value={newTodoNote}
                        onChangeText={handleTodoNoteChange}
                        multiline={true}
                        autoCorrect={false}
                        spellCheck={false}
                        textContentType="none"
                        autoComplete="off"
                      />
                    </NotesInputContainer>
                  </NotesHeightWrapper>
                  <TodoCategoryPicker
                    selectedCategoryId={selectedCategoryId}
                    onSelect={setSelectedCategoryId}
                  />
                </AddTodoContainer>
              )}

              <TodoListSection
                mode={mode}
                pendingTodos={pendingTodos}
                completedTodos={completedTodos}
                categories={categories}
                updatingTodoIds={updatingTodoIds}
                onToggleTodo={handleToggleTodo}
                onUpdateTodo={updateTodo}
                onDeleteTodo={handleDeleteTodo}
              />
            </Content>
          </KeyboardAvoidingView>
        )}

        <LoginBottomSheet
          bottomSheetRef={loginBottomSheetRef}
          onSignupPress={handleSignupPress}
          onLoginSuccess={handleLoginSuccess}
        />
        <SignupBottomSheet
          bottomSheetRef={signupBottomSheetRef}
          onLoginPress={handleLoginPress}
        />
      </Container>
    </GestureHandlerRootView>
  );
};
