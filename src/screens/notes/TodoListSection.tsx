import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import styled from 'styled-components/native';
import { useTranslation } from 'react-i18next';
import type { StyledProps } from '../../utils/styledComponents';
import {
  getTodoCategoryDisplayName,
  type TodoCategoryTranslateFn,
} from '../../utils/todoCategoryI18n';

import { TodoCard, EmptyState, SwipeableRow } from '../../components';
import { TodoItem, TodoCategory } from '../../types/inventory';
import type { TodoMode } from './NotesBanner';

const SectionTitle = styled(Text)`
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.lg}px;
  font-weight: 600;
  color: ${({ theme }: StyledProps) => theme.colors.text};
  margin-bottom: ${({ theme }: StyledProps) => theme.spacing.md}px;
`;

const CategorySectionTitle = styled(Text)`
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.md}px;
  font-weight: 600;
  color: ${({ theme }: StyledProps) => theme.colors.textSecondary};
  margin-top: ${({ theme }: StyledProps) => theme.spacing.sm}px;
  margin-bottom: ${({ theme }: StyledProps) => theme.spacing.sm}px;
`;

const CardWrapper = styled(View)`
  margin-bottom: 0;
`;

interface TodoListSectionProps {
  mode: TodoMode;
  pendingTodos: TodoItem[];
  completedTodos: TodoItem[];
  categories: TodoCategory[];
  updatingTodoIds: string[];
  onToggleTodo: (id: string) => Promise<void>;
  onUpdateTodo: (id: string, text: string, note?: string) => void;
  onDeleteTodo: (id: string) => void;
}

export const TodoListSection: React.FC<TodoListSectionProps> = ({
  mode,
  pendingTodos,
  completedTodos,
  categories,
  updatingTodoIds,
  onToggleTodo,
  onUpdateTodo,
  onDeleteTodo,
}) => {
  const { t } = useTranslation();

  // Grouped todos for shopping mode
  const groupedPendingTodos = useMemo(() => {
    if (mode !== 'shopping') return {};

    const groups: Record<string, TodoItem[]> = {};
    const uncategorized: TodoItem[] = [];

    // Initialize groups for all categories to ensure order
    categories.forEach(cat => {
      groups[cat.id] = [];
    });

    pendingTodos.forEach(todo => {
      if (todo.categoryId && groups[todo.categoryId]) {
        groups[todo.categoryId].push(todo);
      } else {
        uncategorized.push(todo);
      }
    });

    // Remove empty groups if desired, or keep them.
    // For now, let's keep only groups that have items or are explicitly categories
    // But filter out empty ones for display to avoid clutter
    const result: Record<string, TodoItem[]> = {};

    categories.forEach(cat => {
      if (groups[cat.id].length > 0) {
        result[cat.id] = groups[cat.id];
      }
    });

    if (uncategorized.length > 0) {
      result['uncategorized'] = uncategorized;
    }

    return result;
  }, [mode, pendingTodos, categories]);

  const renderTodoItem = (todo: TodoItem, editable: boolean = true) => {
    // Wrap all todos in Swipeable to allow deletion
    // If not editable (shopping mode), disable swipeable or just don't allow delete?
    // User said "cannot edit todo items", implies read-only. Deletion might be considered editing.
    // For now, I'll allow deletion in planning mode only to be safe, or just keep it enabled?
    // "Shopping mode... cannot add new items... cannot edit todo items"
    // Usually shopping mode is safe to just check off.
    // Let's disable swipe actions in shopping mode for now.

    if (!editable) {
      return (
        <CardWrapper key={todo.id} style={{ marginBottom: 16 }}>
          <TodoCard
            todo={todo}
            onToggle={onToggleTodo}
            onUpdate={onUpdateTodo}
            style={{ marginBottom: 0 }}
            editable={false}
            isSaving={updatingTodoIds.includes(todo.id)}
          />
        </CardWrapper>
      );
    }

    return (
      <SwipeableRow
        key={todo.id}
        onDelete={() => onDeleteTodo(todo.id)}
        deleteLabel={t('common.delete')}
        style={{ marginBottom: 16 }}
      >
        <CardWrapper>
          <TodoCard
            todo={todo}
            onToggle={onToggleTodo}
            onUpdate={onUpdateTodo}
            style={{ marginBottom: 0 }}
            isSaving={updatingTodoIds.includes(todo.id)}
          />
        </CardWrapper>
      </SwipeableRow>
    );
  };

  return (
    <>
      {mode === 'planning' ? (
        <>
          {pendingTodos.length > 0 && (
            <>
              <SectionTitle>
                {t('notes.pending')} ({pendingTodos.length})
              </SectionTitle>
              {pendingTodos.map((todo) => renderTodoItem(todo))}
            </>
          )}

          {completedTodos.length > 0 && (
            <>
              <SectionTitle style={{ marginTop: 20 }}>
                {t('notes.completed')} ({completedTodos.length})
              </SectionTitle>
              {completedTodos.map((todo) => renderTodoItem(todo))}
            </>
          )}
        </>
      ) : (
        /* Shopping Mode */
        <>
          {Object.entries(groupedPendingTodos).map(([catId, todos]) => {
            const category = categories.find(c => c.id === catId);
            const title = category
              ? getTodoCategoryDisplayName(category, t as TodoCategoryTranslateFn)
              : t('notes.uncategorized', 'Uncategorized');

            return (
              <View key={catId} style={{ marginBottom: 16 }}>
                <CategorySectionTitle>{title}</CategorySectionTitle>
                {todos.map(todo => renderTodoItem(todo, false))}
              </View>
            );
          })}

          {pendingTodos.length === 0 && (
            <EmptyState
              icon="cart-outline"
              title={t('notes.emptyShopping.title', 'All done!')}
              description={t('notes.emptyShopping.description', 'No pending items to shop for.')}
            />
          )}
        </>
      )}

      {mode === 'planning' && pendingTodos.length === 0 && completedTodos.length === 0 && (
        <EmptyState
          icon="clipboard-outline"
          title={t('notes.empty.title')}
          description={t('notes.empty.description')}
        />
      )}
    </>
  );
};
