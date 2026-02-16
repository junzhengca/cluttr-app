import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, ViewStyle, TextInput, Animated, NativeSyntheticEvent, TextInputContentSizeChangeEventData, ActivityIndicator } from 'react-native';
import styled from 'styled-components/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { getTodoCategoryDisplayName } from '../../utils/todoCategoryI18n';
import { useTheme } from '../../theme/ThemeProvider';
import { TodoItem } from '../../types/inventory';
import { useTodoCategories } from '../../store/hooks';
import type { StyledProps, StyledPropsWith } from '../../utils/styledComponents';
import { BaseCard } from '../atoms';

const ContentContainer = styled(View)`
  flex-direction: row;
  align-items: flex-start;
  width: 100%;
`;

const TextContainer = styled(View)`
  flex: 1;
  flex-direction: column;
  overflow: hidden;
`;

const Checkbox = styled(TouchableOpacity) <{ checked: boolean }>`
  width: 20px;
  height: 20px;
  border-radius: 10px;
  border-width: 2px;
  border-color: ${({ theme, checked }: StyledPropsWith<{ checked: boolean }>) =>
    checked ? theme.colors.primary : theme.colors.border};
  background-color: ${({ theme, checked }: StyledPropsWith<{ checked: boolean }>) =>
    checked ? theme.colors.primary : 'transparent'};
  align-items: center;
  justify-content: center;
  margin-right: ${({ theme }: StyledProps) => theme.spacing.sm}px;
`;

const TodoText = styled(Text) <{ completed: boolean }>`
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.md}px;
  font-weight: ${({ theme, completed }: StyledPropsWith<{ completed: boolean }>) =>
    (completed ? theme.typography.fontWeight.regular : theme.typography.fontWeight.bold)};
  color: ${({ theme, completed }: StyledPropsWith<{ completed: boolean }>) =>
    (completed ? theme.colors.textSecondary : theme.colors.text)};
  text-decoration-line: ${({ completed }: { completed: boolean }) =>
    (completed ? 'line-through' : 'none')};
  line-height: ${({ theme }: StyledProps) => theme.typography.fontSize.md * 1.2}px;
  padding: 0px;
  padding-vertical: 0px;
  margin: 0px;
  padding-bottom: ${({ theme }: StyledProps) => theme.spacing.xs}px;
`;

const TodoNote = styled(Text) <{ completed: boolean }>`
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.sm}px;
  font-weight: ${({ theme }: StyledProps) => theme.typography.fontWeight.regular};
  color: ${({ theme, completed }: StyledPropsWith<{ completed: boolean }>) =>
    (completed ? theme.colors.textSecondary : theme.colors.textSecondary)};
  line-height: ${({ theme }: StyledProps) => theme.typography.fontSize.sm * 1.4}px;
  padding: 0px;
  padding-vertical: 0px;
  margin: 0px;
`;

const TitleRow = styled(View)`
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
  width: 100%;
`;

const BadgeContainer = styled(View)`
  flex-direction: row;
  align-items: center;
  height: ${({ theme }: StyledProps) => theme.typography.fontSize.md * 1.2}px;
  justify-content: center;
  margin-left: ${({ theme }: StyledProps) => theme.spacing.sm}px;
`;

const CategoryTag = styled(View)`
  background-color: ${({ theme }: StyledProps) => theme.colors.borderLight};
  padding-horizontal: ${({ theme }: StyledProps) => theme.spacing.xs}px;
  padding-vertical: 2px;
  border-radius: ${({ theme }: StyledProps) => theme.borderRadius.sm}px;
`;

const CategoryTagText = styled(Text)`
  font-size: 10px;
  color: ${({ theme }: StyledProps) => theme.colors.textSecondary};
  font-weight: ${({ theme }: StyledProps) => theme.typography.fontWeight.regular};
`;

const EditableTextInput = styled(TextInput) <{ completed: boolean; isEditing: boolean }>`
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.md}px;
  font-weight: ${({ theme, completed }: StyledPropsWith<{ completed: boolean }>) =>
    (completed ? theme.typography.fontWeight.regular : theme.typography.fontWeight.bold)};
  color: ${({ theme, completed }: StyledPropsWith<{ completed: boolean }>) =>
    (completed ? theme.colors.textSecondary : theme.colors.text)};
  text-decoration-line: ${({ completed }: { completed: boolean }) =>
    (completed ? 'line-through' : 'none')};
  line-height: ${({ theme }: StyledProps) => theme.typography.fontSize.md * 1.2}px;
  background-color: transparent;
  border-width: 0px;
  border-color: transparent;
  outline-width: 0px;
  outline: none;
  padding: 0px;
  padding-vertical: 0px;
  margin: 0px;
  width: 100%;
`;

const NotesHeightWrapper = Animated.View;

const NotesInputContainer = styled(View)`
  margin-top: ${({ theme }: StyledProps) => theme.spacing.xs}px;
  padding-top: ${({ theme }: StyledProps) => theme.spacing.xs}px;
  border-top-width: 1px;
  border-top-color: ${({ theme }: StyledProps) => theme.colors.borderLight};
  width: 100%;
`;

const EditableNoteInput = styled(TextInput) <{ completed: boolean; isEditing: boolean }>`
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.sm}px;
  font-weight: ${({ theme }: StyledProps) => theme.typography.fontWeight.regular};
  color: ${({ theme, completed }: StyledPropsWith<{ completed: boolean }>) =>
    (completed ? theme.colors.textSecondary : theme.colors.textSecondary)};
  line-height: ${({ theme }: StyledProps) => theme.typography.fontSize.sm * 1.4}px;
  background-color: transparent;
  border-width: 0px;
  border-color: transparent;
  outline-width: 0px;
  outline: none;
  padding: 0px;
  padding-vertical: 0px;
  margin: 0px;
  min-height: ${({ theme }: StyledProps) => theme.typography.fontSize.sm * 1.4}px;
  width: 100%;
`;

export interface TodoCardProps {
  todo: TodoItem;
  onToggle?: (id: string) => void;
  onUpdate?: (id: string, text: string, note?: string) => void;
  style?: ViewStyle;
  editable?: boolean;
  isSaving?: boolean;
}

/**
 * TodoCard - A card component for displaying todo items with inline editing
 * Uses the same BaseCard styling as ItemCard for consistency, with compact variant
 * Supports inline editing of text and note fields using uncontrolled inputs
 */
export const TodoCard: React.FC<TodoCardProps> = ({
  todo,
  onToggle,
  onUpdate,
  style,
  editable = true,
  isSaving = false,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { categories } = useTodoCategories();

  const category = categories.find(c => c.id === todo.categoryId);
  const [editingField, setEditingField] = useState<'text' | 'note' | null>(null);
  const textInputRef = useRef<TextInput>(null);
  const noteInputRef = useRef<TextInput>(null);
  const textValueRef = useRef(todo.text);
  const noteValueRef = useRef(todo.note || '');

  const [currentNoteHeight, setCurrentNoteHeight] = useState(40);
  const [titleContent, setTitleContent] = useState(todo.text);
  const [noteContent, setNoteContent] = useState(todo.note || '');
  const isFocusingNoteRef = useRef(false);
  const textInputFocusedRef = useRef(false);
  const noteInputFocusedRef = useRef(false);

  // Animation values for notes field - height cannot use native driver
  // Initialize based on whether todo has a note
  const initialHeight = (!!todo.note || editingField !== null) ? 1 : 0;
  const notesHeight = useRef(new Animated.Value(initialHeight)).current;
  const notesOpacity = useRef(new Animated.Value(todo.note ? 1 : 0)).current;
  const previousNoteRef = useRef(todo.note);
  const editingFieldRef = useRef(editingField);
  const pendingSavedRef = useRef<{ text: string; note: string } | null>(null);
  const [showNotesWrapper, setShowNotesWrapper] = useState(!!todo.note || editingField === 'text' || editingField === 'note');

  // Keep refs in sync with state
  useEffect(() => {
    editingFieldRef.current = editingField;
  }, [editingField]);

  // Sync refs from todo only when not editing (so we don't overwrite in-progress edits)
  useEffect(() => {
    if (editingField === null) {
      textValueRef.current = todo.text;
      noteValueRef.current = todo.note || '';
      previousNoteRef.current = todo.note;
    }
  }, [todo.text, todo.note, editingField]);

  // Exit editing mode if todo becomes completed
  useEffect(() => {
    if (todo.completed && editingField !== null) {
      // Save any pending changes before exiting edit mode
      const newText = textValueRef.current.trim();
      const newNote = noteValueRef.current.trim();
      if (newText && (newText !== todo.text || newNote !== (todo.note || '')) && onUpdate) {
        onUpdate(todo.id, newText, newNote || undefined);
      }
      setEditingField(null);
    }
  }, [todo.completed, todo.id, todo.text, todo.note, editingField, onUpdate]);

  // Animate notes field show/hide based on todo.note and editingField
  useEffect(() => {
    const shouldBeVisible = !!todo.note || editingField !== null;

    if (shouldBeVisible && !showNotesWrapper) {
      // Need to show the wrapper
      setShowNotesWrapper(true);
      Animated.parallel([
        Animated.timing(notesHeight, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(notesOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    } else if (!shouldBeVisible && showNotesWrapper) {
      // Need to hide the wrapper
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
      ]).start(() => {
        setShowNotesWrapper(false);
      });
    } else if (shouldBeVisible && showNotesWrapper) {
      // Already visible, ensure height and opacity are updated if they changed
      if (editingField === null) {
        notesHeight.setValue(1);
        notesOpacity.setValue(1);
      }
    }
  }, [todo.note, editingField, notesHeight, notesOpacity, showNotesWrapper]);

  const handleTextPress = useCallback(() => {
    if (todo.completed || !editable) return; // Prevent editing completed or read-only todos
    setTitleContent(todo.text);
    setEditingField('text');
    // Focus the input after state update
    setTimeout(() => {
      textInputRef.current?.focus();
    }, 0);
  }, [todo.text, todo.completed, editable]);

  const handleNotePress = useCallback(() => {
    if (todo.completed || !editable) return; // Prevent editing completed or read-only todos
    setNoteContent(todo.note || '');
    setEditingField('note');
    // Focus the input after state update
    setTimeout(() => {
      noteInputRef.current?.focus();
    }, 0);
  }, [todo.note, todo.completed, editable]);

  const handleTextChange = useCallback((text: string) => {
    textValueRef.current = text;
    setTitleContent(text);
  }, []);

  const handleNoteChange = useCallback((text: string) => {
    noteValueRef.current = text;
    setNoteContent(text);
  }, []);

  const saveText = useCallback(() => {
    const newText = textValueRef.current.trim();
    const newNote = noteValueRef.current.trim();
    const hasChange = newText && (newText !== todo.text || newNote !== (todo.note || ''));
    if (hasChange && onUpdate) {
      onUpdate(todo.id, newText, newNote || undefined);
      pendingSavedRef.current = { text: newText, note: newNote };
    } else {
      setEditingField(null);
    }
  }, [todo.id, todo.text, todo.note, onUpdate]);

  const saveNote = useCallback(() => {
    const newText = textValueRef.current.trim();
    const newNote = noteValueRef.current.trim();
    const field = editingFieldRef.current;
    if (field === 'text') {
      const hasChange = newText && (newText !== todo.text || newNote !== (todo.note || ''));
      if (hasChange && onUpdate) {
        onUpdate(todo.id, newText, newNote || undefined);
        pendingSavedRef.current = { text: newText, note: newNote };
      } else {
        setEditingField(null);
      }
    } else {
      if (newNote !== (todo.note || '') && onUpdate) {
        onUpdate(todo.id, todo.text, newNote || undefined);
        pendingSavedRef.current = { text: todo.text, note: newNote };
      } else {
        setEditingField(null);
      }
    }
  }, [todo.id, todo.text, todo.note, onUpdate]);

  // Save with explicitly captured values (used by blur timeout so we don't read refs 150ms later)
  const applySaveWithValues = useCallback(
    (id: string, text: string, note: string, previousText: string, previousNote: string) => {
      const newText = text.trim();
      const newNote = note.trim();
      const hasChange = newText && (newText !== previousText || newNote !== previousNote);
      if (hasChange && onUpdate) {
        onUpdate(id, newText, newNote || undefined);
        pendingSavedRef.current = { text: newText, note: newNote };
      } else {
        setEditingField(null);
      }
    },
    [onUpdate]
  );

  // Exit edit mode only when store reflects our saved value (avoids flash of old text)
  useEffect(() => {
    const pending = pendingSavedRef.current;
    if (editingField === null || !pending) return;
    if (todo.text === pending.text && (todo.note ?? '') === (pending.note ?? '')) {
      pendingSavedRef.current = null;
      setEditingField(null);
    }
  }, [editingField, todo.text, todo.note]);

  const handleTextSubmit = useCallback(() => {
    saveText();
  }, [saveText]);

  const handleTextFocus = useCallback(() => {
    textInputFocusedRef.current = true;
  }, []);

  const handleTextBlur = useCallback(() => {
    textInputFocusedRef.current = false;
    // Capture values at blur time so the 150ms timeout saves what the user had, not refs later
    const capturedId = todo.id;
    const capturedText = textValueRef.current;
    const capturedNote = noteValueRef.current;
    const previousText = todo.text;
    const previousNote = todo.note || '';
    setTimeout(() => {
      if (editingFieldRef.current !== 'text') return;
      if (isFocusingNoteRef.current || noteInputFocusedRef.current) {
        isFocusingNoteRef.current = false;
        setEditingField('note');
        return;
      }
      applySaveWithValues(capturedId, capturedText, capturedNote, previousText, previousNote);
    }, 150);
  }, [todo.id, todo.text, todo.note, applySaveWithValues]);

  const handleNoteSubmit = useCallback(() => {
    saveNote();
  }, [saveNote]);

  const handleNoteFocus = useCallback(() => {
    noteInputFocusedRef.current = true;
    // Mark that we're focusing the note input to prevent text blur from closing
    isFocusingNoteRef.current = true;
    setEditingField('note');
  }, []);

  const handleNoteBlur = useCallback(() => {
    noteInputFocusedRef.current = false;
    // Capture values at blur time so the 150ms timeout saves what the user had
    const capturedId = todo.id;
    const capturedText = textValueRef.current;
    const capturedNote = noteValueRef.current;
    const previousText = todo.text;
    const previousNote = todo.note || '';
    setTimeout(() => {
      if (editingFieldRef.current !== 'note') return;
      if (textInputFocusedRef.current) {
        setEditingField('text');
        return;
      }
      applySaveWithValues(capturedId, capturedText, capturedNote, previousText, previousNote);
    }, 150);
  }, [todo.id, todo.text, todo.note, applySaveWithValues]);

  return (
    <BaseCard compact style={style}>
      <ContentContainer>
        <Checkbox
          checked={todo.completed}
          onPress={() => onToggle?.(todo.id)}
          activeOpacity={0.7}
          disabled={!onToggle}
        >
          {todo.completed && <Ionicons name="checkmark" size={14} color="white" />}
        </Checkbox>
        <TextContainer>
          <TitleRow>
            <View style={{ flex: 1 }}>
              {editingField === 'text' ? (
                <View style={{ width: '100%' }}>
                  {/* Invisible Measurement View for Title - Ensures parent container grows instantly */}
                  <TodoText
                    completed={todo.completed}
                    style={{
                      opacity: 0,
                      width: '100%',
                      pointerEvents: 'none',
                    }}
                  >
                    {titleContent || ' '}
                  </TodoText>
                  <EditableTextInput
                    ref={textInputRef}
                    value={titleContent}
                    onChangeText={handleTextChange}
                    onSubmitEditing={handleTextSubmit}
                    onFocus={handleTextFocus}
                    onBlur={handleTextBlur}
                    completed={todo.completed}
                    isEditing={true}
                    editable={!todo.completed && editable}
                    multiline
                    scrollEnabled={false}
                    blurOnSubmit={true} // Maintain enter-to-submit behavior for title
                    autoCorrect={false}
                    spellCheck={false}
                    textContentType="none"
                    autoComplete="off"
                    underlineColorAndroid="transparent"
                    textAlignVertical="top"
                    style={{
                      borderWidth: 0,
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      height: '100%',
                      padding: 0,
                      margin: 0,
                    } as import('react-native').ViewStyle}
                  />
                </View>
              ) : (
                <TouchableOpacity
                  onPress={handleTextPress}
                  activeOpacity={todo.completed || !editable ? 1 : 0.7}
                  disabled={todo.completed || !editable}
                >
                  <TodoText completed={todo.completed}>{todo.text}</TodoText>
                </TouchableOpacity>
              )}
            </View>
            {(isSaving || category) && (
              <BadgeContainer>
                {isSaving && (
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.textSecondary}
                    style={{ marginRight: 6 }}
                  />
                )}
                {category && (
                  <CategoryTag>
                    <CategoryTagText>{getTodoCategoryDisplayName(category, t)}</CategoryTagText>
                  </CategoryTag>
                )}
              </BadgeContainer>
            )}
          </TitleRow>
          {/* Unified note area - handled by animation wrapper for both display and editing */}
          {showNotesWrapper && (
            <NotesHeightWrapper
              style={{
                height: notesHeight.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, currentNoteHeight],
                }),
                opacity: notesOpacity,
                overflow: 'hidden',
              }}
              pointerEvents="auto"
            >
              {/* Measurement View (invisible) - ensures wrapper has correct height */}
              <View
                onLayout={(event) => {
                  const { height } = event.nativeEvent.layout;
                  if (height > 0) {
                    const measuredHeight = height;
                    if (Math.abs(currentNoteHeight - measuredHeight) > 0.1) {
                      setCurrentNoteHeight(measuredHeight);
                    }
                  }
                }}
                style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: '100%' }}
              >
                <NotesInputContainer>
                  {/* Measure based on the note text or input placeholder */}
                  {editingField === null && todo.note ? (
                    <TodoNote completed={todo.completed}>{todo.note}</TodoNote>
                  ) : (
                    <EditableNoteInput
                      key="measurement-note"
                      value={noteContent} // Controlled measurement ensures real-time growth
                      completed={todo.completed}
                      isEditing={true}
                      multiline
                      scrollEnabled={false}
                      placeholder={t('notes.addNote')}
                      underlineColorAndroid="transparent"
                      textAlignVertical="top"
                      style={{ minHeight: 0 }}
                    />
                  )}
                </NotesInputContainer>
              </View>

              {/* Visible Note Area */}
              <TouchableOpacity
                activeOpacity={todo.completed || !editable ? 1 : 0.7}
                disabled={todo.completed || !editable}
                onPress={() => {
                  if (todo.completed || !editable) return; // Prevent editing completed or read-only todos
                  if (editingField === null) {
                    handleNotePress();
                  } else if (editingField === 'text') {
                    isFocusingNoteRef.current = true;
                    noteInputRef.current?.focus();
                  }
                }}
              >
                <NotesInputContainer>
                  {editingField === null && todo.note ? (
                    <TodoNote completed={todo.completed}>{todo.note}</TodoNote>
                  ) : (
                    <EditableNoteInput
                      ref={noteInputRef}
                      value={noteContent} // Controlled visible input
                      onChangeText={handleNoteChange}
                      onContentSizeChange={(event: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
                        const { height } = event.nativeEvent.contentSize;
                        if (height > 0) {
                          const containerPadding = theme.spacing.xs * 2;
                          const totalHeight = height + containerPadding;
                          if (Math.abs(currentNoteHeight - totalHeight) > 1) {
                            setCurrentNoteHeight(totalHeight);
                          }
                        }
                      }}
                      onSubmitEditing={handleNoteSubmit}
                      onFocus={handleNoteFocus}
                      onBlur={handleNoteBlur}
                      completed={todo.completed}
                      isEditing={true}
                      editable={!todo.completed && editable}
                      multiline
                      scrollEnabled={false}
                      placeholder={t('notes.addNote')}
                      placeholderTextColor={theme.colors.textLight}
                      autoCorrect={false}
                      spellCheck={false}
                      textContentType="none"
                      autoComplete="off"
                      underlineColorAndroid="transparent"
                      textAlignVertical="top"
                      style={{ borderWidth: 0 } as import('react-native').TextStyle}
                    />
                  )}
                </NotesInputContainer>
              </TouchableOpacity>
            </NotesHeightWrapper>
          )}
        </TextContainer>
      </ContentContainer>
    </BaseCard>
  );
};

