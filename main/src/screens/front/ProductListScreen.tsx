import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Image, TextInput, Animated } from 'react-native';
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
import { ProductDetailScreenProps } from './ProductDetailScreen';

export interface ProductListScreenProps {
    focusSearch?: boolean;
    initialQuery?: string;
}

interface Props {
    navigation: NativeStackNavigationProp<any>;
    route?: {
        params?: ProductListScreenProps;
    };
}

interface Category {
    id: number;
    name: string;
    description: string;
    image: string;
}

interface Product {
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

const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Out of Stock', color: '#FF5252', bgColor: '#FFEBEE' };
    if (stock <= 5) return { label: 'Low Stock', color: '#FF9800', bgColor: '#FFF3E0' };
    return { label: 'In Stock', color: '#4CAF50', bgColor: '#E8F5E9' };
};

const getImageUrl = (imagePath: string) => {
    return `https://gayatriorganicfarm.com/storage/${imagePath}`;
};

// Grid Item Component
const GridItem: React.FC<{
    item: Product;
    onPress: (product: Product) => void;
    onAddToCart: (product: Product) => void;
    isInCart: boolean;
}> = ({ item, onPress, onAddToCart, isInCart }) => {
    const colors = useTheme();
    const stockStatus = getStockStatus(item.stock);
    const [imageError, setImageError] = useState(false);

    return (
        <AppTouchableRipple
            style={[styles.gridCard, { backgroundColor: colors.backgroundSecondary }]}
            onPress={() => onPress(item)}
        >
            {/* Product Image */}
            <View style={styles.gridImageContainer}>
                {item.image1 && !imageError ? (
                    <Image
                        source={{ uri: getImageUrl(item.image1) }}
                        style={styles.gridImage}
                        resizeMode="cover"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <View style={[styles.gridImagePlaceholder, { backgroundColor: colors.themePrimaryLight }]}>
                        <Icon name="image-off" size={32} color={colors.themePrimary} />
                    </View>
                )}

                {/* Stock Badge */}
                <View style={[styles.stockBadge, { backgroundColor: stockStatus.bgColor }]}>
                    <Text style={[styles.stockBadgeText, { color: stockStatus.color }]}>
                        {item.stock}
                    </Text>
                </View>

                {/* Wishlist Button */}
                <View style={[styles.wishlistBtn, { backgroundColor: 'rgba(255,255,255,0.9)' }]}>
                    <Icon name="heart-outline" size={18} color={colors.themePrimary} />
                </View>
            </View>

            {/* Product Info */}
            <View style={styles.gridContent}>
                {/* Category Tag */}
                <View style={[styles.categoryTag, { backgroundColor: colors.themePrimaryLight }]}>
                    <Text style={[styles.categoryTagText, { color: colors.themePrimary }]} numberOfLines={1}>
                        {item.category.name}
                    </Text>
                </View>

                {/* Product Name */}
                <Text style={[styles.gridProductName, { color: colors.textPrimary }]} numberOfLines={2}>
                    {item.name}
                </Text>

                {/* Stock Status */}
                <View style={[styles.stockStatus, { backgroundColor: stockStatus.bgColor }]}>
                    <Icon name="package-variant" size={12} color={stockStatus.color} />
                    <Text style={[styles.stockStatusText, { color: stockStatus.color }]}>
                        {stockStatus.label}
                    </Text>
                </View>

                {/* Price and Cart */}
                <View style={styles.gridFooter}>
                    <View>
                        <Text style={[styles.priceLabel, { color: colors.textLabel }]}>Price</Text>
                        <Text style={[styles.gridPrice, { color: colors.themePrimary }]}>
                            ₹{parseFloat(item.price).toFixed(2)}
                        </Text>
                    </View>
                    <AppTouchableRipple
                        style={[
                            styles.cartButton,
                            { backgroundColor: isInCart ? colors.themePrimary : colors.themePrimaryLight }
                        ]}
                        onPress={(e) => {
                            e.stopPropagation();
                            onAddToCart(item);
                        }}
                        disabled={item.stock === 0}
                    >
                        <Icon
                            name={isInCart ? "check" : "cart-plus"}
                            size={20}
                            color={isInCart ? colors.white : colors.themePrimary}
                        />
                    </AppTouchableRipple>
                </View>
            </View>
        </AppTouchableRipple>
    );
};

// List Item Component
const ListItem: React.FC<{
    item: Product;
    onPress: (product: Product) => void;
    onAddToCart: (product: Product) => void;
    isInCart: boolean;
}> = ({ item, onPress, onAddToCart, isInCart }) => {
    const colors = useTheme();
    const stockStatus = getStockStatus(item.stock);
    const [imageError, setImageError] = useState(false);

    return (
        <AppTouchableRipple
            style={[styles.listCard, { backgroundColor: colors.backgroundSecondary }]}
            onPress={() => onPress(item)}
        >
            <View style={styles.listContent}>
                {/* Product Image */}
                <View style={styles.listImageContainer}>
                    {item.image1 && !imageError ? (
                        <Image
                            source={{ uri: getImageUrl(item.image1) }}
                            style={styles.listImage}
                            resizeMode="cover"
                            onError={() => setImageError(true)}
                        />
                    ) : (
                        <View style={[styles.listImagePlaceholder, { backgroundColor: colors.themePrimaryLight }]}>
                            <Icon name="image-off" size={28} color={colors.themePrimary} />
                        </View>
                    )}

                    {/* Stock Badge on Image */}
                    <View style={[styles.listStockBadge, { backgroundColor: stockStatus.bgColor }]}>
                        <Text style={[styles.listStockBadgeText, { color: stockStatus.color }]}>
                            {item.stock}
                        </Text>
                    </View>
                </View>

                {/* Product Info */}
                <View style={styles.listInfo}>
                    <View style={[styles.categoryTag, { backgroundColor: colors.themePrimaryLight, alignSelf: 'flex-start' }]}>
                        <Text style={[styles.categoryTagText, { color: colors.themePrimary }]} numberOfLines={1}>
                            {item.category.name}
                        </Text>
                    </View>

                    <Text style={[styles.listProductName, { color: colors.textPrimary }]} numberOfLines={1}>
                        {item.name}
                    </Text>

                    <Text style={[styles.listDescription, { color: colors.textDescription }]} numberOfLines={2}>
                        {item.description}
                    </Text>

                    <View style={styles.listFooter}>
                        <View>
                            <Text style={[styles.priceLabel, { color: colors.textLabel }]}>Price</Text>
                            <Text style={[styles.listPrice, { color: colors.themePrimary }]}>
                                ₹{parseFloat(item.price).toFixed(2)}
                            </Text>
                        </View>

                        <View style={styles.listActions}>
                            <View style={[styles.stockStatus, { backgroundColor: stockStatus.bgColor }]}>
                                <Icon name="package-variant" size={12} color={stockStatus.color} />
                                <Text style={[styles.stockStatusText, { color: stockStatus.color }]}>
                                    {stockStatus.label}
                                </Text>
                            </View>
                            <AppTouchableRipple
                                style={[
                                    styles.cartButton,
                                    { backgroundColor: isInCart ? colors.themePrimary : colors.themePrimaryLight }
                                ]}
                                onPress={(e) => {
                                    e.stopPropagation();
                                    onAddToCart(item);
                                }}
                                disabled={item.stock === 0}
                            >
                                <Icon
                                    name={isInCart ? "check" : "cart-plus"}
                                    size={20}
                                    color={isInCart ? colors.white : colors.themePrimary}
                                />
                            </AppTouchableRipple>
                        </View>
                    </View>
                </View>
            </View>
        </AppTouchableRipple>
    );
};

const ProductListScreen: React.FC<Props> = ({ navigation, route }) => {
    const colors = useTheme();
    const insets = useSafeAreaInsets();
    const { addToCart, isInCart } = useCart();
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
    const headerHeight = scrollY.interpolate({
        inputRange: [0, 50],
        outputRange: [100, 80],
        extrapolate: 'clamp',
    });

    // Load products on screen focus
    useFocusEffect(
        useCallback(() => {
            fetchProducts();
        }, [])
    );

    // Focus search if coming from home
    useEffect(() => {
        if (route?.params?.focusSearch) {
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 300);
        }
    }, [route?.params?.focusSearch]);

    const fetchProducts = async (isRefresh = false) => {
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
                applyFilters(response.data, searchQuery, selectedFilter);
            } else if (response?.data && Array.isArray(response.data)) {
                setProducts(response.data);
                applyFilters(response.data, searchQuery, selectedFilter);
            } else {
                setProducts([]);
                setFilteredProducts([]);
            }
        } catch (error: any) {
            console.error('❌ Fetch Products Error:', error);
            setProducts([]);
            setFilteredProducts([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const applyFilters = (productList: Product[], query: string, filter: typeof selectedFilter) => {
        let filtered = [...productList];

        // Apply search filter
        if (query.trim() !== '') {
            filtered = filtered.filter(
                (product) =>
                    product.name.toLowerCase().includes(query.toLowerCase()) ||
                    product.category.name.toLowerCase().includes(query.toLowerCase()) ||
                    product.description.toLowerCase().includes(query.toLowerCase())
            );
        }

        // Apply stock filter
        switch (filter) {
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
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        applyFilters(products, query, selectedFilter);
    };

    const handleFilterChange = (filter: typeof selectedFilter) => {
        setSelectedFilter(filter);
        applyFilters(products, searchQuery, filter);
    };

    const handleRefresh = () => {
        fetchProducts(true);
    };

    const handleProductPress = (product: Product) => {
        const propsToSend: ProductDetailScreenProps = {
            productId: product.id
        };
        navigation.navigate(constant.routeName.productDetail, propsToSend);
    };

    const handleAddToCart = (product: Product) => {
        if (product.stock === 0) return;

        addToCart({
            id: product.id,
            name: product.name,
            price: parseFloat(product.price),
            image: product.image1,
            unit: 'pc',
            quantity: 1
        });
    };

    const renderGridItem = ({ item }: { item: Product }) => (
        <GridItem
            item={item}
            onPress={handleProductPress}
            onAddToCart={handleAddToCart}
            isInCart={isInCart(item.id)}
        />
    );

    const renderListItem = ({ item }: { item: Product }) => (
        <ListItem
            item={item}
            onPress={handleProductPress}
            onAddToCart={handleAddToCart}
            isInCart={isInCart(item.id)}
        />
    );

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
                                style={[
                                    styles.filterChip,
                                    {
                                        backgroundColor: selectedFilter === filter.key
                                            ? colors.themePrimary
                                            : colors.backgroundSecondary
                                    }
                                ]}
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
                        numColumns={viewMode === 'grid' ? 2 : 1}
                        key={viewMode}
                        contentContainerStyle={{
                            ...styles.listContainer,
                            paddingBottom: 100 + insets.bottom
                        }}
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
        paddingVertical: 12,
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
        padding: 16,
    },
    // Grid View Styles
    gridRow: {
        gap: 12,
    },
    gridCard: {
        flex: 1,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
    },
    gridImageContainer: {
        width: '100%',
        height: 160,
        position: 'relative',
    },
    gridImage: {
        width: '100%',
        height: '100%',
    },
    gridImagePlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stockBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        minWidth: 32,
        alignItems: 'center',
    },
    stockBadgeText: {
        fontSize: fonts.size.font11,
        fontFamily: fonts.family.primaryBold,
    },
    wishlistBtn: {
        position: 'absolute',
        top: 8,
        left: 8,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    gridContent: {
        padding: 12,
    },
    categoryTag: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginBottom: 8,
        alignSelf: 'flex-start',
    },
    categoryTagText: {
        fontSize: fonts.size.font10,
        fontFamily: fonts.family.primaryBold,
        textTransform: 'uppercase',
    },
    gridProductName: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.primaryBold,
        marginBottom: 8,
        minHeight: 36,
        lineHeight: 18,
    },
    stockStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
        marginBottom: 8,
    },
    stockStatusText: {
        fontSize: fonts.size.font10,
        fontFamily: fonts.family.primaryBold,
    },
    gridFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    priceLabel: {
        fontSize: fonts.size.font10,
        fontFamily: fonts.family.secondaryRegular,
        marginBottom: 2,
    },
    gridPrice: {
        fontSize: fonts.size.font18,
        fontFamily: fonts.family.primaryBold,
    },
    cartButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },

    // List View Styles
    listCard: {
        borderRadius: 16,
        padding: 12,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    listContent: {
        flexDirection: 'row',
        gap: 12,
    },
    listImageContainer: {
        width: 100,
        height: 100,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    listImage: {
        width: '100%',
        height: '100%',
    },
    listImagePlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    listStockBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 10,
        minWidth: 24,
        alignItems: 'center',
    },
    listStockBadgeText: {
        fontSize: fonts.size.font10,
        fontFamily: fonts.family.primaryBold,
    },
    listInfo: {
        flex: 1,
        gap: 4,
    },
    listProductName: {
        fontSize: fonts.size.font16,
        fontFamily: fonts.family.primaryBold,
    },
    listDescription: {
        fontSize: fonts.size.font12,
        fontFamily: fonts.family.secondaryRegular,
        lineHeight: 16,
    },
    listFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: 'auto',
    },
    listPrice: {
        fontSize: fonts.size.font18,
        fontFamily: fonts.family.primaryBold,
    },
    listActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
});