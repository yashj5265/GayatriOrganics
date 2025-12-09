import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MainContainer from '../../container/MainContainer';
import { useTheme } from '../../contexts/ThemeProvider';
import fonts from '../../styles/fonts';
import AppTouchableRipple from '../../components/AppTouchableRipple';
import StorageManager from '../../managers/StorageManager';
import ApiManager from '../../managers/ApiManager';
import constant from '../../utilities/constant';
import { useCart } from '../../contexts/CardContext';
import { useAddress, Address } from '../../contexts/AddressContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { ProductListScreenProps, Product as ProductListProduct } from './ProductListScreen';
import BannerCarousel, { Banner } from '../../components/BannerCarousel';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVoiceSearch } from '../../hooks/useVoiceSearch';
import VoiceSearchButton from '../../components/VoiceSearchButton';
import VoiceSearchOverlay from '../../popups/VoiceSearchOverlay';
import AddressSelectionModal from '../../popups/AddressSelectionModal';
import { CategoryDetailScreenProps } from './CategoryDetailScreen';

interface HomeScreenProps {
    navigation: NativeStackNavigationProp<any>;
}

interface Category {
    id: number;
    name: string;
    description?: string;
    image?: string;
    image_url?: string;
    product_count?: number;
}

const getImageUrl = (imagePath: string | null | undefined) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `https://gayatriorganicfarm.com/storage/${imagePath}`;
};

// Default category icons mapping (fallback when no image)
const getCategoryIcon = (categoryName: string): string => {
    const name = categoryName.toLowerCase();
    if (name.includes('vegetable') || name.includes('veggie')) return '🥬';
    if (name.includes('fruit')) return '🍎';
    if (name.includes('grain') || name.includes('cereal')) return '🌾';
    if (name.includes('dairy') || name.includes('milk')) return '🥛';
    if (name.includes('spice') || name.includes('masala')) return '🌶️';
    if (name.includes('pulse') || name.includes('dal')) return '🫘';
    return '📦'; // Default icon
};

// Default category colors
const getCategoryColor = (index: number): string => {
    const colors = ['#4caf50', '#ff9800', '#795548', '#2196f3', '#9c27b0', '#f44336'];
    return colors[index % colors.length];
};

const BANNERS: Banner[] = [
    {
        id: 1,
        title: '🌿 100% Organic',
        subtitle: 'Fresh from farm to your doorstep',
        icon: '🌿',
        backgroundColor: '#E8F5E9',
        textColor: '#2E7D32',
    },
    {
        id: 2,
        title: '🚚 Free Delivery',
        subtitle: 'On orders above ₹500',
        icon: '🚚',
        backgroundColor: '#E3F2FD',
        textColor: '#1976D2',
    },
    {
        id: 3,
        title: '🎉 Special Offers',
        subtitle: 'Get up to 30% off on selected items',
        icon: '🎉',
        backgroundColor: '#FFF3E0',
        textColor: '#F57C00',
    },
    {
        id: 4,
        title: '💚 Farm Fresh',
        subtitle: 'Directly from local organic farms',
        icon: '💚',
        backgroundColor: '#F1F8E9',
        textColor: '#558B2F',
    },
];

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
    const colors = useTheme();
    const insets = useSafeAreaInsets();
    const { addToCart, isInCart, cartCount } = useCart();
    const { wishlistCount } = useWishlist();
    const { selectedAddress, addresses, selectAddress } = useAddress();
    const [userName, setUserName] = useState<string>('Guest');
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [featuredProducts, setFeaturedProducts] = useState<ProductListProduct[]>([]);
    const [categoriesLoading, setCategoriesLoading] = useState<boolean>(false);
    const [productsLoading, setProductsLoading] = useState<boolean>(false);

    useEffect(() => {
        const loadUserData = async () => {
            try {
                const userData = await StorageManager.getItem(constant.shareInstanceKey.userData);
                if (userData && typeof userData === 'object' && 'name' in userData) {
                    setUserName(userData.name || 'Guest');
                }
            } catch (error) {
                console.error('Error loading user data:', error);
            }
        };
        loadUserData();
    }, []);

    // Fetch categories
    const fetchCategories = useCallback(async () => {
        setCategoriesLoading(true);
        try {
            const token = await StorageManager.getItem(constant.shareInstanceKey.authToken);

            const response = await ApiManager.get({
                endpoint: constant.apiEndPoints.allCategories,
                token: token || undefined,
                showError: false, // Don't show error on home screen
            });

            if (response?.data && Array.isArray(response.data)) {
                // Take first 8 categories for home screen
                setCategories(response.data.slice(0, 8));
            } else if (response?.success && response?.data && Array.isArray(response.data)) {
                setCategories(response.data.slice(0, 8));
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setCategoriesLoading(false);
        }
    }, []);

    // Fetch featured products
    const fetchFeaturedProducts = useCallback(async () => {
        setProductsLoading(true);
        try {
            const token = await StorageManager.getItem(constant.shareInstanceKey.authToken);

            const response = await ApiManager.get({
                endpoint: constant.apiEndPoints.allProducts,
                token: token || undefined,
                showError: false, // Don't show error on home screen
            });

            if (response?.data && Array.isArray(response.data)) {
                // Take first 6 products as featured products
                // You can also filter by featured flag if your API supports it
                const products = response.data
                    .filter((p: ProductListProduct) => p.stock > 0) // Only in-stock products
                    .slice(0, 6);
                setFeaturedProducts(products);
            } else if (response?.success && response?.data && Array.isArray(response.data)) {
                const products = response.data
                    .filter((p: ProductListProduct) => p.stock > 0)
                    .slice(0, 6);
                setFeaturedProducts(products);
            }
        } catch (error) {
            console.error('Error fetching featured products:', error);
        } finally {
            setProductsLoading(false);
        }
    }, []);

    // Load data on screen focus
    useFocusEffect(
        useCallback(() => {
            fetchCategories();
            fetchFeaturedProducts();
        }, [fetchCategories, fetchFeaturedProducts])
    );

    const handleAddToCart = useCallback((product: ProductListProduct) => {
        if (product.stock === 0) {
            Alert.alert('Out of Stock', 'This product is currently out of stock.');
            return;
        }

        if (isInCart(product.id)) {
            navigation.navigate(constant.routeName.cart);
        } else {
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
            Alert.alert(
                'Added to Cart',
                `${product.name} has been added to your cart`,
                [
                    { text: 'Continue Shopping', style: 'cancel' },
                    { text: 'View Cart', onPress: () => navigation.navigate(constant.routeName.cart) },
                ]
            );
        }
    }, [isInCart, addToCart, navigation]);

    const handleProductPress = useCallback((product: ProductListProduct) => {
        navigation.navigate(constant.routeName.productDetail, { productId: product.id });
    }, [navigation]);

    const handleSearchPress = useCallback(() => {
        const propsToSend: ProductListScreenProps = {
            focusSearch: true
        };
        navigation.navigate(constant.routeName.products, propsToSend);
    }, [navigation]);

    const handleVoiceResult = useCallback((text: string) => {
        console.log('Voice result received:', text);
        // Navigate to ProductListScreen with the voice search query
        const propsToSend: ProductListScreenProps = {
            focusSearch: true,
            initialQuery: text
        };
        navigation.navigate(constant.routeName.products, propsToSend);
    }, [navigation]);

    const handleVoiceError = useCallback((error: Error) => {
        console.error('Voice search error:', error);
    }, []);

    const { isListening, isAvailable, startListening, stopListening } = useVoiceSearch({
        onResult: handleVoiceResult,
        onError: handleVoiceError,
        language: 'en-US',
    });

    // Stop listening when screen loses focus (but not when overlay is shown)
    useFocusEffect(
        useCallback(() => {
            return () => {
                // Cleanup: stop listening when screen loses focus
                // Only stop if we're actually leaving the screen (not just showing overlay)
                if (isListening) {
                    console.log('[HomeScreen] Screen losing focus, stopping voice recognition');
                    stopListening();
                }
            };
        }, [isListening, stopListening])
    );

    const handleVoiceButtonPress = useCallback(async () => {
        console.log('Voice button pressed, isListening:', isListening);

        // Prevent rapid clicks
        if (isListening) {
            // Stop listening
            console.log('[HomeScreen] Stopping voice recognition...');
            await stopListening();
        } else {
            // Ensure we're not already listening before starting
            // This prevents double-start issues
            console.log('[HomeScreen] Starting voice recognition...');
            try {
                await startListening();
            } catch (error) {
                console.error('[HomeScreen] Error starting voice search:', error);
            }
        }
    }, [isListening, startListening, stopListening]);

    const handleViewAllProducts = useCallback(() => {
        navigation.navigate(constant.routeName.products);
    }, [navigation]);

    const handleCategoryPress = useCallback((category: Category) => {
        if (!category || !category.id) {
            console.error('❌ Invalid category data:', category);
            return;
        }
        const propsToSend: CategoryDetailScreenProps = {
            categoryId: category.id,
            categoryName: category.name,
        };
        navigation.navigate(constant.routeName.categoryDetail, { params: propsToSend });
    }, [navigation]);

    const handleBannerPress = useCallback((banner: Banner) => {
        // TODO: Implement banner actions based on banner type
        // For example:
        // if (banner.id === 1) {
        //     navigation.navigate('OrganicProducts');
        // } else if (banner.id === 2) {
        //     navigation.navigate('DeliveryInfo');
        // }
        console.log('Banner pressed:', banner.title);
    }, []);

    const handleAddressPress = useCallback(() => {
        if (addresses.length === 0) {
            navigation.navigate(constant.routeName.addEditAddress, { mode: 'add' });
        } else {
            setShowAddressModal(true);
        }
    }, [addresses.length, navigation]);

    const handleSelectAddress = useCallback(async (address: Address) => {
        try {
            await selectAddress(address.id);
            setShowAddressModal(false);
        } catch (error) {
            Alert.alert('Error', 'Failed to select address. Please try again.');
        }
    }, [selectAddress]);

    const handleManageAddresses = useCallback(() => {
        setShowAddressModal(false);
        navigation.navigate(constant.routeName.addressList);
    }, [navigation]);

    const handleWishlistPress = useCallback(() => {
        navigation.navigate(constant.routeName.wishlist);
    }, [navigation]);

    const formatAddress = useCallback((address: Address | null) => {
        if (!address) return 'No address selected';
        return `${address.addressLine1}, ${address.city}, ${address.state} - ${address.pincode}`;
    }, []);


    return (
        <MainContainer
            statusBarColor={colors.themePrimary}
            statusBarStyle="light-content"
            isInternetRequired={false}
        >
            <ScrollView
                style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={[styles.header, { backgroundColor: colors.themePrimary }]}>
                    <View style={styles.headerContent}>
                        <View style={styles.userInfo}>
                            <Text style={[styles.greeting, { color: colors.white }]}>
                                Hello,
                            </Text>
                            <Text style={[styles.userName, { color: colors.white }]}>
                                {userName}! 👋
                            </Text>

                            {/* Address Display */}
                            <AppTouchableRipple
                                style={{ ...styles.addressContainer, backgroundColor: 'rgba(255,255,255,0.15)' }}
                                onPress={handleAddressPress}
                            >
                                <Icon name="map-marker" size={16} color={colors.white} />
                                <View style={styles.addressTextContainer}>
                                    <Text
                                        style={[styles.addressText, { color: colors.white }]}
                                        numberOfLines={1}
                                    >
                                        {formatAddress(selectedAddress)}
                                    </Text>
                                </View>
                                <Icon name="chevron-down" size={18} color={colors.white} />
                            </AppTouchableRipple>
                        </View>
                        <View style={styles.headerActions}>
                            <AppTouchableRipple
                                style={{ ...styles.wishlistButton, backgroundColor: 'rgba(255,255,255,0.15)' }}
                                onPress={handleWishlistPress}
                            >
                                <Icon name="heart" size={24} color={colors.white} />
                                {wishlistCount > 0 && (
                                    <View
                                        style={[
                                            styles.wishlistBadge,
                                            { backgroundColor: '#ff4444' },
                                        ]}
                                    >
                                        <Text style={[styles.wishlistBadgeText, { color: colors.white }]}>
                                            {wishlistCount}
                                        </Text>
                                    </View>
                                )}
                            </AppTouchableRipple>
                            {cartCount > 0 && (
                                <AppTouchableRipple
                                    style={{ ...styles.cartButton, backgroundColor: colors.white }}
                                    onPress={() => navigation.navigate(constant.routeName.cart)}
                                >
                                    <Text style={styles.cartIcon}>🛒</Text>
                                    <View
                                        style={[
                                            styles.cartBadge,
                                            { backgroundColor: '#ff4444' },
                                        ]}
                                    >
                                        <Text style={[styles.cartBadgeText, { color: colors.white }]}>
                                            {cartCount}
                                        </Text>
                                    </View>
                                </AppTouchableRipple>
                            )}
                        </View>
                    </View>
                </View>

                {/* Search Bar - Navigate to Product List */}
                <View style={[styles.searchContainer, { backgroundColor: 'rgba(112, 209, 152, 0.2)', borderColor: colors.themePrimary }]}>
                    <TouchableOpacity
                        style={styles.searchTouchable}
                        onPress={handleSearchPress}
                        activeOpacity={0.7}
                    >
                        <Icon name="magnify" size={20} color={colors.themePrimary} />
                        <Text style={[styles.searchPlaceholder, { color: colors.themePrimary }]}>
                            Search products
                        </Text>
                        <Icon name="arrow-right" size={20} color={colors.themePrimary} />
                    </TouchableOpacity>
                    <VoiceSearchButton
                        isListening={isListening}
                        isAvailable={isAvailable}
                        onPress={handleVoiceButtonPress}
                        colors={colors}
                        size={20}
                    />
                </View>

                {/* Banner Carousel */}
                <BannerCarousel
                    banners={BANNERS}
                    colors={colors}
                    onBannerPress={handleBannerPress}
                />

                {/* Categories */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                            Shop by Category
                        </Text>
                        <AppTouchableRipple onPress={() => navigation.navigate(constant.routeName.categories)}>
                            <View style={styles.viewAllButton}>
                                <Text style={[styles.viewAll, { color: colors.themePrimary }]}>
                                    View All
                                </Text>
                                <Icon name="arrow-right" size={16} color={colors.themePrimary} />
                            </View>
                        </AppTouchableRipple>
                    </View>
                    {categoriesLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color={colors.themePrimary} />
                            <Text style={[styles.loadingText, { color: colors.textLabel }]}>
                                Loading categories...
                            </Text>
                        </View>
                    ) : categories.length > 0 ? (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.categoriesContainer}
                        >
                            {categories.map((category, index) => {
                                const imageUrl = getImageUrl(category.image || category.image_url);
                                return (
                                    <AppTouchableRipple
                                        key={category.id}
                                        style={{ ...styles.categoryCard, backgroundColor: colors.backgroundSecondary }}
                                        onPress={() => handleCategoryPress(category)}
                                    >
                                        {imageUrl ? (
                                            <Image
                                                source={{ uri: imageUrl }}
                                                style={styles.categoryImage}
                                                resizeMode="cover"
                                            />
                                        ) : (
                                            <View style={[styles.categoryIconContainer, { backgroundColor: getCategoryColor(index) + '20' }]}>
                                                <Text style={styles.categoryIcon}>{getCategoryIcon(category.name)}</Text>
                                            </View>
                                        )}
                                        <Text style={[styles.categoryName, { color: colors.textPrimary }]} numberOfLines={2}>
                                            {category.name}
                                        </Text>
                                        {category.product_count !== undefined && (
                                            <Text style={[styles.categoryCount, { color: colors.textLabel }]}>
                                                {category.product_count} items
                                            </Text>
                                        )}
                                    </AppTouchableRipple>
                                );
                            })}
                        </ScrollView>
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Text style={[styles.emptyText, { color: colors.textLabel }]}>
                                No categories available
                            </Text>
                        </View>
                    )}
                </View>

                {/* Featured Products */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                            Featured Products
                        </Text>
                        <AppTouchableRipple onPress={handleViewAllProducts}>
                            <View style={styles.viewAllButton}>
                                <Text style={[styles.viewAll, { color: colors.themePrimary }]}>
                                    View All
                                </Text>
                                <Icon name="arrow-right" size={16} color={colors.themePrimary} />
                            </View>
                        </AppTouchableRipple>
                    </View>

                    {productsLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color={colors.themePrimary} />
                            <Text style={[styles.loadingText, { color: colors.textLabel }]}>
                                Loading products...
                            </Text>
                        </View>
                    ) : featuredProducts.length > 0 ? (
                        <View style={styles.productsGrid}>
                            {featuredProducts.map((product) => {
                                const inCart = isInCart(product.id);
                                const imageUrl = product.image1 ? `https://gayatriorganicfarm.com/storage/${product.image1}` : null;
                                return (
                                    <AppTouchableRipple
                                        key={product.id}
                                        style={{ ...styles.productCard, backgroundColor: colors.backgroundSecondary }}
                                        onPress={() => handleProductPress(product)}
                                    >
                                        {imageUrl ? (
                                            <Image
                                                source={{ uri: imageUrl }}
                                                style={styles.productImage}
                                                resizeMode="cover"
                                            />
                                        ) : (
                                            <View style={[styles.productImagePlaceholder, { backgroundColor: colors.themePrimaryLight }]}>
                                                <Icon name="image-off" size={32} color={colors.themePrimary} />
                                            </View>
                                        )}
                                        <Text
                                            style={[styles.productName, { color: colors.textPrimary }]}
                                            numberOfLines={2}
                                        >
                                            {product.name}
                                        </Text>
                                        <Text style={[styles.productUnit, { color: colors.textLabel }]}>
                                            {product.category?.name || 'Product'}
                                        </Text>
                                        <View style={styles.productFooter}>
                                            <Text
                                                style={[
                                                    styles.productPrice,
                                                    { color: colors.themePrimary },
                                                ]}
                                            >
                                                ₹{parseFloat(product.price).toFixed(2)}
                                            </Text>
                                            <AppTouchableRipple
                                                style={{
                                                    ...styles.addButton,
                                                    backgroundColor: inCart
                                                        ? colors.themePrimary
                                                        : colors.themePrimaryLight,
                                                }}
                                                onPress={(e) => {
                                                    e?.stopPropagation();
                                                    handleAddToCart(product);
                                                }}
                                            >
                                                <Text
                                                    style={[
                                                        styles.addButtonText,
                                                        {
                                                            color: inCart
                                                                ? colors.white
                                                                : colors.themePrimary,
                                                        },
                                                    ]}
                                                >
                                                    {inCart ? '✓' : '+'}
                                                </Text>
                                            </AppTouchableRipple>
                                        </View>
                                    </AppTouchableRipple>
                                );
                            })}
                        </View>
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Text style={[styles.emptyText, { color: colors.textLabel }]}>
                                No featured products available
                            </Text>
                        </View>
                    )}
                </View>

                {/* Why Choose Us */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                        Why Choose Us?
                    </Text>
                    <View
                        style={[
                            styles.featuresCard,
                            { backgroundColor: colors.backgroundSecondary },
                        ]}
                    >
                        {[
                            { icon: '✅', text: '100% Organic Products' },
                            { icon: '🚚', text: 'Fast Home Delivery' },
                            { icon: '💰', text: 'Best Prices Guaranteed' },
                        ].map((feature, index) => (
                            <View key={index} style={styles.featureItem}>
                                <Text style={styles.featureIcon}>{feature.icon}</Text>
                                <Text
                                    style={[styles.featureText, { color: colors.textPrimary }]}
                                >
                                    {feature.text}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>

            {/* Address Selection Modal */}
            <AddressSelectionModal
                visible={showAddressModal}
                addresses={addresses}
                selectedAddress={selectedAddress}
                colors={colors}
                onSelectAddress={handleSelectAddress}
                onManageAddresses={handleManageAddresses}
                onClose={() => setShowAddressModal(false)}
            />

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

export default HomeScreen;

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
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    userInfo: {
        flex: 1,
        marginRight: 12,
    },
    addressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginTop: 8,
        gap: 8,
    },
    addressTextContainer: {
        flex: 1,
    },
    addressText: {
        fontSize: fonts.size.font12,
        fontFamily: fonts.family.secondaryRegular,
    },
    greeting: {
        fontSize: fonts.size.font16,
        fontFamily: fonts.family.secondaryRegular,
        opacity: 0.9,
    },
    userName: {
        fontSize: fonts.size.font28,
        fontFamily: fonts.family.primaryBold,
        marginTop: 4,
    },
    cartButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    cartIcon: {
        fontSize: 24,
    },
    cartBadge: {
        position: 'absolute',
        top: 5,
        right: 5,
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    cartBadgeText: {
        fontSize: fonts.size.font10,
        fontFamily: fonts.family.primaryBold,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    wishlistButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    wishlistBadge: {
        position: 'absolute',
        top: 5,
        right: 5,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    wishlistBadgeText: {
        fontSize: fonts.size.font10,
        fontFamily: fonts.family.primaryBold,
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
        marginHorizontal: 10
    },
    searchTouchable: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    searchPlaceholder: {
        flex: 1,
        fontSize: fonts.size.font15,
        fontFamily: fonts.family.primaryRegular,
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: fonts.size.font18,
        fontFamily: fonts.family.primaryBold,
    },
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    viewAll: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.primaryMedium,
    },
    categoriesContainer: {
        paddingVertical: 8,
        gap: 12,
    },
    categoryCard: {
        width: 100,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    categoryIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    categoryIcon: {
        fontSize: 32,
    },
    categoryImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginBottom: 8,
    },
    categoryName: {
        fontSize: fonts.size.font13,
        fontFamily: fonts.family.primaryMedium,
        textAlign: 'center',
        marginTop: 4,
    },
    categoryCount: {
        fontSize: fonts.size.font10,
        fontFamily: fonts.family.secondaryRegular,
        textAlign: 'center',
        marginTop: 2,
    },
    productsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    productCard: {
        width: '48%',
        padding: 12,
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    productImage: {
        width: '100%',
        height: 120,
        borderRadius: 8,
        marginBottom: 8,
        backgroundColor: '#f0f0f0',
    },
    productImagePlaceholder: {
        width: '100%',
        height: 120,
        borderRadius: 8,
        marginBottom: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    productName: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.primaryMedium,
        marginBottom: 2,
        minHeight: 36,
    },
    productUnit: {
        fontSize: fonts.size.font11,
        fontFamily: fonts.family.secondaryRegular,
        marginBottom: 8,
    },
    productFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    productPrice: {
        fontSize: fonts.size.font16,
        fontFamily: fonts.family.primaryBold,
    },
    addButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButtonText: {
        fontSize: fonts.size.font20,
        fontFamily: fonts.family.primaryBold,
    },
    featuresCard: {
        borderRadius: 16,
        padding: 16,
        gap: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    featureIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    featureText: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.secondaryRegular,
    },
    loadingContainer: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    loadingText: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.secondaryRegular,
    },
    emptyContainer: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.secondaryRegular,
    },
});