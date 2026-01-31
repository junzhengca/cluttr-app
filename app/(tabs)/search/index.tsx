import React, { useState, useMemo, useCallback } from 'react';
import { StyleSheet, View, Text, SectionList, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { useInventory, useTodos } from '../../../src/store/hooks';
import { ItemCard } from '../../../src/components/molecules/ItemCard';
import { TodoCard } from '../../../src/components/molecules/TodoCard';
import { InventoryItem, TodoItem } from '../../../src/types/inventory';
import { Ionicons } from '@expo/vector-icons';
import { PageHeader } from '../../../src/components/organisms/PageHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Union type for the data in the SectionList
// For 'items', the data is an array of arrays (rows), where each row has 1 or 2 InventoryItems.
// For 'notes', the data is an array of TodoItems.
type ItemRow = InventoryItem[];
type SectionData = ItemRow | TodoItem;

type SectionType = {
    title: string;
    data: SectionData[];
    type: 'items' | 'notes';
};

export default function SearchIndex() {
    const { t } = useTranslation();
    const theme = useTheme();
    const router = useRouter();
    const { items } = useInventory();
    const { todos, toggleTodoCompletion, updateTodo } = useTodos();
    const [searchQuery, setSearchQuery] = useState('');
    const insets = useSafeAreaInsets();

    // Calculate card width for 2-column grid
    const cardWidth = useMemo(() => {
        const screenWidth = Dimensions.get('window').width;
        // Padding matches styles.listContent paddingHorizontal (16)
        const contentPadding = 16 * 2;
        const gap = 12;
        return (screenWidth - contentPadding - gap) / 2;
    }, []);

    const filteredItems = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const query = searchQuery.toLowerCase();
        return items.filter(
            (item) =>
                item.name.toLowerCase().includes(query) ||
                (item.detailedLocation && item.detailedLocation.toLowerCase().includes(query)) ||
                (item.location && item.location.includes(query))
        );
    }, [items, searchQuery]);

    const filteredTodos = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const query = searchQuery.toLowerCase();
        return todos.filter(
            (todo) =>
                todo.text.toLowerCase().includes(query) ||
                (todo.note && todo.note.toLowerCase().includes(query))
        );
    }, [todos, searchQuery]);

    // Chunk filtered items into pairs for grid layout
    const chunkedItems = useMemo(() => {
        const chunks: ItemRow[] = [];
        for (let i = 0; i < filteredItems.length; i += 2) {
            chunks.push(filteredItems.slice(i, i + 2));
        }
        return chunks;
    }, [filteredItems]);

    const sections: SectionType[] = useMemo(() => {
        const result: SectionType[] = [];
        if (chunkedItems.length > 0) {
            result.push({
                title: t('inventory.title'),
                data: chunkedItems,
                type: 'items',
            });
        }
        if (filteredTodos.length > 0) {
            result.push({
                title: t('notes.title'),
                data: filteredTodos,
                type: 'notes',
            });
        }
        return result;
    }, [chunkedItems, filteredTodos, t]);

    const handleItemPress = useCallback((item: InventoryItem) => {
        router.push({
            pathname: '/ItemDetails',
            params: { itemId: item.id },
        });
    }, [router]);

    const renderSectionHeader = ({ section: { title } }: { section: SectionType }) => (
        <View style={[styles.sectionHeader, { backgroundColor: theme.colors.background }]}>
            <Text style={[styles.sectionHeaderText, { color: theme.colors.text }]}>{title}</Text>
        </View>
    );

    const renderItem = ({ item, section }: { item: SectionData; section: SectionType }) => {
        if (section.type === 'items') {
            // Render a row of items
            const rowItems = item as ItemRow;
            return (
                <View style={[styles.rowContainer, { gap: 12 }]}>
                    {rowItems.map((inventoryItem) => (
                        <View key={inventoryItem.id} style={{ width: cardWidth }}>
                            <ItemCard item={inventoryItem} onPress={handleItemPress} />
                        </View>
                    ))}
                    {/* Fill empty space if row has only 1 item to maintain alignment if we were using flex-start, 
                        but simply not rendering the second item works fine with default flex behavior */}
                </View>
            );
        } else {
            // Render a single todo item
            return (
                <View style={styles.cardContainer}>
                    <TodoCard
                        todo={item as TodoItem}
                        onToggle={toggleTodoCompletion}
                        onUpdate={updateTodo}
                        editable={false}
                    />
                </View>
            );
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTransparent: true,
                    headerTitle: "",
                    headerSearchBarOptions: {
                        placeholder: t('search.placeholder') || 'Search',
                        onChangeText: (e) => setSearchQuery(e.nativeEvent.text),
                        hideWhenScrolling: false,
                        autoFocus: false,
                    },
                }}
            />

            <PageHeader
                icon="search"
                title={t('navigation.search')}
                subtitle={t('search.placeholder')}
                showRightButtons={false}
                showBackButton={false}
            />

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                {searchQuery.trim() === '' ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="search-outline" size={64} color={theme.colors.textLight} />
                        <Text style={[styles.emptyStateText, { color: theme.colors.textLight }]}>
                            {t('search.placeholder')}
                        </Text>
                    </View>
                ) : sections.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={[styles.emptyStateText, { color: theme.colors.text }]}>
                            {t('inventory.empty.filtered')}
                        </Text>
                    </View>
                ) : (
                    <SectionList
                        sections={sections}
                        keyExtractor={(item, index) => {
                            // For items (arrays), use the first item's ID combined with index just in case
                            if (Array.isArray(item)) {
                                return item[0].id + '_row_' + index;
                            }
                            // For todos
                            return (item as TodoItem).id;
                        }}
                        renderItem={renderItem}
                        renderSectionHeader={renderSectionHeader}
                        contentContainerStyle={[
                            styles.listContent,
                            { paddingBottom: insets.bottom + 100 }
                        ]}
                        keyboardDismissMode="on-drag"
                        stickySectionHeadersEnabled={false}
                        contentInsetAdjustmentBehavior="automatic"
                    />
                )}
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContent: {
        paddingHorizontal: 16,
    },
    sectionHeader: {
        paddingVertical: 12,
        marginBottom: 8,
    },
    sectionHeaderText: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    cardContainer: {
        marginBottom: 12,
    },
    rowContainer: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        padding: 20,
        paddingTop: 100,
    },
    emptyStateText: {
        fontSize: 16,
        marginTop: 16,
        textAlign: 'center',
    },
});
