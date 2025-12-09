import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Dimensions, FlatList, RefreshControl, TextInput } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MainContainer from '../../container/MainContainer';
import { useTheme } from '../../contexts/ThemeProvider';
import fonts from '../../styles/fonts';
import AppTouchableRipple from '../../components/AppTouchableRipple';
import ApiManager from '../../managers/ApiManager';
import StorageManager from '../../managers/StorageManager';
import constant from '../../utilities/constant';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProductCard, ProductGridItem } from '../../components/listItems';
import { useCart } from '../../contexts/CardContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { Product as ProductListProduct } from '../front/ProductListScreen';
import EmptyData, { EmptyDataType } from '../../components/EmptyData';
import { useVoiceSearch } from '../../hooks/useVoiceSearch';
import VoiceSearchButton from '../../components/VoiceSearchButton';
import VoiceSearchOverlay from '../../popups/VoiceSearchOverlay';

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

const { width } = Dimensions.get('window');
const HEADER_IMAGE_HEIGHT = 240;

const CategoryDetailScreen: React.FC<CategoryDetailScreenNavigationProps> = ({ navigation, route }) => {
    const colors = useTheme();
    const insets = useSafeAreaInsets();

    // Extract categoryId from route params
    const categoryId = route.params?.params?.categoryId;

    // All hooks must be called before any conditional returns
    const [category, setCategory] = useState<CategoryDetail | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [imageError, setImageError] = useState<boolean>(false);
    const [products, setProducts] = useState<ProductListProduct[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<ProductListProduct[]>([]);
    const [productsLoading, setProductsLoading] = useState<boolean>(false);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const searchInputRef = useRef<TextInput>(null);

    const { addToCart, isInCart } = useCart();
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

    // Early return check after all hooks
    useEffect(() => {
        if (!categoryId) {
            console.error('❌ CategoryDetailScreen: categoryId is missing from route params', route.params);
            navigation.goBack();
        }
    }, [categoryId, navigation, route.params]);

    if (!categoryId) {
        return null;
    }

    const fetchCategoryDetail = useCallback(async () => {
        if (!categoryId) {
            console.error('❌ Cannot fetch category detail: categoryId is undefined');
            return;
        }

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
        } catch (error: any) {
            console.error('❌ Fetch Category Detail Error:', error);
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    }, [categoryId, navigation]);

    const fetchCategoryProducts = useCallback(async (isRefresh = false) => {
        if (!categoryId) {
            console.error('❌ Cannot fetch category products: categoryId is undefined');
            return;
        }

        if (isRefresh) {
            setRefreshing(true);
        } else {
            setProductsLoading(true);
        }

        try {
            const token = await StorageManager.getItem(constant.shareInstanceKey.authToken);

            const response = await ApiManager.get({
                endpoint: constant.apiEndPoints.allProducts,
                token: token || undefined,
                showError: false,
            });

            if (response?.data && Array.isArray(response.data)) {
                // Filter products by category_id
                const categoryProducts = response.data.filter(
                    (product: ProductListProduct) => product.category_id === categoryId
                );
                setProducts(categoryProducts);
                setFilteredProducts(categoryProducts);
            }
        } catch (error) {
            console.error('❌ Fetch Category Products Error:', error);
        } finally {
            setProductsLoading(false);
            setRefreshing(false);
        }
    }, [categoryId]);

    useEffect(() => {
        fetchCategoryDetail();
        fetchCategoryProducts();
    }, [categoryId, fetchCategoryDetail, fetchCategoryProducts]);

    const handleImageError = useCallback(() => {
        setImageError(true);
    }, []);

    const handleViewAllProducts = useCallback(() => {
        // Scroll to products section or navigate to ProductListScreen with category filter
        navigation.navigate(constant.routeName.products, {
            categoryId: categoryId,
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

    const handleRefresh = useCallback(() => {
        fetchCategoryDetail();
        fetchCategoryProducts(true);
    }, [fetchCategoryDetail, fetchCategoryProducts]);

    // Search functionality
    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);
    }, []);

    const handleVoiceResult = useCallback((text: string) => {
        console.log('Voice result received:', text);
        setSearchQuery(text);
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
                if (isListening) {
                    stopListening();
                }
            };
        }, [isListening, stopListening])
    );

    const handleVoiceButtonPress = useCallback(async () => {
        console.log('Voice button pressed, isListening:', isListening);
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

    // Filter products based on search query
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

    const scrollContentStyle = useMemo(() => ({
        ...styles.scrollContent,
        paddingBottom: 32 + insets.bottom
    }), [insets.bottom]);

    // Calculate stats
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

    if (loading || !category) {
        return (
            <MainContainer
                statusBarColor="transparent"
                statusBarStyle="light-content"
                isInternetRequired={true}
                showLoader={true}
            >
                <View style={[styles.container, { backgroundColor: colors.backgroundPrimary }]} />
            </MainContainer>
        );
    }

    return (
        <MainContainer
            statusBarColor="transparent"
            statusBarStyle="light-content"
            isInternetRequired={true}
        >
            <View style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}>
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
                    {/* Header Image */}
                    <View style={styles.headerImageContainer}>
                        {category.image_url && !imageError ? (
                            <Image
                                source={{ uri: category.image_url }}
                                style={styles.headerImage}
                                resizeMode="cover"
                                onError={handleImageError}
                            />
                        ) : (
                            <View style={[styles.headerImagePlaceholder, { backgroundColor: colors.themePrimaryLight }]}>
                                <Icon name="image-off" size={64} color={colors.themePrimary} />
                            </View>
                        )}

                        {/* Gradient Overlay */}
                        <View style={styles.gradientOverlay} />

                        {/* Back Button */}
                        <AppTouchableRipple
                            style={[styles.backButton, { backgroundColor: 'rgba(0,0,0,0.5)' }] as any}
                            onPress={() => navigation.goBack()}
                        >
                            <Icon name="arrow-left" size={24} color="#FFFFFF" />
                        </AppTouchableRipple>

                        {/* Category Badge */}
                        <View style={[styles.categoryBadge, { backgroundColor: colors.themePrimary }]}>
                            <Icon name="package-variant" size={16} color={colors.white} />
                            <Text style={styles.categoryBadgeText}>
                                {category.product_count} {category.product_count === 1 ? 'Product' : 'Products'}
                            </Text>
                        </View>
                    </View>

                    {/* Category Info Card */}
                    <View style={[styles.infoCard, { backgroundColor: colors.backgroundPrimary }]}>
                        <Text style={[styles.categoryName, { color: colors.textPrimary }]}>
                            {category.name}
                        </Text>

                        {category.description && (
                            <Text style={[styles.categoryDescription, { color: colors.textDescription }]}>
                                {category.description}
                            </Text>
                        )}

                        {/* Quick Stats */}
                        <View style={styles.statsContainer}>
                            <View style={[styles.statItem, { backgroundColor: colors.backgroundSecondary }]}>
                                <View style={[styles.statIconContainer, { backgroundColor: colors.themePrimaryLight }] as any}>
                                    <Icon name="package-variant-closed" size={20} color={colors.themePrimary} />
                                </View>
                                <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                                    {stats.totalProducts}
                                </Text>
                                <Text style={[styles.statLabel, { color: colors.textLabel }]}>
                                    {stats.totalProducts === 1 ? 'Product' : 'Products'}
                                </Text>
                            </View>

                            <View style={[styles.statItem, { backgroundColor: colors.backgroundSecondary }]}>
                                <View style={[styles.statIconContainer, { backgroundColor: '#E8F5E9' }] as any}>
                                    <Icon name="check-circle" size={20} color="#4CAF50" />
                                </View>
                                <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                                    {stats.inStockCount}
                                </Text>
                                <Text style={[styles.statLabel, { color: colors.textLabel }]}>
                                    In Stock
                                </Text>
                            </View>

                            {stats.hasProducts && (
                                <View style={[styles.statItem, { backgroundColor: colors.backgroundSecondary }]}>
                                    <View style={[styles.statIconContainer, { backgroundColor: '#FFF3E0' }] as any}>
                                        <Icon name="currency-inr" size={20} color="#FF9800" />
                                    </View>
                                    <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                                        ₹{stats.avgPrice}
                                    </Text>
                                    <Text style={[styles.statLabel, { color: colors.textLabel }]}>
                                        Avg Price
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* View All Button */}
                        {category.product_count > 0 && (
                            <AppTouchableRipple
                                style={[styles.viewAllButton, { backgroundColor: colors.themePrimary }] as any}
                                onPress={handleViewAllProducts}
                            >
                                <Text style={[styles.viewAllButtonText, { color: colors.white }]}>
                                    View All Products
                                </Text>
                                <Icon name="arrow-right" size={20} color={colors.white} />
                            </AppTouchableRipple>
                        )}
                    </View>

                    {/* Search Bar */}
                    <View style={[styles.searchContainer, { backgroundColor: 'rgba(112, 209, 152, 0.2)', borderColor: colors.themePrimary }]}>
                        <Icon name="magnify" size={20} color={colors.themePrimary} />
                        <TextInput
                            ref={searchInputRef}
                            style={[styles.searchInput, { color: colors.textPrimary }]}
                            placeholder="Search products in this category..."
                            placeholderTextColor={colors.textLabel}
                            value={searchQuery}
                            onChangeText={handleSearch}
                        />
                        <VoiceSearchButton
                            isListening={isListening}
                            isAvailable={isAvailable}
                            onPress={handleVoiceButtonPress}
                            colors={colors}
                            size={20}
                        />
                        {searchQuery.length > 0 && (
                            <AppTouchableRipple onPress={() => handleSearch('')}>
                                <Icon name="close-circle" size={20} color={colors.themePrimary} />
                            </AppTouchableRipple>
                        )}
                    </View>

                    {/* All Products Section */}
                    <View style={styles.productsSection}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                                {searchQuery.trim() ? `Search Results (${filteredProducts.length})` : `All Products (${products.length})`}
                            </Text>
                            <View style={styles.viewModeContainer}>
                                <AppTouchableRipple
                                    style={[styles.viewModeButton, viewMode === 'grid' && { backgroundColor: colors.themePrimary }] as any}
                                    onPress={() => setViewMode('grid')}
                                >
                                    <Icon
                                        name="view-grid"
                                        size={20}
                                        color={viewMode === 'grid' ? colors.white : colors.textLabel}
                                    />
                                </AppTouchableRipple>
                                <AppTouchableRipple
                                    style={[styles.viewModeButton, viewMode === 'list' && { backgroundColor: colors.themePrimary }] as any}
                                    onPress={() => setViewMode('list')}
                                >
                                    <Icon
                                        name="view-list"
                                        size={20}
                                        color={viewMode === 'list' ? colors.white : colors.textLabel}
                                    />
                                </AppTouchableRipple>
                            </View>
                        </View>

                        {productsLoading && products.length === 0 ? (
                            <View style={styles.loadingContainer}>
                                <Text style={[styles.loadingText, { color: colors.textLabel }]}>
                                    Loading products...
                                </Text>
                            </View>
                        ) : filteredProducts.length === 0 ? (
                            <EmptyData
                                type={EmptyDataType.NO_RECORDS}
                                message={searchQuery.trim() ? `No products found matching "${searchQuery}"` : "No products found in this category"}
                            />
                        ) : (
                            <FlatList
                                data={filteredProducts}
                                key={viewMode}
                                numColumns={viewMode === 'grid' ? 2 : 1}
                                keyExtractor={(item) => item.id.toString()}
                                scrollEnabled={false}
                                contentContainerStyle={styles.productsList}
                                renderItem={({ item }) => (
                                    <ProductGridItem
                                        item={item}
                                        onPress={handleProductPress}
                                        onAddToCart={handleAddToCart}
                                        isInCart={isInCart(item.id)}
                                        colors={colors}
                                        onToggleFavorite={handleToggleFavorite}
                                        isFavorite={isInWishlist(item.id)}
                                    />
                                )}
                            />
                        )}
                    </View>

                    {/* About Section */}
                    <View style={[styles.aboutSection, { backgroundColor: colors.backgroundSecondary }]}>
                        <Icon name="information" size={24} color={colors.themePrimary} />
                        <View style={styles.aboutContent}>
                            <Text style={[styles.aboutTitle, { color: colors.textPrimary }]}>
                                About This Category
                            </Text>
                            <Text style={[styles.aboutText, { color: colors.textDescription }]}>
                                All products in this category are 100% organic, fresh, and sourced directly from local farms.
                                We ensure the highest quality standards for your health and wellbeing.
                            </Text>
                        </View>
                    </View>

                    {/* Benefits Section */}
                    <View style={styles.benefitsSection}>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                            Why Choose Organic?
                        </Text>

                        <View style={[styles.benefitItem, { backgroundColor: colors.backgroundSecondary }]}>
                            <View style={[styles.benefitIcon, { backgroundColor: colors.themePrimaryLight }]}>
                                <Icon name="leaf" size={24} color={colors.themePrimary} />
                            </View>
                            <View style={styles.benefitContent}>
                                <Text style={[styles.benefitTitle, { color: colors.textPrimary }]}>
                                    100% Chemical Free
                                </Text>
                                <Text style={[styles.benefitText, { color: colors.textDescription }]}>
                                    No pesticides or harmful chemicals used
                                </Text>
                            </View>
                        </View>

                        <View style={[styles.benefitItem, { backgroundColor: colors.backgroundSecondary }]}>
                            <View style={[styles.benefitIcon, { backgroundColor: colors.themePrimaryLight }]}>
                                <Icon name="heart-pulse" size={24} color={colors.themePrimary} />
                            </View>
                            <View style={styles.benefitContent}>
                                <Text style={[styles.benefitTitle, { color: colors.textPrimary }]}>
                                    Nutrient Rich
                                </Text>
                                <Text style={[styles.benefitText, { color: colors.textDescription }]}>
                                    Higher nutritional value and better taste
                                </Text>
                            </View>
                        </View>

                        <View style={[styles.benefitItem, { backgroundColor: colors.backgroundSecondary }]}>
                            <View style={[styles.benefitIcon, { backgroundColor: colors.themePrimaryLight }]}>
                                <Icon name="earth" size={24} color={colors.themePrimary} />
                            </View>
                            <View style={styles.benefitContent}>
                                <Text style={[styles.benefitTitle, { color: colors.textPrimary }]}>
                                    Eco-Friendly
                                </Text>
                                <Text style={[styles.benefitText, { color: colors.textDescription }]}>
                                    Sustainable farming practices
                                </Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>
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

// Product Card Component

export default CategoryDetailScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 32,
    },

    // Header Image
    headerImageContainer: {
        width: '100%',
        height: HEADER_IMAGE_HEIGHT,
        position: 'relative',
    },
    headerImage: {
        width: '100%',
        height: '100%',
    },
    headerImagePlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    gradientOverlay: {
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
    },
    categoryBadge: {
        position: 'absolute',
        bottom: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    categoryBadgeText: {
        color: '#FFFFFF',
        fontSize: fonts.size.font13,
        fontFamily: fonts.family.primaryBold,
    },

    // Info Card
    infoCard: {
        marginTop: -20,
        marginHorizontal: 16,
        borderRadius: 20,
        padding: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },
    categoryName: {
        fontSize: fonts.size.font26,
        fontFamily: fonts.family.primaryBold,
        marginBottom: 8,
    },
    categoryDescription: {
        fontSize: fonts.size.font15,
        fontFamily: fonts.family.secondaryRegular,
        lineHeight: 22,
        marginBottom: 20,
    },

    // Stats
    statsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    statItem: {
        flex: 1,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        gap: 8,
    },
    statIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    statValue: {
        fontSize: fonts.size.font20,
        fontFamily: fonts.family.primaryBold,
        marginTop: 8,
    },
    statLabel: {
        fontSize: fonts.size.font12,
        fontFamily: fonts.family.secondaryRegular,
        marginTop: 4,
    },

    // View All Button
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    viewAllButtonText: {
        fontSize: fonts.size.font16,
        fontFamily: fonts.family.primaryBold,
    },

    // Products Section
    productsSection: {
        marginTop: 24,
        paddingHorizontal: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: fonts.size.font20,
        fontFamily: fonts.family.primaryBold,
    },
    seeAllText: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.primaryMedium,
    },
    productsScroll: {
        gap: 12,
        paddingRight: 16,
    },
    productsList: {
        gap: 12,
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.secondaryRegular,
    },
    searchContainer: {
        // flexDirection: 'row',
        // alignItems: 'center',
        // borderRadius: 12,
        // paddingHorizontal: 16,
        // paddingVertical: 12,
        // gap: 12,
        // borderWidth: 1,
        // marginHorizontal: 16,
        // marginTop: 16,
        // marginBottom: 8,

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


    // About Section
    aboutSection: {
        marginHorizontal: 16,
        marginTop: 24,
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        gap: 16,
    },
    aboutContent: {
        flex: 1,
    },
    aboutTitle: {
        fontSize: fonts.size.font16,
        fontFamily: fonts.family.primaryBold,
        marginBottom: 8,
    },
    aboutText: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.secondaryRegular,
        lineHeight: 20,
    },

    // Benefits Section
    benefitsSection: {
        marginHorizontal: 16,
        marginTop: 24,
    },
    benefitItem: {
        flexDirection: 'row',
        borderRadius: 16,
        padding: 16,
        marginTop: 12,
        gap: 16,
    },
    benefitIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    benefitContent: {
        flex: 1,
    },
    benefitTitle: {
        fontSize: fonts.size.font15,
        fontFamily: fonts.family.primaryBold,
        marginBottom: 4,
    },
    benefitText: {
        fontSize: fonts.size.font13,
        fontFamily: fonts.family.secondaryRegular,
        lineHeight: 18,
    },
});