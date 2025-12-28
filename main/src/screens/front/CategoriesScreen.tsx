import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TextInput } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import MainContainer from '../../container/MainContainer';
import { useTheme } from '../../contexts/ThemeProvider';
import AppTouchableRipple from '../../components/AppTouchableRipple';
import EmptyData, { EmptyDataType } from '../../components/EmptyData';
import { CategoryCard } from '../../components/listItems';
import VoiceSearchButton from '../../components/VoiceSearchButton';
import VoiceSearchOverlay from '../../popups/VoiceSearchOverlay';
import { useVoiceSearch } from '../../hooks/useVoiceSearch';
import ApiManager from '../../managers/ApiManager';
import StorageManager from '../../managers/StorageManager';
import fonts from '../../styles/fonts';
import constant from '../../utilities/constant';
import { CategoryDetailScreenProps } from './CategoryDetailScreen';

// ============================================================================
// CONSTANTS
// ============================================================================
const GRID_COLUMNS = 2;
const VOICE_SEARCH_LANGUAGE = 'en-US';
const VOICE_SEARCH_DISPLAY_LANGUAGE = 'English (United States)';
const SEARCH_INPUT_FOCUS_DELAY = 100;

// ============================================================================
// TYPES
// ============================================================================
interface CategoriesScreenProps {
    navigation: NativeStackNavigationProp<any>;
}

export interface Category {
    id: number;
    name: string;
    description: string;
    product_count: number;
    image_url: string;
    created_at: string;
    updated_at: string;
}

interface CategoriesHeaderProps {
    categoryCount: number;
    searchQuery: string;
    isListening: boolean;
    isVoiceAvailable: boolean;
    onSearchChange: (query: string) => void;
    onVoicePress: () => void;
    onClearSearch: () => void;
    searchInputRef: React.RefObject<TextInput>;
}

interface CategoriesGridProps {
    categories: Category[];
    refreshing: boolean;
    onRefresh: () => void;
    onCategoryPress: (category: Category) => void;
    contentStyle: any;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
const filterCategories = (categories: Category[], query: string): Category[] => {
    if (!query.trim()) return categories;

    const lowerQuery = query.toLowerCase();
    return categories.filter(
        (category) =>
            category.name.toLowerCase().includes(lowerQuery) ||
            category.description.toLowerCase().includes(lowerQuery)
    );
};

const getCategoryWord = (count: number): string => {
    return count === 1 ? 'category' : 'categories';
};

const validateCategory = (category: Category): boolean => {
    return !!(category && category.id);
};

// ============================================================================
// SUB COMPONENTS
// ============================================================================
const SearchBar = React.memo(({
    searchQuery,
    isListening,
    isVoiceAvailable,
    onSearchChange,
    onVoicePress,
    onClearSearch,
    searchInputRef,
}: {
    searchQuery: string;
    isListening: boolean;
    isVoiceAvailable: boolean;
    onSearchChange: (query: string) => void;
    onVoicePress: () => void;
    onClearSearch: () => void;
    searchInputRef: React.RefObject<TextInput>;
}) => {
    const colors = useTheme();

    return (
        <View style={[styles.searchContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Icon name="magnify" size={20} color={colors.white} />
            <TextInput
                ref={searchInputRef}
                style={[styles.searchInput, { color: colors.white }]}
                placeholder="Search categories..."
                placeholderTextColor="rgba(255,255,255,0.7)"
                value={searchQuery}
                onChangeText={onSearchChange}
            />
            <VoiceSearchButton
                isListening={isListening}
                isAvailable={isVoiceAvailable}
                onPress={onVoicePress}
                colors={colors}
                size={20}
                showLabel={true}
            />
            {searchQuery.length > 0 && (
                <AppTouchableRipple onPress={onClearSearch}>
                    <Icon name="close-circle" size={20} color={colors.white} />
                </AppTouchableRipple>
            )}
        </View>
    );
});

const CategoriesHeader = React.memo(({
    categoryCount,
    searchQuery,
    isListening,
    isVoiceAvailable,
    onSearchChange,
    onVoicePress,
    onClearSearch,
    searchInputRef,
}: CategoriesHeaderProps) => {
    const colors = useTheme();

    return (
        <View style={[styles.header, { backgroundColor: colors.themePrimary }]}>
            <View style={styles.headerTop}>
                <View>
                    <Text style={[styles.headerTitle, { color: colors.white }]}>
                        Categories
                    </Text>
                    <Text style={[styles.headerSubtitle, { color: colors.white }]}>
                        {categoryCount} {getCategoryWord(categoryCount)} available
                    </Text>
                </View>
            </View>

            <SearchBar
                searchQuery={searchQuery}
                isListening={isListening}
                isVoiceAvailable={isVoiceAvailable}
                onSearchChange={onSearchChange}
                onVoicePress={onVoicePress}
                onClearSearch={onClearSearch}
                searchInputRef={searchInputRef}
            />
        </View>
    );
});

const EmptyState = React.memo(({ searchQuery }: { searchQuery: string }) => (
    <EmptyData
        type={EmptyDataType.NO_RECORDS}
        title={searchQuery ? 'No Categories Found' : 'No Categories Available'}
        description={searchQuery ? 'Try adjusting your search' : 'Categories will appear here'}
    />
));

const CategoriesGrid = React.memo(({
    categories,
    refreshing,
    onRefresh,
    onCategoryPress,
    contentStyle,
}: CategoriesGridProps) => {
    const colors = useTheme();

    const renderCategoryItem = useCallback(
        ({ item }: { item: Category }) => (
            <CategoryCard item={item} onPress={onCategoryPress} colors={colors} />
        ),
        [onCategoryPress, colors]
    );

    const keyExtractor = useCallback((item: Category) => item.id.toString(), []);

    return (
        <FlatList
            data={categories}
            renderItem={renderCategoryItem}
            keyExtractor={keyExtractor}
            numColumns={GRID_COLUMNS}
            contentContainerStyle={contentStyle}
            columnWrapperStyle={styles.gridRow}
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={[colors.themePrimary]}
                    tintColor={colors.themePrimary}
                />
            }
        />
    );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const CategoriesScreen: React.FC<CategoriesScreenProps> = ({ navigation }) => {
    const colors = useTheme();
    const insets = useSafeAreaInsets();
    const searchInputRef = useRef<TextInput>(null);

    // ============================================================================
    // STATE
    // ============================================================================
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>('');

    // ============================================================================
    // COMPUTED VALUES
    // ============================================================================
    const filteredCategories = useMemo(
        () => filterCategories(categories, searchQuery),
        [categories, searchQuery]
    );

    const listContentStyle = useMemo(
        () => ({
            ...styles.listContainer,
            paddingBottom: 32 + insets.bottom,
        }),
        [insets.bottom]
    );

    const showEmptyState = !loading && filteredCategories.length === 0;

    // ============================================================================
    // API HANDLERS
    // ============================================================================
    const fetchCategories = useCallback(async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            const token = await StorageManager.getItem(constant.shareInstanceKey.authToken);

            const response = await ApiManager.get({
                endpoint: constant.apiEndPoints.allCategories,
                token: token || undefined,
            });

            // Handle different response formats
            const categoryData =
                response?.success && Array.isArray(response?.data)
                    ? response.data
                    : Array.isArray(response?.data)
                        ? response.data
                        : [];

            setCategories(categoryData);
        } catch (error: any) {
            console.error('❌ Fetch Categories Error:', error);
            setCategories([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // ============================================================================
    // SEARCH HANDLERS
    // ============================================================================
    const handleSearchChange = useCallback((query: string) => {
        setSearchQuery(query);
    }, []);

    const handleClearSearch = useCallback(() => {
        setSearchQuery('');
    }, []);

    const handleVoiceResult = useCallback((text: string) => {
        console.log('Voice result received:', text);
        setSearchQuery(text);

        // Focus the input after voice search
        setTimeout(() => {
            searchInputRef.current?.focus();
        }, SEARCH_INPUT_FOCUS_DELAY);
    }, []);

    const handleVoiceError = useCallback((error: Error) => {
        console.error('Voice search error:', error);
    }, []);

    // ============================================================================
    // VOICE SEARCH HOOK
    // ============================================================================
    const { isListening, isAvailable, startListening, stopListening } = useVoiceSearch({
        onResult: handleVoiceResult,
        onError: handleVoiceError,
        language: VOICE_SEARCH_LANGUAGE,
    });

    const handleVoicePress = useCallback(() => {
        console.log('Voice button pressed, isListening:', isListening);
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    }, [isListening, startListening, stopListening]);

    // ============================================================================
    // NAVIGATION HANDLERS
    // ============================================================================
    const handleCategoryPress = useCallback(
        (category: Category) => {
            if (!validateCategory(category)) {
                console.error('❌ Invalid category data:', category);
                return;
            }

            const propsToSend: CategoryDetailScreenProps = {
                categoryId: category.id,
                categoryName: category.name,
            };

            navigation.navigate(constant.routeName.categoryDetail, { params: propsToSend });
        },
        [navigation]
    );

    const handleRefresh = useCallback(() => {
        fetchCategories(true);
    }, [fetchCategories]);

    // ============================================================================
    // EFFECTS
    // ============================================================================
    // Load categories on screen focus
    useFocusEffect(
        useCallback(() => {
            fetchCategories();
        }, [fetchCategories])
    );

    // Stop voice listening when screen loses focus
    useFocusEffect(
        useCallback(() => {
            return () => {
                if (isListening) {
                    stopListening();
                }
            };
        }, [isListening, stopListening])
    );

    // ============================================================================
    // RENDER
    // ============================================================================
    return (
        <MainContainer
            statusBarColor={colors.themePrimary}
            statusBarStyle="dark-content"
            isInternetRequired={true}
            showLoader={loading && !refreshing}
        >
            <View style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}>
                {/* Header with Search */}
                <CategoriesHeader
                    categoryCount={filteredCategories.length}
                    searchQuery={searchQuery}
                    isListening={isListening}
                    isVoiceAvailable={isAvailable}
                    onSearchChange={handleSearchChange}
                    onVoicePress={handleVoicePress}
                    onClearSearch={handleClearSearch}
                    searchInputRef={searchInputRef}
                />

                {/* Categories Grid or Empty State */}
                {showEmptyState ? (
                    <EmptyState searchQuery={searchQuery} />
                ) : (
                    <CategoriesGrid
                        categories={filteredCategories}
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        onCategoryPress={handleCategoryPress}
                        contentStyle={listContentStyle}
                    />
                )}
            </View>

            {/* Voice Search Overlay */}
            <VoiceSearchOverlay
                visible={isListening}
                isListening={isListening}
                language={VOICE_SEARCH_DISPLAY_LANGUAGE}
                colors={colors}
                onClose={stopListening}
            />
        </MainContainer>
    );
};

export default CategoriesScreen;

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerTop: {
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: fonts.size.font28,
        fontFamily: fonts.family.primaryBold,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.secondaryRegular,
        opacity: 0.9,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 5,
        gap: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: fonts.size.font15,
        fontFamily: fonts.family.primaryRegular,
        padding: 0,
    },
    listContainer: {
        padding: 16,
        paddingBottom: 32,
    },
    gridRow: {
        gap: 12,
    },
});