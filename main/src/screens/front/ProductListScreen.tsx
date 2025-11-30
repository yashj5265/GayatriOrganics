import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TextInput, Animated } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MainContainer from '../../container/MainContainer';
import { useTheme } from '../../contexts/ThemeProvider';
import fonts from '../../styles/fonts';
import AppTouchableRipple from '../../components/AppTouchableRipple';
import EmptyData, { EmptyDataType } from '../../components/EmptyData';
import ApiManager from '../../managers/ApiManager';
import StorageManager from '../../managers/StorageManager';
import constant from '../../utilities/constant';
import { useCart } from '../../contexts/CardContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { ProductDetailScreenProps } from './ProductDetailScreen';
import { ProductGridItem, ProductListItem } from '../../components/listItems';
import { useVoiceSearch } from '../../hooks/useVoiceSearch';
import VoiceSearchButton from '../../components/VoiceSearchButton';
import VoiceSearchOverlay from '../../popups/VoiceSearchOverlay';

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


const ProductListScreen: React.FC<ProductListScreenNavigationProps> = ({ navigation, route }) => {
    const colors = useTheme();
    const insets = useSafeAreaInsets();
    const { addToCart, isInCart } = useCart();
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
    const searchInputRef = useRef<TextInput>(null);

    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>(route?.params?.initialQuery || '');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedFilter, setSelectedFilter] = useState<'all' | 'inStock' | 'lowStock' | 'outOfStock'>('all');

    // Animation for header
    const scrollY = useRef(new Animated.Value(0)).current;
    const headerHeight = useMemo(() => scrollY.interpolate({
        inputRange: [0, 50],
        outputRange: [100, 80],
        extrapolate: 'clamp',
    }), [scrollY]);

    const fetchProducts = useCallback(async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            const token = await StorageManager.getItem(constant.shareInstanceKey.authToken);

            const response = await ApiManager.get({
                endpoint: constant.apiEndPoints.allProducts,
                token: token || undefined,
                showError: true,
            });

            if (response?.status && response?.data && Array.isArray(response.data)) {
                setProducts(response.data);
            } else if (response?.data && Array.isArray(response.data)) {
                setProducts(response.data);
            } else {
                setProducts([]);
            }
        } catch (error: any) {
            console.error('❌ Fetch Products Error:', error);
            setProducts([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // Load products on screen focus
    useFocusEffect(
        useCallback(() => {
            fetchProducts();
        }, [fetchProducts])
    );

    // Focus search if coming from home
    useEffect(() => {
        if (route?.params?.focusSearch) {
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 300);
        }
    }, [route?.params?.focusSearch]);

    // Apply filters when products, search query, or filter changes
    useEffect(() => {
        let filtered = [...products];

        // Apply search filter
        if (searchQuery.trim() !== '') {
            filtered = filtered.filter(
                (product) =>
                    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    product.category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    product.description.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Apply stock filter
        switch (selectedFilter) {
            case 'inStock':
                filtered = filtered.filter(p => p.stock > 5);
                break;
            case 'lowStock':
                filtered = filtered.filter(p => p.stock > 0 && p.stock <= 5);
                break;
            case 'outOfStock':
                filtered = filtered.filter(p => p.stock === 0);
                break;
        }

        setFilteredProducts(filtered);
    }, [products, searchQuery, selectedFilter]);

    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);
    }, []);

    const handleVoiceResult = useCallback((text: string) => {
        console.log('Voice result received:', text);
        setSearchQuery(text);
        // Optionally focus the input after voice search
        setTimeout(() => {
            searchInputRef.current?.focus();
        }, 100);
    }, []);

    const handleVoiceError = useCallback((error: Error) => {
        console.error('Voice search error:', error);
    }, []);

    const { isListening, isAvailable, startListening, stopListening } = useVoiceSearch({
        onResult: handleVoiceResult,
        onError: handleVoiceError,
        language: 'en-US',
    });

    // Stop listening when screen loses focus
    useFocusEffect(
        useCallback(() => {
            return () => {
                // Cleanup: stop listening when screen loses focus
                if (isListening) {
                    stopListening();
                }
            };
        }, [isListening, stopListening])
    );

    const handleVoiceButtonPress = useCallback(() => {
        console.log('Voice button pressed, isListening:', isListening);
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    }, [isListening, startListening, stopListening]);

    const handleFilterChange = useCallback((filter: typeof selectedFilter) => {
        setSelectedFilter(filter);
    }, []);

    const handleRefresh = useCallback(() => {
        fetchProducts(true);
    }, [fetchProducts]);

    const handleProductPress = useCallback((product: Product) => {
        const propsToSend: ProductDetailScreenProps = {
            productId: product.id
        };
        navigation.navigate(constant.routeName.productDetail, propsToSend);
    }, [navigation]);

    const handleAddToCart = useCallback((product: Product) => {
        if (product.stock === 0) return;

        addToCart({
            id: product.id,
            name: product.name,
            price: parseFloat(product.price),
            image: product.image1,
            unit: 'pc',
            quantity: 1
        });
    }, [addToCart]);

    const handleToggleFavorite = useCallback((product: Product) => {
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
    }, [isInWishlist, addToWishlist, removeFromWishlist]);

    const renderGridItem = useCallback(({ item }: { item: Product }) => (
        <ProductGridItem
            item={item}
            onPress={handleProductPress}
            onAddToCart={handleAddToCart}
            isInCart={isInCart(item.id)}
            colors={colors}
            onToggleFavorite={handleToggleFavorite}
            isFavorite={isInWishlist(item.id)}
        />
    ), [handleProductPress, handleAddToCart, isInCart, colors, handleToggleFavorite, isInWishlist]);

    const renderListItem = useCallback(({ item }: { item: Product }) => (
        <ProductListItem
            item={item}
            onPress={handleProductPress}
            onAddToCart={handleAddToCart}
            isInCart={isInCart(item.id)}
            colors={colors}
            onToggleFavorite={handleToggleFavorite}
            isFavorite={isInWishlist(item.id)}
        />
    ), [handleProductPress, handleAddToCart, isInCart, colors, handleToggleFavorite, isInWishlist]);

    const listContentStyle = useMemo(() => ({
        ...styles.listContainer,
        paddingBottom: 100 + insets.bottom
    }), [insets.bottom]);

    const filters = [
        { key: 'all', label: 'All', icon: 'view-grid' },
        { key: 'inStock', label: 'In Stock', icon: 'check-circle' },
        { key: 'lowStock', label: 'Low Stock', icon: 'alert-circle' },
        { key: 'outOfStock', label: 'Out of Stock', icon: 'close-circle' },
    ] as const;

    return (
        <MainContainer
            statusBarColor={colors.themePrimary}
            statusBarStyle="light-content"
            isInternetRequired={true}
            showLoader={loading && !refreshing}
        >
            <View style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}>
                {/* Animated Header */}
                <Animated.View style={[styles.header, { backgroundColor: colors.themePrimary, height: headerHeight }]}>
                    <View style={styles.headerTop}>
                        <AppTouchableRipple
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Icon name="arrow-left" size={24} color={colors.white} />
                        </AppTouchableRipple>

                        <View style={styles.headerCenter}>
                            <Text style={[styles.headerTitle, { color: colors.white }]}>
                                Products
                            </Text>
                            <Text style={[styles.headerSubtitle, { color: colors.white }]}>
                                {filteredProducts.length} items
                            </Text>
                        </View>

                        <AppTouchableRipple
                            style={styles.viewToggle}
                            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                        >
                            <Icon
                                name={viewMode === 'grid' ? 'view-list' : 'view-grid'}
                                size={24}
                                color={colors.white}
                            />
                        </AppTouchableRipple>
                    </View>
                </Animated.View>

                {/* Search Bar - Outside Animation */}
                <View style={[styles.searchContainer, { backgroundColor: 'rgba(112, 209, 152, 0.2)', borderColor: colors.themePrimary }]}>
                    <Icon name="magnify" size={20} color={colors.themePrimary} />
                    <TextInput
                        ref={searchInputRef}
                        style={[styles.searchInput, { color: colors.themePrimary }]}
                        placeholder="Search products, categories..."
                        placeholderTextColor={colors.themePrimary}
                        value={searchQuery}
                        onChangeText={handleSearch}
                    />
                    <VoiceSearchButton
                        isListening={isListening}
                        isAvailable={isAvailable}
                        onPress={handleVoiceButtonPress}
                        colors={colors}
                        size={20}
                        showLabel={true}
                    />
                    {searchQuery.length > 0 && (
                        <AppTouchableRipple onPress={() => handleSearch('')}>
                            <Icon name="close-circle" size={20} color={colors.themePrimary} />
                        </AppTouchableRipple>
                    )}
                </View>

                {/* Filters */}
                <View style={[styles.filtersContainer, { backgroundColor: colors.backgroundPrimary }]}>
                    <Text style={[styles.filterLabel, { color: colors.textLabel }]}>Filter by:</Text>
                    <View style={styles.filtersRow}>
                        {filters.map((filter) => (
                            <AppTouchableRipple
                                key={filter.key}
                                style={{
                                    ...styles.filterChip,
                                    backgroundColor: selectedFilter === filter.key
                                        ? colors.themePrimary
                                        : colors.backgroundSecondary
                                }}
                                onPress={() => handleFilterChange(filter.key)}
                            >
                                <Icon
                                    name={filter.icon}
                                    size={16}
                                    color={selectedFilter === filter.key ? colors.white : colors.textLabel}
                                />
                                <Text
                                    style={[
                                        styles.filterChipText,
                                        {
                                            color: selectedFilter === filter.key ? colors.white : colors.textPrimary
                                        }
                                    ]}
                                >
                                    {filter.label}
                                </Text>
                            </AppTouchableRipple>
                        ))}
                    </View>
                </View>

                {/* Products List/Grid */}
                {!loading && filteredProducts.length === 0 ? (
                    <EmptyData
                        type={EmptyDataType.NO_RECORDS}
                        title={searchQuery ? 'No Products Found' : 'No Products Available'}
                        description={searchQuery ? 'Try adjusting your search or filters' : 'Products will appear here'}
                    />
                ) : (
                    <Animated.FlatList
                        data={filteredProducts}
                        renderItem={viewMode === 'grid' ? renderGridItem : renderListItem}
                        keyExtractor={(item) => item.id.toString()}
                        numColumns={viewMode === 'grid' ? 3 : 1}
                        key={viewMode}
                        contentContainerStyle={listContentStyle}
                        columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
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
                language="English (United States)"
                colors={colors}
                onClose={stopListening}
            />
        </MainContainer>
    );
};

export default ProductListScreen;

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
        paddingBottom: 10
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
    // Grid View Styles
    gridRow: {
        gap: 8,
        justifyContent: 'space-between',
    },
});