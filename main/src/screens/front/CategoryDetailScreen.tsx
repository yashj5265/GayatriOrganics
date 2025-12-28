import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Dimensions, FlatList, RefreshControl, TextInput } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import MainContainer from '../../container/MainContainer';
import AppTouchableRipple from '../../components/AppTouchableRipple';
import EmptyData, { EmptyDataType } from '../../components/EmptyData';
import VoiceSearchButton from '../../components/VoiceSearchButton';
import VoiceSearchOverlay from '../../popups/VoiceSearchOverlay';
import { ProductGridItem } from '../../listItems';

import { useTheme } from '../../contexts/ThemeProvider';
import { useCart } from '../../contexts/CardContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useVoiceSearch } from '../../hooks/useVoiceSearch';

import ApiManager from '../../managers/ApiManager';
import StorageManager from '../../managers/StorageManager';
import constant from '../../utilities/constant';
import fonts from '../../styles/fonts';

import type { Product as ProductListProduct } from '../front/ProductListScreen';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface CategoryDetailScreenProps {
    categoryId: number;
    categoryName?: string;
}

interface CategoryDetailScreenNavigationProps {
    navigation: NativeStackNavigationProp<any>;
    route: RouteProp<{ params: { params: CategoryDetailScreenProps } }, 'params'>;
}

export interface Product {
    id: number;
    name: string;
    description: string;
    price: string;
    stock: number;
    image1: string;
    category_id?: number;
    category?: {
        id: number;
        name: string;
    };
}

export interface CategoryDetail {
    id: number;
    name: string;
    description: string;
    image_url: string;
    product_count: number;
    created_at: string;
    updated_at: string;
    products?: Product[];
}

interface BenefitData {
    icon: string;
    title: string;
    description: string;
    iconBgColor: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const { width } = Dimensions.get('window');
const HEADER_IMAGE_HEIGHT = 240;

const BENEFITS: BenefitData[] = [
    {
        icon: 'leaf',
        title: '100% Chemical Free',
        description: 'No pesticides or harmful chemicals used',
        iconBgColor: '#E8F5E9',
    },
    {
        icon: 'heart-pulse',
        title: 'Nutrient Rich',
        description: 'Higher nutritional value and better taste',
        iconBgColor: '#FFE8E8',
    },
    {
        icon: 'earth',
        title: 'Eco-Friendly',
        description: 'Sustainable farming practices',
        iconBgColor: '#E3F2FD',
    },
];

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

const useCategoryData = (categoryId: number | undefined, navigation: any) => {
    const [category, setCategory] = useState<CategoryDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [imageError, setImageError] = useState(false);

    const fetchCategoryDetail = useCallback(async () => {
        if (!categoryId) return;

        setLoading(true);
        try {
            const token = await StorageManager.getItem(constant.shareInstanceKey.authToken);
            const response = await ApiManager.get({
                endpoint: `${constant.apiEndPoints.getCategory}/${categoryId}`,
                token: token || undefined,
                showError: true,
            });

            if (response?.success && response?.data) {
                setCategory(response.data);
            } else if (response?.data) {
                setCategory(response.data);
            } else {
                navigation.goBack();
            }
        } catch (error) {
            console.error('Fetch Category Detail Error:', error);
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    }, [categoryId, navigation]);

    useEffect(() => {
        fetchCategoryDetail();
    }, [fetchCategoryDetail]);

    return {
        category,
        loading,
        imageError,
        setImageError,
        refetch: fetchCategoryDetail,
    };
};

const useCategoryProducts = (categoryId: number | undefined) => {
    const [products, setProducts] = useState<ProductListProduct[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const fetchProducts = useCallback(async (isRefresh = false) => {
        if (!categoryId) return;

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
                showError: false,
            });

            if (response?.data && Array.isArray(response.data)) {
                const categoryProducts = response.data.filter(
                    (product: ProductListProduct) => product.category_id === categoryId
                );
                setProducts(categoryProducts);
            }
        } catch (error) {
            console.error('Fetch Category Products Error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [categoryId]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    return {
        products,
        loading,
        refreshing,
        refetch: () => fetchProducts(true),
    };
};

const useProductSearch = (products: ProductListProduct[]) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredProducts, setFilteredProducts] = useState<ProductListProduct[]>(products);

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredProducts(products);
        } else {
            const query = searchQuery.toLowerCase().trim();
            const filtered = products.filter(
                (product) =>
                    product.name.toLowerCase().includes(query) ||
                    product.description?.toLowerCase().includes(query) ||
                    product.category?.name.toLowerCase().includes(query)
            );
            setFilteredProducts(filtered);
        }
    }, [searchQuery, products]);

    return {
        searchQuery,
        setSearchQuery,
        filteredProducts,
    };
};

// ============================================================================
// HEADER IMAGE COMPONENT
// ============================================================================

interface HeaderImageProps {
    imageUrl: string;
    hasError: boolean;
    productCount: number;
    onError: () => void;
    onBackPress: () => void;
}

const HeaderImage: React.FC<HeaderImageProps> = React.memo(({
    imageUrl,
    hasError,
    productCount,
    onError,
    onBackPress,
}) => {
    const colors = useTheme();
    const styles = useMemo(() => createHeaderStyles(colors), [colors]);

    return (
        <View style={styles.container}>
            {imageUrl && !hasError ? (
                <Image
                    source={{ uri: imageUrl }}
                    style={styles.image}
                    resizeMode="cover"
                    onError={onError}
                />
            ) : (
                <View style={styles.placeholder}>
                    <Icon name="image-off" size={64} color={colors.themePrimary} />
                </View>
            )}

            <View style={styles.gradient} />

            <AppTouchableRipple style={styles.backButton as any} onPress={onBackPress}>
                <Icon name="arrow-left" size={24} color="#FFFFFF" />
            </AppTouchableRipple>

            <View style={styles.badge}>
                <Icon name="package-variant" size={16} color={colors.white} />
                <Text style={styles.badgeText}>
                    {productCount} {productCount === 1 ? 'Product' : 'Products'}
                </Text>
            </View>
        </View>
    );
});

// ============================================================================
// STAT ITEM COMPONENT
// ============================================================================

interface StatItemProps {
    icon: string;
    iconColor: string;
    iconBgColor: string;
    value: string | number;
    label: string;
}

const StatItem: React.FC<StatItemProps> = React.memo(({
    icon,
    iconColor,
    iconBgColor,
    value,
    label,
}) => {
    const colors = useTheme();
    const styles = useMemo(() => createStatStyles(colors), [colors]);

    return (
        <View style={styles.container}>
            <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
                <Icon name={icon} size={20} color={iconColor} />
            </View>
            <Text style={styles.value}>{value}</Text>
            <Text style={styles.label}>{label}</Text>
        </View>
    );
});

// ============================================================================
// CATEGORY INFO CARD COMPONENT
// ============================================================================

interface CategoryInfoCardProps {
    category: CategoryDetail;
    stats: {
        totalProducts: number;
        inStockCount: number;
        avgPrice: string;
        hasProducts: boolean;
    };
    onViewAll: () => void;
}

const CategoryInfoCard: React.FC<CategoryInfoCardProps> = React.memo(({
    category,
    stats,
    onViewAll,
}) => {
    const colors = useTheme();
    const styles = useMemo(() => createInfoCardStyles(colors), [colors]);

    return (
        <View style={styles.card}>
            <Text style={styles.name}>{category.name}</Text>

            {category.description && (
                <Text style={styles.description}>{category.description}</Text>
            )}

            <View style={styles.statsContainer}>
                <StatItem
                    icon="package-variant-closed"
                    iconColor={colors.themePrimary}
                    iconBgColor={colors.themePrimaryLight}
                    value={stats.totalProducts}
                    label={stats.totalProducts === 1 ? 'Product' : 'Products'}
                />
                <StatItem
                    icon="check-circle"
                    iconColor="#4CAF50"
                    iconBgColor="#E8F5E9"
                    value={stats.inStockCount}
                    label="In Stock"
                />
                {stats.hasProducts && (
                    <StatItem
                        icon="currency-inr"
                        iconColor="#FF9800"
                        iconBgColor="#FFF3E0"
                        value={`₹${stats.avgPrice}`}
                        label="Avg Price"
                    />
                )}
            </View>

            {category.product_count > 0 && (
                <AppTouchableRipple style={styles.viewAllButton as any} onPress={onViewAll}>
                    <Text style={styles.viewAllButtonText}>View All Products</Text>
                    <Icon name="arrow-right" size={20} color={colors.white} />
                </AppTouchableRipple>
            )}
        </View>
    );
});

// ============================================================================
// SEARCH BAR COMPONENT
// ============================================================================

interface SearchBarProps {
    searchQuery: string;
    isListening: boolean;
    isAvailable: boolean;
    onSearch: (query: string) => void;
    onVoicePress: () => void;
    searchInputRef: React.RefObject<TextInput>;
}

const SearchBar: React.FC<SearchBarProps> = React.memo(({
    searchQuery,
    isListening,
    isAvailable,
    onSearch,
    onVoicePress,
    searchInputRef,
}) => {
    const colors = useTheme();
    const styles = useMemo(() => createSearchStyles(colors), [colors]);

    return (
        <View style={styles.container}>
            <Icon name="magnify" size={20} color={colors.themePrimary} />
            <TextInput
                ref={searchInputRef}
                style={styles.input}
                placeholder="Search products in this category..."
                placeholderTextColor={colors.textLabel}
                value={searchQuery}
                onChangeText={onSearch}
            />
            <VoiceSearchButton
                isListening={isListening}
                isAvailable={isAvailable}
                onPress={onVoicePress}
                colors={colors}
                size={20}
            />
            {searchQuery.length > 0 && (
                <AppTouchableRipple onPress={() => onSearch('')}>
                    <Icon name="close-circle" size={20} color={colors.themePrimary} />
                </AppTouchableRipple>
            )}
        </View>
    );
});

// ============================================================================
// PRODUCTS SECTION COMPONENT
// ============================================================================

interface ProductsSectionProps {
    products: ProductListProduct[];
    filteredProducts: ProductListProduct[];
    searchQuery: string;
    loading: boolean;
    viewMode: 'grid' | 'list';
    onViewModeChange: (mode: 'grid' | 'list') => void;
    onProductPress: (product: ProductListProduct | number) => void;
    onAddToCart: (product: ProductListProduct) => void;
    onToggleFavorite: (product: ProductListProduct) => void;
    isInCart: (id: number) => boolean;
    isInWishlist: (id: number) => boolean;
}

const ProductsSection: React.FC<ProductsSectionProps> = React.memo(({
    products,
    filteredProducts,
    searchQuery,
    loading,
    viewMode,
    onViewModeChange,
    onProductPress,
    onAddToCart,
    onToggleFavorite,
    isInCart,
    isInWishlist,
}) => {
    const colors = useTheme();
    const styles = useMemo(() => createProductsStyles(colors), [colors]);

    const renderProduct = useCallback(({ item }: { item: ProductListProduct }) => (
        <ProductGridItem
            item={item}
            onPress={onProductPress}
            onAddToCart={onAddToCart}
            isInCart={isInCart(item.id)}
            colors={colors}
            onToggleFavorite={onToggleFavorite}
            isFavorite={isInWishlist(item.id)}
        />
    ), [onProductPress, onAddToCart, isInCart, colors, onToggleFavorite, isInWishlist]);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>
                    {searchQuery.trim()
                        ? `Search Results (${filteredProducts.length})`
                        : `All Products (${products.length})`
                    }
                </Text>
                <View style={styles.viewModeContainer}>
                    <AppTouchableRipple
                        style={[styles.viewModeButton, viewMode === 'grid' && styles.viewModeActive] as any}
                        onPress={() => onViewModeChange('grid')}
                    >
                        <Icon
                            name="view-grid"
                            size={20}
                            color={viewMode === 'grid' ? colors.white : colors.textLabel}
                        />
                    </AppTouchableRipple>
                    <AppTouchableRipple
                        style={[styles.viewModeButton, viewMode === 'list' && styles.viewModeActive] as any}
                        onPress={() => onViewModeChange('list')}
                    >
                        <Icon
                            name="view-list"
                            size={20}
                            color={viewMode === 'list' ? colors.white : colors.textLabel}
                        />
                    </AppTouchableRipple>
                </View>
            </View>

            {loading && products.length === 0 ? (
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading products...</Text>
                </View>
            ) : filteredProducts.length === 0 ? (
                <EmptyData
                    type={EmptyDataType.NO_RECORDS}
                    message={
                        searchQuery.trim()
                            ? `No products found matching "${searchQuery}"`
                            : "No products found in this category"
                    }
                />
            ) : (
                <FlatList
                    data={filteredProducts}
                    key={viewMode}
                    numColumns={viewMode === 'grid' ? 2 : 1}
                    keyExtractor={(item) => item.id.toString()}
                    scrollEnabled={false}
                    contentContainerStyle={styles.list}
                    renderItem={renderProduct}
                    removeClippedSubviews
                    maxToRenderPerBatch={10}
                    windowSize={5}
                />
            )}
        </View>
    );
});

// ============================================================================
// BENEFIT ITEM COMPONENT
// ============================================================================

interface BenefitItemProps {
    benefit: BenefitData;
}

const BenefitItem: React.FC<BenefitItemProps> = React.memo(({ benefit }) => {
    const colors = useTheme();
    const styles = useMemo(() => createBenefitStyles(colors), [colors]);

    return (
        <View style={styles.container}>
            <View style={[styles.iconContainer, { backgroundColor: colors.themePrimaryLight }]}>
                <Icon name={benefit.icon} size={24} color={colors.themePrimary} />
            </View>
            <View style={styles.content}>
                <Text style={styles.title}>{benefit.title}</Text>
                <Text style={styles.description}>{benefit.description}</Text>
            </View>
        </View>
    );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const CategoryDetailScreen: React.FC<CategoryDetailScreenNavigationProps> = ({ navigation, route }) => {
    const colors = useTheme();
    const insets = useSafeAreaInsets();
    const searchInputRef = useRef<TextInput>(null);

    const categoryId = route.params?.params?.categoryId;

    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const { addToCart, isInCart } = useCart();
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

    // Custom hooks
    const { category, loading, imageError, setImageError, refetch: refetchCategory } = useCategoryData(categoryId, navigation);
    const { products, loading: productsLoading, refreshing, refetch: refetchProducts } = useCategoryProducts(categoryId);
    const { searchQuery, setSearchQuery, filteredProducts } = useProductSearch(products);

    // Voice search
    const handleVoiceResult = useCallback((text: string) => {
        setSearchQuery(text);
        setTimeout(() => searchInputRef.current?.focus(), 100);
    }, [setSearchQuery]);

    const { isListening, isAvailable, startListening, stopListening } = useVoiceSearch({
        onResult: handleVoiceResult,
        onError: (error) => console.error('Voice search error:', error),
        language: 'en-US',
    });

    useFocusEffect(
        useCallback(() => {
            return () => {
                if (isListening) stopListening();
            };
        }, [isListening, stopListening])
    );

    // Early return validation
    useEffect(() => {
        if (!categoryId) {
            console.error('CategoryDetailScreen: categoryId is missing');
            navigation.goBack();
        }
    }, [categoryId, navigation]);

    if (!categoryId) return null;

    // Computed values
    const stats = useMemo(() => {
        const totalProducts = products.length > 0 ? products.length : category?.product_count || 0;
        const inStockCount = products.filter(p => p.stock > 0).length;

        const prices = products
            .filter(p => p.price && !isNaN(parseFloat(p.price)))
            .map(p => parseFloat(p.price));
        const avgPrice = prices.length > 0
            ? prices.reduce((a, b) => a + b, 0) / prices.length
            : 0;

        const formattedAvgPrice = avgPrice < 1000
            ? avgPrice.toFixed(0)
            : (avgPrice / 1000).toFixed(1) + 'k';

        return {
            totalProducts,
            inStockCount,
            avgPrice: formattedAvgPrice,
            hasProducts: products.length > 0,
        };
    }, [products, category]);

    // Event handlers
    const handleRefresh = useCallback(() => {
        refetchCategory();
        refetchProducts();
    }, [refetchCategory, refetchProducts]);

    const handleViewAllProducts = useCallback(() => {
        navigation.navigate(constant.routeName.products, {
            categoryId,
            categoryName: category?.name,
        });
    }, [category, categoryId, navigation]);

    const handleProductPress = useCallback((product: ProductListProduct | number) => {
        const productId = typeof product === 'number' ? product : product.id;
        navigation.navigate(constant.routeName.productDetail, { productId });
    }, [navigation]);

    const handleAddToCart = useCallback((product: ProductListProduct) => {
        if (product.stock === 0) return;

        addToCart({
            id: product.id,
            name: product.name,
            price: parseFloat(product.price),
            image: product.image1,
            unit: 'pc',
            quantity: 1,
            categoryId: product.category_id || product.category?.id,
            productId: product.id,
        });
    }, [addToCart]);

    const handleToggleFavorite = useCallback((product: ProductListProduct) => {
        if (isInWishlist(product.id)) {
            removeFromWishlist(product.id);
        } else {
            addToWishlist({
                id: product.id,
                name: product.name,
                price: product.price,
                image1: product.image1,
                category_id: product.category_id || product.category?.id || 0,
                category: product.category || { id: 0, name: '' },
                stock: product.stock,
                description: product.description || '',
            });
        }
    }, [isInWishlist, addToWishlist, removeFromWishlist]);

    const handleVoiceButtonPress = useCallback(async () => {
        if (isListening) {
            await stopListening();
        } else {
            try {
                await startListening();
            } catch (error) {
                console.error('Error starting voice search:', error);
            }
        }
    }, [isListening, startListening, stopListening]);

    const styles = useMemo(() => createMainStyles(colors), [colors]);
    const scrollContentStyle = useMemo(() => ({
        ...styles.scrollContent,
        paddingBottom: 32 + insets.bottom
    }), [styles.scrollContent, insets.bottom]);

    if (loading || !category) {
        return (
            <MainContainer
                statusBarColor="transparent"
                statusBarStyle="light-content"
                isInternetRequired
                showLoader
            >
                <View style={[styles.container, { backgroundColor: colors.backgroundPrimary }]} />
            </MainContainer>
        );
    }

    return (
        <MainContainer
            statusBarColor="transparent"
            statusBarStyle="light-content"
            isInternetRequired
        >
            <View style={styles.container}>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={scrollContentStyle}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            colors={[colors.themePrimary]}
                            tintColor={colors.themePrimary}
                        />
                    }
                >
                    <HeaderImage
                        imageUrl={category.image_url}
                        hasError={imageError}
                        productCount={category.product_count}
                        onError={() => setImageError(true)}
                        onBackPress={() => navigation.goBack()}
                    />

                    <CategoryInfoCard
                        category={category}
                        stats={stats}
                        onViewAll={handleViewAllProducts}
                    />

                    <SearchBar
                        searchQuery={searchQuery}
                        isListening={isListening}
                        isAvailable={isAvailable}
                        onSearch={setSearchQuery}
                        onVoicePress={handleVoiceButtonPress}
                        searchInputRef={searchInputRef}
                    />

                    <ProductsSection
                        products={products}
                        filteredProducts={filteredProducts}
                        searchQuery={searchQuery}
                        loading={productsLoading}
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                        onProductPress={handleProductPress}
                        onAddToCart={handleAddToCart}
                        onToggleFavorite={handleToggleFavorite}
                        isInCart={isInCart}
                        isInWishlist={isInWishlist}
                    />

                    <AboutSection />

                    <BenefitsSection />
                </ScrollView>
            </View>

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

// ============================================================================
// STATIC SECTIONS
// ============================================================================

const AboutSection: React.FC = React.memo(() => {
    const colors = useTheme();
    const styles = useMemo(() => createAboutStyles(colors), [colors]);

    return (
        <View style={styles.container}>
            <Icon name="information" size={24} color={colors.themePrimary} />
            <View style={styles.content}>
                <Text style={styles.title}>About This Category</Text>
                <Text style={styles.text}>
                    All products in this category are 100% organic, fresh, and sourced directly from local farms.
                    We ensure the highest quality standards for your health and wellbeing.
                </Text>
            </View>
        </View>
    );
});

const BenefitsSection: React.FC = React.memo(() => {
    const colors = useTheme();
    const styles = useMemo(() => createBenefitsStyles(colors), [colors]);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Why Choose Organic?</Text>
            {BENEFITS.map((benefit, index) => (
                <BenefitItem key={index} benefit={benefit} />
            ))}
        </View>
    );
});

export default CategoryDetailScreen;

// ============================================================================
// STYLES
// ============================================================================

const createMainStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.backgroundPrimary,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 32,
    },
});

const createHeaderStyles = (colors: any) => StyleSheet.create({
    container: {
        width: '100%',
        height: HEADER_IMAGE_HEIGHT,
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    placeholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.themePrimaryLight,
    },
    gradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    badge: {
        position: 'absolute',
        bottom: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
        backgroundColor: colors.themePrimary,
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: fonts.size.font13,
        fontFamily: fonts.family.primaryBold,
    },
});

const createInfoCardStyles = (colors: any) => StyleSheet.create({
    card: {
        marginTop: -20,
        marginHorizontal: 16,
        borderRadius: 20,
        padding: 20,
        backgroundColor: colors.backgroundPrimary,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },
    name: {
        fontSize: fonts.size.font26,
        fontFamily: fonts.family.primaryBold,
        color: colors.textPrimary,
        marginBottom: 8,
    },
    description: {
        fontSize: fonts.size.font15,
        fontFamily: fonts.family.secondaryRegular,
        color: colors.textDescription,
        lineHeight: 22,
        marginBottom: 20,
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
        backgroundColor: colors.themePrimary,
    },
    viewAllButtonText: {
        fontSize: fonts.size.font16,
        fontFamily: fonts.family.primaryBold,
        color: colors.white,
    },
});

const createStatStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        gap: 8,
        backgroundColor: colors.backgroundSecondary,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    value: {
        fontSize: fonts.size.font20,
        fontFamily: fonts.family.primaryBold,
        color: colors.textPrimary,
        marginTop: 8,
    },
    label: {
        fontSize: fonts.size.font12,
        fontFamily: fonts.family.secondaryRegular,
        color: colors.textLabel,
        marginTop: 4,
    },
});

const createSearchStyles = (colors: any) => StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 5,
        gap: 12,
        borderWidth: 1,
        borderColor: colors.themePrimary,
        backgroundColor: 'rgba(112, 209, 152, 0.2)',
        marginTop: 10,
        marginHorizontal: 10,
    },
    input: {
        flex: 1,
        fontSize: fonts.size.font15,
        fontFamily: fonts.family.primaryRegular,
        color: colors.textPrimary,
    },
});

const createProductsStyles = (colors: any) => StyleSheet.create({
    container: {
        marginTop: 24,
        paddingHorizontal: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: fonts.size.font20,
        fontFamily: fonts.family.primaryBold,
        color: colors.textPrimary,
    },
    viewModeContainer: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
    viewModeButton: {
        width: 36,
        height: 36,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    viewModeActive: {
        backgroundColor: colors.themePrimary,
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.secondaryRegular,
        color: colors.textLabel,
    },
    list: {
        gap: 12,
    },
});

const createAboutStyles = (colors: any) => StyleSheet.create({
    container: {
        marginHorizontal: 16,
        marginTop: 24,
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        gap: 16,
        backgroundColor: colors.backgroundSecondary,
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: fonts.size.font16,
        fontFamily: fonts.family.primaryBold,
        color: colors.textPrimary,
        marginBottom: 8,
    },
    text: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.secondaryRegular,
        color: colors.textDescription,
        lineHeight: 20,
    },
});

const createBenefitsStyles = (colors: any) => StyleSheet.create({
    container: {
        marginHorizontal: 16,
        marginTop: 24,
    },
    title: {
        fontSize: fonts.size.font20,
        fontFamily: fonts.family.primaryBold,
        color: colors.textPrimary,
    },
});

const createBenefitStyles = (colors: any) => StyleSheet.create({
    container: {
        flexDirection: 'row',
        borderRadius: 16,
        padding: 16,
        marginTop: 12,
        gap: 16,
        backgroundColor: colors.backgroundSecondary,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: fonts.size.font15,
        fontFamily: fonts.family.primaryBold,
        color: colors.textPrimary,
        marginBottom: 4,
    },
    description: {
        fontSize: fonts.size.font13,
        fontFamily: fonts.family.secondaryRegular,
        color: colors.textDescription,
        lineHeight: 18,
    },
});