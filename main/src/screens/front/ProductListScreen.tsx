import React, { useState, useCallback, useEffect, useRef, useMemo, memo } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TextInput, Animated } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import MainContainer from '../../container/MainContainer';
import { useTheme } from '../../contexts/ThemeProvider';
import { useCart } from '../../contexts/CardContext';
import { useWishlist } from '../../contexts/WishlistContext';
import AppTouchableRipple from '../../components/AppTouchableRipple';
import EmptyData, { EmptyDataType } from '../../components/EmptyData';
import { ProductGridItem, ProductListItem } from '../../listItems';
import VoiceSearchButton from '../../components/VoiceSearchButton';
import VoiceSearchOverlay from '../../popups/VoiceSearchOverlay';
import { useVoiceSearch } from '../../hooks/useVoiceSearch';
import ApiManager from '../../managers/ApiManager';
import StorageManager from '../../managers/StorageManager';
import fonts from '../../styles/fonts';
import constant from '../../utilities/constant';
import { ProductDetailScreenProps } from './ProductDetailScreen';
import { ProductModel, ProductListModel, ProductCategoryModel } from '../../dataModels/models';

// ============================================================================
// CONSTANTS
// ============================================================================
const SEARCH_DEBOUNCE_MS = 500;
const SEARCH_FOCUS_DELAY_MS = 300;
const VOICE_FOCUS_DELAY_MS = 100;
const VOICE_SEARCH_LANGUAGE = 'en-US';
const VOICE_SEARCH_DISPLAY_LANGUAGE = 'English (United States)';
const GRID_COLUMNS = 3;

const STOCK_FILTERS = [
    { key: 'all', label: 'All', icon: 'view-grid' },
    { key: 'inStock', label: 'In Stock', icon: 'check-circle' },
    { key: 'lowStock', label: 'Low Stock', icon: 'alert-circle' },
    { key: 'outOfStock', label: 'Out of Stock', icon: 'close-circle' },
] as const;

const HEADER_ANIMATION = {
    inputRange: [0, 50],
    minHeight: 80,
    maxHeight: 100,
};

// ============================================================================
// TYPES
// ============================================================================
export interface ProductListScreenProps {
    focusSearch?: boolean;
    initialQuery?: string;
}

interface ProductListScreenNavigationProps {
    navigation: NativeStackNavigationProp<any>;
    route?: {
        params?: ProductListScreenProps;
    };
}

export interface Category {
    id: number;
    name: string;
    description: string;
    image: string;
}

export interface Product {
    id: number;
    category_id: number;
    name: string;
    description: string;
    price: string;
    stock: number;
    image1: string;
    image2: string | null;
    image3: string | null;
    image4: string | null;
    image5: string | null;
    created_at: string;
    updated_at: string;
    category: Category;
}

type FilterKey = typeof STOCK_FILTERS[number]['key'];
type ViewMode = 'grid' | 'list';

interface ProductHeaderProps {
    itemCount: number;
    viewMode: ViewMode;
    onBack: () => void;
    onToggleView: () => void;
    scrollY: Animated.Value;
}

interface SearchBarProps {
    searchQuery: string;
    isListening: boolean;
    isVoiceAvailable: boolean;
    onSearchChange: (query: string) => void;
    onVoicePress: () => void;
    onClearSearch: () => void;
    searchInputRef: React.RefObject<TextInput>;
}

interface FiltersBarProps {
    selectedFilter: FilterKey;
    onFilterChange: (filter: FilterKey) => void;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
const filterProductsByStock = (products: Product[], filter: FilterKey): Product[] => {
    switch (filter) {
        case 'inStock':
            return products.filter((p) => p.stock > 5);
        case 'lowStock':
            return products.filter((p) => p.stock > 0 && p.stock <= 5);
        case 'outOfStock':
            return products.filter((p) => p.stock === 0);
        default:
            return products;
    }
};

const searchProductsLocally = (products: Product[], query: string): Product[] => {
    const lowerQuery = query.toLowerCase();
    return products.filter(
        (product) =>
            product.name.toLowerCase().includes(lowerQuery) ||
            product.category.name.toLowerCase().includes(lowerQuery) ||
            product.description.toLowerCase().includes(lowerQuery)
    );
};

const extractProductsData = (response: ProductListModel | any): Product[] => {
    let productsData: ProductModel[] = [];

    if (response?.status && response?.data && Array.isArray(response.data)) {
        productsData = response.data;
    } else if (response?.data && Array.isArray(response.data)) {
        productsData = response.data;
    } else {
        return [];
    }

    // Transform ProductModel to Product (calculate stock from available_units)
    return productsData.map((product: ProductModel): Product => {
        // Parse available_units string to number for stock
        const stock = parseFloat(product.available_units) || 0;

        // Transform ProductCategoryModel to Category
        const category: Category = {
            id: product.category.id,
            name: product.category.name,
            description: product.category.description,
            image: product.category.image,
        };

        return {
            id: product.id,
            category_id: product.category_id,
            name: product.name,
            description: product.description,
            price: product.price,
            stock: stock,
            image1: product.image1,
            image2: product.image2,
            image3: product.image3,
            image4: product.image4,
            image5: product.image5,
            created_at: product.created_at,
            updated_at: product.updated_at,
            category: category,
        };
    });
};

// ============================================================================
// SUB COMPONENTS
// ============================================================================
const ProductHeader = memo(({
    itemCount,
    viewMode,
    onBack,
    onToggleView,
    scrollY,
}: ProductHeaderProps) => {
    const colors = useTheme();

    const headerHeight = useMemo(
        () =>
            scrollY.interpolate({
                inputRange: HEADER_ANIMATION.inputRange,
                outputRange: [HEADER_ANIMATION.maxHeight, HEADER_ANIMATION.minHeight],
                extrapolate: 'clamp',
            }),
        [scrollY]
    );

    return (
        <Animated.View
            style={[
                styles.header,
                {
                    backgroundColor: colors.themePrimary,
                    height: headerHeight,
                },
            ]}
        >
            <View style={styles.headerTop}>
                <AppTouchableRipple style={styles.backButton} onPress={onBack}>
                    <Icon name="arrow-left" size={24} color={colors.white} />
                </AppTouchableRipple>

                <View style={styles.headerCenter}>
                    <Text style={[styles.headerTitle, { color: colors.white }]}>
                        Products
                    </Text>
                    <Text style={[styles.headerSubtitle, { color: colors.white }]}>
                        {itemCount} items
                    </Text>
                </View>

                <AppTouchableRipple style={styles.viewToggle} onPress={onToggleView}>
                    <Icon
                        name={viewMode === 'grid' ? 'view-list' : 'view-grid'}
                        size={24}
                        color={colors.white}
                    />
                </AppTouchableRipple>
            </View>
        </Animated.View>
    );
});

const SearchBar = memo(({
    searchQuery,
    isListening,
    isVoiceAvailable,
    onSearchChange,
    onVoicePress,
    onClearSearch,
    searchInputRef,
}: SearchBarProps) => {
    const colors = useTheme();

    return (
        <View
            style={[
                styles.searchContainer,
                {
                    backgroundColor: 'rgba(112, 209, 152, 0.2)',
                    borderColor: colors.themePrimary,
                },
            ]}
        >
            <Icon name="magnify" size={20} color={colors.themePrimary} />
            <TextInput
                ref={searchInputRef}
                style={[styles.searchInput, { color: colors.themePrimary }]}
                placeholder="Search products, categories..."
                placeholderTextColor={colors.themePrimary}
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
                    <Icon name="close-circle" size={20} color={colors.themePrimary} />
                </AppTouchableRipple>
            )}
        </View>
    );
});

const FilterChip = memo(({
    filter,
    isSelected,
    onPress,
}: {
    filter: typeof STOCK_FILTERS[number];
    isSelected: boolean;
    onPress: () => void;
}) => {
    const colors = useTheme();

    return (
        <AppTouchableRipple
            style={[
                styles.filterChip,
                {
                    backgroundColor: isSelected
                        ? colors.themePrimary
                        : colors.backgroundSecondary,
                },
            ]}
            onPress={onPress}
        >
            <Icon
                name={filter.icon}
                size={16}
                color={isSelected ? colors.white : colors.textLabel}
            />
            <Text
                style={[
                    styles.filterChipText,
                    {
                        color: isSelected ? colors.white : colors.textPrimary,
                    },
                ]}
            >
                {filter.label}
            </Text>
        </AppTouchableRipple>
    );
});

const FiltersBar = memo(({ selectedFilter, onFilterChange }: FiltersBarProps) => {
    const colors = useTheme();

    return (
        <View
            style={[
                styles.filtersContainer,
                { backgroundColor: colors.backgroundPrimary },
            ]}
        >
            <Text style={[styles.filterLabel, { color: colors.textLabel }]}>
                Filter by:
            </Text>
            <View style={styles.filtersRow}>
                {STOCK_FILTERS.map((filter) => (
                    <FilterChip
                        key={filter.key}
                        filter={filter}
                        isSelected={selectedFilter === filter.key}
                        onPress={() => onFilterChange(filter.key)}
                    />
                ))}
            </View>
        </View>
    );
});

const EmptyState = memo(({ searchQuery }: { searchQuery: string }) => (
    <EmptyData
        type={EmptyDataType.NO_RECORDS}
        title={searchQuery ? 'No Products Found' : 'No Products Available'}
        description={
            searchQuery
                ? 'Try adjusting your search or filters'
                : 'Products will appear here'
        }
    />
));

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const ProductListScreen: React.FC<ProductListScreenNavigationProps> = ({
    navigation,
    route,
}) => {
    const colors = useTheme();
    const insets = useSafeAreaInsets();
    const { addToCart, isInCart } = useCart();
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
    const searchInputRef = useRef<TextInput>(null);
    const scrollY = useRef(new Animated.Value(0)).current;

    // ============================================================================
    // STATE
    // ============================================================================
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>(
        route?.params?.initialQuery || ''
    );
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [selectedFilter, setSelectedFilter] = useState<FilterKey>('all');

    // ============================================================================
    // COMPUTED VALUES
    // ============================================================================
    const listContentStyle = useMemo(
        () => ({
            ...styles.listContainer,
            paddingBottom: 100 + insets.bottom,
        }),
        [insets.bottom]
    );

    const showEmptyState = !loading && filteredProducts.length === 0;

    // ============================================================================
    // API HANDLERS
    // ============================================================================
    const fetchProducts = useCallback(async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            const token = await StorageManager.getItem(
                constant.shareInstanceKey.authToken
            );

            const response = await ApiManager.get<ProductListModel>({
                endpoint: constant.apiEndPoints.allProducts,
                token: token || undefined,
                showError: true,
            });

            console.log('response products', response);

            const productsData = extractProductsData(response);
            setProducts(productsData);
        } catch (error: any) {
            console.error('❌ Fetch Products Error:', error);
            setProducts([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const searchProducts = useCallback(
        async (query: string) => {
            if (query.trim() === '') {
                const filtered = filterProductsByStock(products, selectedFilter);
                setFilteredProducts(filtered);
                return;
            }

            try {
                const token = await StorageManager.getItem(
                    constant.shareInstanceKey.authToken
                );

                const response = await ApiManager.get({
                    endpoint: constant.apiEndPoints.searchProducts,
                    params: { query: query.trim() },
                    token: token || undefined,
                    showError: false,
                });

                if (response?.data && Array.isArray(response.data)) {
                    const filtered = filterProductsByStock(response.data, selectedFilter);
                    setFilteredProducts(filtered);
                } else {
                    // Fallback to local search
                    const localResults = searchProductsLocally(products, query);
                    const filtered = filterProductsByStock(localResults, selectedFilter);
                    setFilteredProducts(filtered);
                }
            } catch (error) {
                console.error('Error searching products:', error);
                // Fallback to local search on error
                const localResults = searchProductsLocally(products, query);
                const filtered = filterProductsByStock(localResults, selectedFilter);
                setFilteredProducts(filtered);
            }
        },
        [products, selectedFilter]
    );

    // ============================================================================
    // EFFECTS
    // ============================================================================
    useFocusEffect(
        useCallback(() => {
            fetchProducts();
        }, [fetchProducts])
    );

    // Focus search input if coming from home
    useEffect(() => {
        if (route?.params?.focusSearch) {
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, SEARCH_FOCUS_DELAY_MS);
        }
    }, [route?.params?.focusSearch]);

    // Debounced search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            searchProducts(searchQuery);
        }, SEARCH_DEBOUNCE_MS);

        return () => clearTimeout(timeoutId);
    }, [searchQuery, selectedFilter, searchProducts]);

    // Apply filter when products change (non-search scenario)
    useEffect(() => {
        if (searchQuery.trim() === '') {
            const filtered = filterProductsByStock(products, selectedFilter);
            setFilteredProducts(filtered);
        }
    }, [products, selectedFilter, searchQuery]);

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
        setSearchQuery(text);
        setTimeout(() => {
            searchInputRef.current?.focus();
        }, VOICE_FOCUS_DELAY_MS);
    }, []);

    const handleVoiceError = useCallback((error: Error) => {
        console.error('Voice search error:', error);
    }, []);

    // ============================================================================
    // VOICE SEARCH
    // ============================================================================
    const { isListening, isAvailable, startListening, stopListening } =
        useVoiceSearch({
            onResult: handleVoiceResult,
            onError: handleVoiceError,
            language: VOICE_SEARCH_LANGUAGE,
        });

    const handleVoicePress = useCallback(() => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    }, [isListening, startListening, stopListening]);

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
    // NAVIGATION & INTERACTION HANDLERS
    // ============================================================================
    const handleFilterChange = useCallback((filter: FilterKey) => {
        setSelectedFilter(filter);
    }, []);

    const handleRefresh = useCallback(() => {
        fetchProducts(true);
    }, [fetchProducts]);

    const handleToggleView = useCallback(() => {
        setViewMode((prev) => (prev === 'grid' ? 'list' : 'grid'));
    }, []);

    const handleGoBack = useCallback(() => {
        navigation.goBack();
    }, [navigation]);

    const handleProductPress = useCallback(
        (product: Product) => {
            const propsToSend: ProductDetailScreenProps = {
                productId: product.id,
            };
            navigation.navigate(constant.routeName.productDetail, propsToSend);
        },
        [navigation]
    );

    const handleAddToCart = useCallback(
        (product: Product) => {
            if (product.stock === 0) return;

            addToCart({
                id: product.id,
                name: product.name,
                price: parseFloat(product.price),
                image: product.image1,
                unit: 'pc',
                quantity: 1,
            });
        },
        [addToCart]
    );

    const handleToggleFavorite = useCallback(
        (product: Product) => {
            if (isInWishlist(product.id)) {
                removeFromWishlist(product.id);
            } else {
                addToWishlist({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image1: product.image1,
                    category_id: product.category_id,
                    category: product.category,
                    stock: product.stock,
                    description: product.description,
                });
            }
        },
        [isInWishlist, addToWishlist, removeFromWishlist]
    );

    // ============================================================================
    // RENDER FUNCTIONS
    // ============================================================================
    const renderGridItem = useCallback(
        ({ item }: { item: Product }) => (
            <ProductGridItem
                item={item}
                onPress={handleProductPress}
                onAddToCart={handleAddToCart}
                isInCart={isInCart(item.id)}
                colors={colors}
                onToggleFavorite={handleToggleFavorite}
                isFavorite={isInWishlist(item.id)}
            />
        ),
        [
            handleProductPress,
            handleAddToCart,
            isInCart,
            colors,
            handleToggleFavorite,
            isInWishlist,
        ]
    );

    const renderListItem = useCallback(
        ({ item }: { item: Product }) => (
            <ProductListItem
                item={item}
                onPress={handleProductPress}
                onAddToCart={handleAddToCart}
                isInCart={isInCart(item.id)}
                colors={colors}
                onToggleFavorite={handleToggleFavorite}
                isFavorite={isInWishlist(item.id)}
            />
        ),
        [
            handleProductPress,
            handleAddToCart,
            isInCart,
            colors,
            handleToggleFavorite,
            isInWishlist,
        ]
    );

    const keyExtractor = useCallback((item: Product) => item.id.toString(), []);

    // ============================================================================
    // RENDER
    // ============================================================================
    return (
        <MainContainer
            statusBarColor={colors.themePrimary}
            statusBarStyle="light-content"
            isInternetRequired={true}
            showLoader={loading && !refreshing}
        >
            <View
                style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}
            >
                {/* Header */}
                <ProductHeader
                    itemCount={filteredProducts.length}
                    viewMode={viewMode}
                    onBack={handleGoBack}
                    onToggleView={handleToggleView}
                    scrollY={scrollY}
                />

                {/* Search Bar */}
                <SearchBar
                    searchQuery={searchQuery}
                    isListening={isListening}
                    isVoiceAvailable={isAvailable}
                    onSearchChange={handleSearchChange}
                    onVoicePress={handleVoicePress}
                    onClearSearch={handleClearSearch}
                    searchInputRef={searchInputRef}
                />

                {/* Filters */}
                <FiltersBar
                    selectedFilter={selectedFilter}
                    onFilterChange={handleFilterChange}
                />

                {/* Products List/Grid */}
                {showEmptyState ? (
                    <EmptyState searchQuery={searchQuery} />
                ) : (
                    <Animated.FlatList
                        data={filteredProducts}
                        renderItem={viewMode === 'grid' ? renderGridItem : renderListItem}
                        keyExtractor={keyExtractor}
                        numColumns={viewMode === 'grid' ? GRID_COLUMNS : 1}
                        key={viewMode}
                        contentContainerStyle={listContentStyle}
                        columnWrapperStyle={
                            viewMode === 'grid' ? styles.gridRow : undefined
                        }
                        showsVerticalScrollIndicator={false}
                        onScroll={Animated.event(
                            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                            { useNativeDriver: false }
                        )}
                        scrollEventThrottle={16}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={handleRefresh}
                                colors={[colors.themePrimary]}
                                tintColor={colors.themePrimary}
                            />
                        }
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

export default memo(ProductListScreen);

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
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 10,
    },
    backButton: {
        padding: 4,
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: fonts.size.font22,
        fontFamily: fonts.family.primaryBold,
    },
    headerSubtitle: {
        fontSize: fonts.size.font13,
        fontFamily: fonts.family.secondaryRegular,
        opacity: 0.9,
        marginTop: 2,
    },
    viewToggle: {
        padding: 4,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 5,
        gap: 12,
        borderWidth: 1,
        marginTop: 10,
        marginHorizontal: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: fonts.size.font15,
        fontFamily: fonts.family.primaryRegular,
        padding: 0,
    },
    filtersContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    filterLabel: {
        fontSize: fonts.size.font12,
        fontFamily: fonts.family.primaryMedium,
        marginBottom: 8,
    },
    filtersRow: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    filterChipText: {
        fontSize: fonts.size.font12,
        fontFamily: fonts.family.primaryMedium,
    },
    listContainer: {
        padding: 12,
    },
    gridRow: {
        gap: 8,
        justifyContent: 'space-between',
    },
});