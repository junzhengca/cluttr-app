import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';

interface UseNotesTodoActionsParams {
  addTodo: (text: string, note?: string, categoryId?: string) => void;
  toggleTodoCompletion: (id: string) => void;
  removeTodo: (id: string) => void;
}

export const useNotesTodoActions = ({
  addTodo,
  toggleTodoCompletion,
  removeTodo,
}: UseNotesTodoActionsParams) => {
  const { t } = useTranslation();

  const [newTodoText, setNewTodoText] = useState('');
  const [newTodoNote, setNewTodoNote] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [showNotesField, setShowNotesField] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Stable onChangeText handler to prevent IME composition interruption
  const handleTodoTextChange = useCallback((text: string) => {
    setNewTodoText(text);
  }, []);

  const handleTodoNoteChange = useCallback((text: string) => {
    setNewTodoNote(text);
  }, []);

  const handleAddTodo = async () => {
    if (newTodoText.trim()) {
      await addTodo(
        newTodoText.trim(),
        newTodoNote.trim() || undefined,
        selectedCategoryId || undefined
      );
      setNewTodoText('');
      setNewTodoNote('');
      setShowNotesField(false);
      // Keep selectedCategoryId so user can add another todo in the same category
    }
  };

  const handleToggleTodo = async (id: string) => {
    await toggleTodoCompletion(id);
  };

  const handleDeleteTodo = (id: string) => {
    Alert.alert(t('notes.deleteTodo.title'), t('notes.deleteTodo.message'), [
      {
        text: t('notes.deleteTodo.cancel'),
        style: 'cancel',
      },
      {
        text: t('notes.deleteTodo.confirm'),
        style: 'destructive',
        onPress: async () => {
          await removeTodo(id);
        },
      },
    ]);
  };

  return {
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
  };
};
