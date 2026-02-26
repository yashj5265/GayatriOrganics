import React, { useEffect, useState, useCallback, useMemo, memo } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Alert,
    TouchableOpacity, Image, ActivityIndicator, Linking,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import MainContainer from '../../container/MainContainer';
import { useTheme } from '../../contexts/ThemeProvider';
import { useCart, MAX_CART_QUANTITY_PER_ITEM } from '../../contexts/CardContext';
import { useAddress, Address } from '../../contexts/AddressContext';
import { useWishlist } from '../../contexts/WishlistContext';
import AppTouchableRipple from '../../components/AppTouchableRipple';
import CartQuickAdjust from '../../components/CartQuickAdjust';
import FloatingCartBar, { getFloatingCartBarReservedPadding } from '../../components/FloatingCartBar';
import BannerCarousel, { Banner } from '../../components/BannerCarousel';
import VoiceSearchButton from '../../components/VoiceSearchButton';
import VoiceSearchOverlay from '../../popups/VoiceSearchOverlay';
import AddressSelectionModal from '../../popups/AddressSelectionModal';
import { useVoiceSearch } from '../../hooks/useVoiceSearch';
import StorageManager from '../../managers/StorageManager';
import ApiManager from '../../managers/ApiManager';
import fonts from '../../styles/fonts';
import constant from '../../utilities/constant';
import { ProductListScreenProps, Product as ProductListProduct } from './ProductListScreen';
import { CategoryDetailScreenProps } from './CategoryDetailScreen';
import { CategoryModel, CategoryListModel, ProductModel, ProductListModel } from '../../dataModels/models';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const MAX_CATEGORIES_DISPLAY = 8;
const MAX_FEATURED_PRODUCTS = 6;
const VOICE_SEARCH_LANGUAGE = 'en-US';
const VOICE_SEARCH_DISPLAY_LANGUAGE = 'English (United States)';
const BASE_IMAGE_URL = 'https://gayatriorganicfarm.com/storage/';

interface CarouselItem {
    id: number;
    title: string;
    subtitle: string;
    image: string;
    link: string;
    link_type: string;
    is_active: boolean;
    position: number;
    image_url: string;
    created_at: string;
    updated_at: string;
}

const CATEGORY_COLORS = ['#4caf50', '#ff9800', '#795548', '#2196f3', '#9c27b0', '#f44336'];

const CATEGORY_ICONS: Record<string, string> = {
    vegetable: '🥬', veggie: '🥬',
    fruit: '🍎',
    grain: '🌾', cereal: '🌾',
    dairy: '🥛', milk: '🥛',
    spice: '🌶️', masala: '🌶️',
    pulse: '🫘', dal: '🫘',
};

const WHY_CHOOSE_US_FEATURES = [
    { icon: '✅', text: 'Organic Products' },
    { icon: '🚚', text: 'Fast Home Delivery' },
    { icon: '💰', text: 'Best Prices Guaranteed' },
];

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface HomeScreenProps {
    navigation: NativeStackNavigationProp<any>;
}

interface HeaderProps {
    userName: string;
    selectedAddress: Address | null;
    cartCount: number;
    wishlistCount: number;
    onAddressPress: () => void;
    onCartPress: () => void;
    onWishlistPress: () => void;
}

interface SearchBarProps {
    isListening: boolean;
    isVoiceAvailable: boolean;
    onSearchPress: () => void;
    onVoicePress: () => void;
}

interface CategoryCardProps {
    category: CategoryModel;
    index: number;
    onPress: (category: CategoryModel) => void;
}

interface ProductCardProps {
    product: ProductListProduct;
    isInCart: boolean;
    cartQuantity?: number;
    onPress: (product: ProductListProduct) => void;
    onAddToCart: (product: ProductListProduct) => void;
    onUpdateQuantity?: (productId: number, quantity: number) => void;
    onRemoveFromCart?: (productId: number) => void;
    onToggleFavorite?: (product: ProductListProduct) => void;
    isFavorite?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

const getImageUrl = (imagePath: string | null | undefined): string | null => {
    if (!imagePath) return null;
    return imagePath.startsWith('http') ? imagePath : `${BASE_IMAGE_URL}${imagePath}`;
};

const getCategoryIcon = (name: string): string => {
    const lower = name.toLowerCase();
    for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
        if (lower.includes(key)) return icon;
    }
    return '📦';
};

const getCategoryColor = (index: number): string =>
    CATEGORY_COLORS[index % CATEGORY_COLORS.length];

const formatAddress = (address: Address | null): string => {
    if (!address) return 'No address selected';
    return `${address.addressLine1}, ${address.city}, ${address.state} - ${address.pincode}`;
};

const formatPrice = (price: string | number): string =>
    `₹${parseFloat(price.toString()).toFixed(2)}`;

/** Only show strike-through price when it genuinely differs from selling price. */
const shouldShowActualPrice = (actualPrice?: string, currentPrice?: string): boolean => {
    if (!actualPrice || actualPrice === '0' || actualPrice === '0.00') return false;
    if (!currentPrice) return false;
    return parseFloat(actualPrice) !== parseFloat(currentPrice);
};

// ─────────────────────────────────────────────────────────────────────────────
// HEADER
// ─────────────────────────────────────────────────────────────────────────────

const HomeHeader = memo(({
    userName, selectedAddress, cartCount, wishlistCount,
    onAddressPress, onCartPress, onWishlistPress,
}: HeaderProps) => {
    const colors = useTheme();

    return (
        <View style={[styles.header, { backgroundColor: colors.themePrimary }]}>
            <View style={styles.headerContent}>
                {/* User info + delivery address */}
                <View style={styles.userInfo}>
                    <Text style={[styles.greeting, { color: colors.white }]}>Hello,</Text>
                    <Text style={[styles.userName, { color: colors.white }]}>{userName}! 👋</Text>

                    <AppTouchableRipple
                        style={[styles.addressContainer, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
                        onPress={onAddressPress}
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

                {/* Wishlist + cart icon buttons */}
                <View style={styles.headerActions}>
                    <AppTouchableRipple
                        style={[styles.wishlistButton, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
                        onPress={onWishlistPress}
                    >
                        <Icon name="heart" size={24} color={colors.white} />
                        {wishlistCount > 0 && (
                            <View style={[styles.wishlistBadge, { backgroundColor: '#ff4444' }]}>
                                <Text style={[styles.wishlistBadgeText, { color: colors.white }]}>
                                    {wishlistCount}
                                </Text>
                            </View>
                        )}
                    </AppTouchableRipple>

                    {cartCount > 0 && (
                        <AppTouchableRipple
                            style={[styles.cartButton, { backgroundColor: colors.white }]}
                            onPress={onCartPress}
                        >
                            <Text style={styles.cartIcon}>🛒</Text>
                            <View style={[styles.cartBadge, { backgroundColor: '#ff4444' }]}>
                                <Text style={[styles.cartBadgeText, { color: colors.white }]}>
                                    {cartCount}
                                </Text>
                            </View>
                        </AppTouchableRipple>
                    )}
                </View>
            </View>
        </View>
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// SEARCH BAR
// ─────────────────────────────────────────────────────────────────────────────

const SearchBar = memo(({
    isListening, isVoiceAvailable, onSearchPress, onVoicePress,
}: SearchBarProps) => {
    const colors = useTheme();

    return (
        <View style={[styles.searchContainer, {
            backgroundColor: 'rgba(112, 209, 152, 0.2)',
            borderColor: colors.themePrimary,
        }]}>
            <TouchableOpacity
                style={styles.searchTouchable}
                onPress={onSearchPress}
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
                isAvailable={isVoiceAvailable}
                onPress={onVoicePress}
                colors={colors}
                size={20}
            />
        </View>
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// SHARED SMALL COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

const SectionHeader = memo(({ title, onViewAll }: { title: string; onViewAll?: () => void }) => {
    const colors = useTheme();
    return (
        <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
            {onViewAll && (
                <AppTouchableRipple onPress={onViewAll}>
                    <View style={styles.viewAllButton}>
                        <Text style={[styles.viewAll, { color: colors.themePrimary }]}>View All</Text>
                        <Icon name="arrow-right" size={16} color={colors.themePrimary} />
                    </View>
                </AppTouchableRipple>
            )}
        </View>
    );
});

const LoadingState = memo(({ message }: { message: string }) => {
    const colors = useTheme();
    return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.themePrimary} />
            <Text style={[styles.loadingText, { color: colors.textLabel }]}>{message}</Text>
        </View>
    );
});

const EmptyState = memo(({ message }: { message: string }) => {
    const colors = useTheme();
    return (
        <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textLabel }]}>{message}</Text>
        </View>
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY CARD
// ─────────────────────────────────────────────────────────────────────────────

const CategoryCard = memo(({ category, index, onPress }: CategoryCardProps) => {
    const colors = useTheme();
    const imageUrl = getImageUrl(category.image_url);

    return (
        <AppTouchableRipple
            style={[styles.categoryCard, { backgroundColor: colors.backgroundSecondary }]}
            onPress={() => onPress(category)}
        >
            {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.categoryImage} resizeMode="cover" />
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
});

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT CARD  ← the fix lives here
// ─────────────────────────────────────────────────────────────────────────────

const ProductCard = memo(({
    product,
    isInCart,
    cartQuantity = 0,
    onPress,
    onAddToCart,
    onUpdateQuantity,
    onRemoveFromCart,
    onToggleFavorite,
    isFavorite = false,
}: ProductCardProps) => {
    const colors = useTheme();
    const imageUrl = product.image1 ? `${BASE_IMAGE_URL}${product.image1}` : null;
    const productStock = typeof product.stock === 'number' ? product.stock : 999;

    /** True when the quantity stepper should replace the "add" button. */
    const showStepper = isInCart && cartQuantity > 0 && !!onUpdateQuantity && !!onRemoveFromCart;

    const handleFavoritePress = useCallback(
        (e: any) => { e?.stopPropagation(); onToggleFavorite?.(product); },
        [product, onToggleFavorite]
    );

    return (
        <TouchableOpacity
            style={[styles.productCard, { backgroundColor: colors.backgroundSecondary }]}
            onPress={() => onPress(product)}
            activeOpacity={0.85}
        >
            {/* Product image + wishlist overlay */}
            <View style={styles.productImageWrapper}>
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

                {onToggleFavorite && (
                    <TouchableOpacity
                        style={styles.wishlistBtn}
                        activeOpacity={0.7}
                        onPress={handleFavoritePress}
                        onPressIn={e => e.stopPropagation()}
                    >
                        <Icon
                            name={isFavorite ? 'heart' : 'heart-outline'}
                            size={16}
                            color={isFavorite ? '#FF5252' : colors.themePrimary}
                        />
                    </TouchableOpacity>
                )}
            </View>

            {/* Product name */}
            <Text
                style={[styles.productName, { color: colors.textPrimary }]}
                numberOfLines={2}
            >
                {product.name}
            </Text>

            {/* Category label */}
            <Text style={[styles.productUnit, { color: colors.textLabel }]}>
                {product.category?.name || 'Product'}
            </Text>

            {/* ── Footer ──────────────────────────────────────────────────────
             *  LAYOUT RULE (same as ProductGridItem):
             *  • Default state  → row: price left, cart-icon button right
             *  • In-cart state  → column: price on top, stepper below (full width)
             *
             *  This prevents CartQuickAdjust from overflowing the ~47% wide card.
             * ─────────────────────────────────────────────────────────────── */}
            <View style={styles.productFooter}>

                {/* Price block – always visible */}
                <View style={styles.priceBlock}>
                    {shouldShowActualPrice(product.actual_price, product.price) && (
                        <Text style={[styles.actualPrice, { color: colors.textDescription }]}>
                            {formatPrice(product.actual_price!)}
                        </Text>
                    )}
                    <Text style={[styles.productPrice, { color: colors.textPrimary }]}>
                        {formatPrice(product.price)}
                    </Text>
                </View>

                {showStepper ? (
                    /* In-cart: stepper on its own full-width row */
                    <View
                        style={styles.stepperRow}
                        onStartShouldSetResponder={() => true}
                    >
                        <CartQuickAdjust
                            quantity={cartQuantity}
                            onIncrease={() => onUpdateQuantity!(product.id, cartQuantity + 1)}
                            onDecrease={() => onUpdateQuantity!(product.id, cartQuantity - 1)}
                            onRemove={() => onRemoveFromCart!(product.id)}
                            maxQuantity={Math.min(productStock, MAX_CART_QUANTITY_PER_ITEM)}
                            disabled={productStock === 0}
                            colors={colors}
                            variant="grid"
                        />
                    </View>
                ) : (
                    /* Default: small add-to-cart button right-aligned */
                    <TouchableOpacity
                        style={[
                            styles.addButton,
                            {
                                backgroundColor: productStock === 0
                                    ? colors.buttonDisabled
                                    : colors.themePrimary,
                                opacity: productStock === 0 ? 0.6 : 1,
                            },
                        ]}
                        onPress={e => { e?.stopPropagation(); onAddToCart(product); }}
                        disabled={productStock === 0}
                        activeOpacity={0.7}
                    >
                        <Icon name="cart-plus" size={18} color={colors.white} />
                    </TouchableOpacity>
                )}
            </View>
        </TouchableOpacity>
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORIES SECTION
// ─────────────────────────────────────────────────────────────────────────────

const CategoriesSection = memo(({
    categories, loading, onCategoryPress, onViewAll,
}: {
    categories: CategoryModel[];
    loading: boolean;
    onCategoryPress: (category: CategoryModel) => void;
    onViewAll: () => void;
}) => (
    <View style={styles.section}>
        <SectionHeader title="Shop by Category" onViewAll={onViewAll} />

        {loading ? (
            <LoadingState message="Loading categories..." />
        ) : categories.length > 0 ? (
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesContainer}
            >
                {categories.map((cat, idx) => (
                    <CategoryCard key={cat.id} category={cat} index={idx} onPress={onCategoryPress} />
                ))}
            </ScrollView>
        ) : (
            <EmptyState message="No categories available" />
        )}
    </View>
));

// ─────────────────────────────────────────────────────────────────────────────
// FEATURED PRODUCTS SECTION
// ─────────────────────────────────────────────────────────────────────────────

const FeaturedProductsSection = memo(({
    products, loading, isInCart, getCartQuantity,
    onProductPress, onAddToCart, onUpdateQuantity, onRemoveFromCart,
    onToggleFavorite, isInWishlist, onViewAll,
}: {
    products: ProductListProduct[];
    loading: boolean;
    isInCart: (id: number) => boolean;
    getCartQuantity: (productId: number) => number;
    onProductPress: (product: ProductListProduct) => void;
    onAddToCart: (product: ProductListProduct) => void;
    onUpdateQuantity?: (productId: number, quantity: number) => void;
    onRemoveFromCart?: (productId: number) => void;
    onToggleFavorite?: (product: ProductListProduct) => void;
    isInWishlist?: (id: number) => boolean;
    onViewAll: () => void;
}) => (
    <View style={styles.section}>
        <SectionHeader title="Featured Products" onViewAll={onViewAll} />

        {loading ? (
            <LoadingState message="Loading products..." />
        ) : products.length > 0 ? (
            <View style={styles.productsGrid}>
                {products.map(product => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        isInCart={isInCart(product.id)}
                        cartQuantity={getCartQuantity(product.id)}
                        onPress={onProductPress}
                        onAddToCart={onAddToCart}
                        onUpdateQuantity={onUpdateQuantity}
                        onRemoveFromCart={onRemoveFromCart}
                        onToggleFavorite={onToggleFavorite}
                        isFavorite={isInWishlist?.(product.id) ?? false}
                    />
                ))}
            </View>
        ) : (
            <EmptyState message="No featured products available" />
        )}
    </View>
));

// ─────────────────────────────────────────────────────────────────────────────
// WHY CHOOSE US
// ─────────────────────────────────────────────────────────────────────────────

const WhyChooseUsSection = memo(() => {
    const colors = useTheme();
    return (
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Why Choose Us?</Text>
            <View style={[styles.featuresCard, { backgroundColor: colors.backgroundSecondary }]}>
                {WHY_CHOOSE_US_FEATURES.map((feature, idx) => (
                    <View key={idx} style={styles.featureItem}>
                        <Text style={styles.featureIcon}>{feature.icon}</Text>
                        <Text style={[styles.featureText, { color: colors.textPrimary }]}>{feature.text}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
    const colors = useTheme();
    const insets = useSafeAreaInsets();
    const {
        addToCart, isInCart, cartCount, cartTotal,
        cartItems, getCartItem, updateQuantity, removeFromCart, clearCart,
    } = useCart();
    const floatingBarPadding = useMemo(
        () => getFloatingCartBarReservedPadding(insets), [insets]
    );
    const { wishlistCount, addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
    const { selectedAddress, addresses, selectAddress } = useAddress();

    // ── State ──────────────────────────────────────────────────────────────────

    const [userName, setUserName] = useState<string>('Guest');
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [categories, setCategories] = useState<CategoryModel[]>([]);
    const [featuredProducts, setFeaturedProducts] = useState<ProductListProduct[]>([]);
    const [carousels, setCarousels] = useState<Banner[]>([]);
    const [categoriesLoading, setCategoriesLoading] = useState(false);
    const [productsLoading, setProductsLoading] = useState(false);
    const [carouselsLoading, setCarouselsLoading] = useState(false);

    // ── Load user name once on mount ───────────────────────────────────────────

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

    // ── API: Categories ────────────────────────────────────────────────────────

    const fetchCategories = useCallback(async () => {
        setCategoriesLoading(true);
        try {
            const token = await StorageManager.getItem(constant.shareInstanceKey.authToken);
            const response = await ApiManager.get<CategoryListModel>({
                endpoint: constant.apiEndPoints.allCategories,
                token: token || undefined,
                showError: false,
            });

            const data: CategoryModel[] =
                response?.data && Array.isArray(response.data) ? response.data : [];
            setCategories(data.slice(0, MAX_CATEGORIES_DISPLAY));
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setCategoriesLoading(false);
        }
    }, []);

    // ── API: Featured Products ─────────────────────────────────────────────────

    const fetchFeaturedProducts = useCallback(async () => {
        setProductsLoading(true);
        try {
            const token = await StorageManager.getItem(constant.shareInstanceKey.authToken);
            const response = await ApiManager.get<ProductListModel>({
                endpoint: constant.apiEndPoints.allProducts,
                token: token || undefined,
                showError: false,
            });

            const raw: ProductModel[] =
                response?.data && Array.isArray(response.data) ? response.data : [];

            // Transform to the ProductListProduct shape shared across the app
            const transformed: ProductListProduct[] = raw.map(p => ({
                id: p.id,
                category_id: p.category_id,
                name: p.name,
                description: p.description,
                price: p.price,
                actual_price: p.actual_price,
                stock: parseFloat(p.available_units) || 0,
                unit_type: p.unit_type,
                unit_value: p.unit_value,
                image1: p.image1,
                image2: p.image2,
                image3: p.image3,
                image4: p.image4,
                image5: p.image5,
                created_at: p.created_at,
                updated_at: p.updated_at,
                category: {
                    id: p.category.id,
                    name: p.category.name,
                    description: p.category.description,
                    image: p.category.image,
                },
            }));

            // Show only in-stock items, capped to MAX_FEATURED_PRODUCTS
            setFeaturedProducts(
                transformed.filter(p => p.stock > 0).slice(0, MAX_FEATURED_PRODUCTS)
            );
        } catch (error) {
            console.error('Error fetching featured products:', error);
        } finally {
            setProductsLoading(false);
        }
    }, []);

    // ── API: Banner Carousels ──────────────────────────────────────────────────

    const fetchCarousels = useCallback(async () => {
        setCarouselsLoading(true);
        try {
            const token = await StorageManager.getItem(constant.shareInstanceKey.authToken);
            const response = await ApiManager.get<CarouselItem[]>({
                endpoint: '/api/carousels',
                token: token || undefined,
                showError: false,
            });

            const raw: CarouselItem[] =
                response?.data && Array.isArray(response.data) ? response.data : [];

            // Only active banners, sorted by their display position
            const mapped: Banner[] = raw
                .filter(c => c.is_active)
                .sort((a, b) => a.position - b.position)
                .map(c => ({
                    id: c.id,
                    title: c.title,
                    subtitle: c.subtitle,
                    image_url: c.image_url,
                    image: c.image,
                    link: c.link,
                    link_type: c.link_type,
                    backgroundColor: '#E8F5E9',
                    textColor: '#FFFFFF',
                }));

            setCarousels(mapped);
        } catch (error) {
            console.error('Error fetching carousels:', error);
            setCarousels([]);
        } finally {
            setCarouselsLoading(false);
        }
    }, []);

    // Refresh all data when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            fetchCategories();
            fetchFeaturedProducts();
            fetchCarousels();
        }, [fetchCategories, fetchFeaturedProducts, fetchCarousels])
    );

    // ── Navigation & interaction handlers ─────────────────────────────────────

    const handleSearchPress = useCallback(() => {
        navigation.navigate(constant.routeName.products, { focusSearch: true } as ProductListScreenProps);
    }, [navigation]);

    const handleCategoryPress = useCallback((category: CategoryModel) => {
        if (!category?.id) return;
        const props: CategoryDetailScreenProps = { categoryId: category.id, categoryName: category.name };
        navigation.navigate(constant.routeName.categoryDetail, { params: props });
    }, [navigation]);

    const handleProductPress = useCallback((product: ProductListProduct) => {
        navigation.navigate(constant.routeName.productDetail, { productId: product.id });
    }, [navigation]);

    const handleViewAllProducts = useCallback(() => navigation.navigate(constant.routeName.products), [navigation]);
    const handleViewAllCategories = useCallback(() => navigation.navigate(constant.routeName.categories), [navigation]);
    const handleWishlistPress = useCallback(() => navigation.navigate(constant.routeName.wishlist), [navigation]);
    const handleCartPress = useCallback(() => navigation.navigate(constant.routeName.cart), [navigation]);

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

    // ── Cart handler ───────────────────────────────────────────────────────────

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
                unit: product.unit_type || 'kg',
                unitValue: product.unit_value,
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

    // ── Address handlers ───────────────────────────────────────────────────────

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
        } catch {
            Alert.alert('Error', 'Failed to select address. Please try again.');
        }
    }, [selectAddress]);

    const handleManageAddresses = useCallback(() => {
        setShowAddressModal(false);
        navigation.navigate(constant.routeName.addressList);
    }, [navigation]);

    // ── Voice search ───────────────────────────────────────────────────────────

    const handleVoiceResult = useCallback((text: string) => {
        navigation.navigate(constant.routeName.products, {
            focusSearch: true,
            initialQuery: text,
        } as ProductListScreenProps);
    }, [navigation]);

    const { isListening, isAvailable, startListening, stopListening } = useVoiceSearch({
        onResult: handleVoiceResult,
        onError: (error) => console.error('Voice search error:', error),
        language: VOICE_SEARCH_LANGUAGE,
    });

    const handleVoiceButtonPress = useCallback(async () => {
        if (isListening) {
            await stopListening();
        } else {
            try { await startListening(); }
            catch (error) { console.error('[HomeScreen] Error starting voice search:', error); }
        }
    }, [isListening, startListening, stopListening]);

    useFocusEffect(
        useCallback(() => {
            return () => { if (isListening) stopListening(); };
        }, [isListening, stopListening])
    );

    // ── Banner press handler ───────────────────────────────────────────────────

    const handleBannerPress = useCallback(async (banner: Banner) => {
        if (!banner.link || !banner.link_type || banner.link_type === 'none') return;

        try {
            switch (banner.link_type) {
                case 'category': {
                    const id = parseInt(banner.link, 10);
                    if (isNaN(id)) { Alert.alert('Error', 'Invalid category link'); return; }
                    navigation.navigate(constant.routeName.categoryDetail, {
                        params: { categoryId: id, categoryName: banner.title },
                    });
                    break;
                }
                case 'product': {
                    const id = parseInt(banner.link, 10);
                    if (isNaN(id)) { Alert.alert('Error', 'Invalid product link'); return; }
                    navigation.navigate(constant.routeName.productDetail, { productId: id });
                    break;
                }
                case 'external': {
                    let url = banner.link.trim();
                    if (!url.startsWith('http://') && !url.startsWith('https://')) url = `https://${url}`;
                    await Linking.openURL(url);
                    break;
                }
                case 'mobile': {
                    const phone = banner.link.trim().replace(/[^0-9+]/g, '');
                    if (!phone) { Alert.alert('Error', 'Invalid phone number'); return; }
                    await Linking.openURL(`tel:${phone}`);
                    break;
                }
                default:
                    console.log('Unknown banner link type:', banner.link_type);
            }
        } catch (error) {
            console.error('Error handling banner press:', error);
            Alert.alert('Error', 'Failed to process banner link. Please try again.');
        }
    }, [navigation]);

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <MainContainer
            statusBarColor={colors.themePrimary}
            statusBarStyle="light-content"
            isInternetRequired={false}
        >
            <ScrollView
                style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}
                contentContainerStyle={cartCount > 0 ? { paddingBottom: floatingBarPadding } : undefined}
                showsVerticalScrollIndicator={false}
            >
                <HomeHeader
                    userName={userName}
                    selectedAddress={selectedAddress}
                    cartCount={cartCount}
                    wishlistCount={wishlistCount}
                    onAddressPress={handleAddressPress}
                    onCartPress={handleCartPress}
                    onWishlistPress={handleWishlistPress}
                />

                <SearchBar
                    isListening={isListening}
                    isVoiceAvailable={isAvailable}
                    onSearchPress={handleSearchPress}
                    onVoicePress={handleVoiceButtonPress}
                />

                {!carouselsLoading && carousels.length > 0 && (
                    <BannerCarousel
                        banners={carousels}
                        colors={colors}
                        onBannerPress={handleBannerPress}
                    />
                )}

                <CategoriesSection
                    categories={categories}
                    loading={categoriesLoading}
                    onCategoryPress={handleCategoryPress}
                    onViewAll={handleViewAllCategories}
                />

                <FeaturedProductsSection
                    products={featuredProducts}
                    loading={productsLoading}
                    isInCart={isInCart}
                    getCartQuantity={id => getCartItem(id)?.quantity ?? 0}
                    onProductPress={handleProductPress}
                    onAddToCart={handleAddToCart}
                    onUpdateQuantity={updateQuantity}
                    onRemoveFromCart={removeFromCart}
                    onToggleFavorite={handleToggleFavorite}
                    isInWishlist={isInWishlist}
                    onViewAll={handleViewAllProducts}
                />

                <WhyChooseUsSection />
            </ScrollView>

            <AddressSelectionModal
                visible={showAddressModal}
                addresses={addresses}
                selectedAddress={selectedAddress}
                colors={colors}
                onSelectAddress={handleSelectAddress}
                onManageAddresses={handleManageAddresses}
                onClose={() => setShowAddressModal(false)}
            />

            <VoiceSearchOverlay
                visible={isListening}
                isListening={isListening}
                language={VOICE_SEARCH_DISPLAY_LANGUAGE}
                colors={colors}
                onClose={stopListening}
            />

            <FloatingCartBar
                itemCount={cartCount}
                total={cartTotal}
                firstItemImage={cartItems[0]?.image}
                firstItemName={cartItems[0]?.name}
                onCheckout={() => navigation.navigate(constant.routeName.cart)}
                onViewCart={() => navigation.navigate(constant.routeName.cart)}
                onClearCart={clearCart}
            />
        </MainContainer>
    );
};

export default memo(HomeScreen);

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1 },

    // ── Header ────────────────────────────────────────────────────────────────
    header: {
        paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20,
        borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    },
    headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    userInfo: { flex: 1, marginRight: 12 },
    greeting: { fontSize: fonts.size.font16, fontFamily: fonts.family.secondaryRegular, opacity: 0.9 },
    userName: { fontSize: fonts.size.font28, fontFamily: fonts.family.primaryBold, marginTop: 4 },
    addressContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginTop: 8, gap: 8 },
    addressTextContainer: { flex: 1 },
    addressText: { fontSize: fonts.size.font12, fontFamily: fonts.family.secondaryRegular },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    wishlistButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', position: 'relative' },
    wishlistBadge: { position: 'absolute', top: 5, right: 5, minWidth: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
    wishlistBadgeText: { fontSize: fonts.size.font10, fontFamily: fonts.family.primaryBold },
    cartButton: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', position: 'relative' },
    cartIcon: { fontSize: 24 },
    cartBadge: { position: 'absolute', top: 5, right: 5, minWidth: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
    cartBadgeText: { fontSize: fonts.size.font10, fontFamily: fonts.family.primaryBold },

    // ── Search ────────────────────────────────────────────────────────────────
    searchContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 5, gap: 12, borderWidth: 1, marginTop: 10, marginHorizontal: 10 },
    searchTouchable: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
    searchPlaceholder: { flex: 1, fontSize: fonts.size.font15, fontFamily: fonts.family.primaryRegular },

    // ── Section shell ─────────────────────────────────────────────────────────
    section: { paddingHorizontal: 20, marginBottom: 24 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle: { fontSize: fonts.size.font18, fontFamily: fonts.family.primaryBold },
    viewAllButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    viewAll: { fontSize: fonts.size.font14, fontFamily: fonts.family.primaryMedium },

    // ── Categories ────────────────────────────────────────────────────────────
    categoriesContainer: { paddingVertical: 8, gap: 12 },
    categoryCard: { width: 100, padding: 16, borderRadius: 12, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    categoryIconContainer: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    categoryIcon: { fontSize: 32 },
    categoryImage: { width: 60, height: 60, borderRadius: 30, marginBottom: 8 },
    categoryName: { fontSize: fonts.size.font13, fontFamily: fonts.family.primaryMedium, textAlign: 'center', marginTop: 4 },
    categoryCount: { fontSize: fonts.size.font10, fontFamily: fonts.family.secondaryRegular, textAlign: 'center', marginTop: 2 },

    // ── Products grid ─────────────────────────────────────────────────────────
    productsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },

    // ── Product card ──────────────────────────────────────────────────────────
    productCard: {
        width: '47%',
        padding: 14,
        borderRadius: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
    },
    productImageWrapper: { position: 'relative', marginBottom: 10 },
    productImage: { width: '100%', height: 118, borderRadius: 12, backgroundColor: '#f5f5f5' },
    productImagePlaceholder: { width: '100%', height: 118, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    wishlistBtn: {
        position: 'absolute', top: 8, left: 8,
        width: 30, height: 30, borderRadius: 15,
        justifyContent: 'center', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.92)',
        elevation: 1, shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
    },
    productName: { fontSize: fonts.size.font13, fontFamily: fonts.family.primaryBold, marginBottom: 4, minHeight: 36, lineHeight: 18 },
    productUnit: { fontSize: fonts.size.font11, fontFamily: fonts.family.secondaryRegular, marginBottom: 10 },

    /**
     * Footer switches between two states:
     *  Default   → row  (price left, add-button right)
     *  In-cart   → column (price on top, stepper below, full card width)
     */
    productFooter: { flexDirection: 'column', gap: 6 },

    /** Price block — always the top element in the footer column. */
    priceBlock: {},
    actualPrice: { fontSize: fonts.size.font11, fontFamily: fonts.family.secondaryRegular, textDecorationLine: 'line-through', marginBottom: 2 },
    productPrice: { fontSize: fonts.size.font15, fontFamily: fonts.family.primaryBold },

    /**
     * Stepper row — rendered only when item is in cart.
     * `alignSelf: 'flex-end'` keeps the stepper right-aligned like the
     * add-button it replaces.
     */
    stepperRow: { alignSelf: 'flex-end' },

    /** Add-to-cart button (default / not-in-cart state). */
    addButton: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', alignSelf: 'flex-end' },

    // ── Why Choose Us ─────────────────────────────────────────────────────────
    featuresCard: { borderRadius: 16, padding: 16, gap: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    featureItem: { flexDirection: 'row', alignItems: 'center' },
    featureIcon: { fontSize: 24, marginRight: 12 },
    featureText: { fontSize: fonts.size.font14, fontFamily: fonts.family.secondaryRegular },

    // ── Shared loading / empty ────────────────────────────────────────────────
    loadingContainer: { padding: 20, alignItems: 'center', justifyContent: 'center', gap: 8 },
    loadingText: { fontSize: fonts.size.font14, fontFamily: fonts.family.secondaryRegular },
    emptyContainer: { padding: 20, alignItems: 'center', justifyContent: 'center' },
    emptyText: { fontSize: fonts.size.font14, fontFamily: fonts.family.secondaryRegular },
});