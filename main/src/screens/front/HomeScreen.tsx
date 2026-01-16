import React, { useEffect, useState, useCallback, useMemo, memo } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import MainContainer from '../../container/MainContainer';
import { useTheme } from '../../contexts/ThemeProvider';
import { useCart } from '../../contexts/CardContext';
import { useAddress, Address } from '../../contexts/AddressContext';
import { useWishlist } from '../../contexts/WishlistContext';
import AppTouchableRipple from '../../components/AppTouchableRipple';
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

// ============================================================================
// CONSTANTS
// ============================================================================
const MAX_CATEGORIES_DISPLAY = 8;
const MAX_FEATURED_PRODUCTS = 6;
const VOICE_SEARCH_LANGUAGE = 'en-US';
const VOICE_SEARCH_DISPLAY_LANGUAGE = 'English (United States)';
const BASE_IMAGE_URL = 'https://gayatriorganicfarm.com/storage/';

// Carousel API Response Interface
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
    vegetable: '🥬',
    veggie: '🥬',
    fruit: '🍎',
    grain: '🌾',
    cereal: '🌾',
    dairy: '🥛',
    milk: '🥛',
    spice: '🌶️',
    masala: '🌶️',
    pulse: '🫘',
    dal: '🫘',
};

const WHY_CHOOSE_US_FEATURES = [
    { icon: '✅', text: '100% Organic Products' },
    { icon: '🚚', text: 'Fast Home Delivery' },
    { icon: '💰', text: 'Best Prices Guaranteed' },
];

// ============================================================================
// TYPES
// ============================================================================
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
    onPress: (product: ProductListProduct) => void;
    onAddToCart: (product: ProductListProduct) => void;
}

interface SectionProps {
    title: string;
    onViewAll?: () => void;
    loading?: boolean;
    isEmpty?: boolean;
    emptyMessage?: string;
    children: React.ReactNode;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
const getImageUrl = (imagePath: string | null | undefined): string | null => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `${BASE_IMAGE_URL}${imagePath}`;
};

const getCategoryIcon = (categoryName: string): string => {
    const name = categoryName.toLowerCase();
    for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
        if (name.includes(key)) return icon;
    }
    return '📦';
};

const getCategoryColor = (index: number): string => {
    return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
};

const formatAddress = (address: Address | null): string => {
    if (!address) return 'No address selected';
    return `${address.addressLine1}, ${address.city}, ${address.state} - ${address.pincode}`;
};

const formatPrice = (price: string | number): string => {
    return `₹${parseFloat(price.toString()).toFixed(2)}`;
};

// ============================================================================
// SUB COMPONENTS
// ============================================================================
const HomeHeader = memo(({
    userName,
    selectedAddress,
    cartCount,
    wishlistCount,
    onAddressPress,
    onCartPress,
    onWishlistPress,
}: HeaderProps) => {
    const colors = useTheme();

    return (
        <View style={[styles.header, { backgroundColor: colors.themePrimary }]}>
            <View style={styles.headerContent}>
                {/* User Info & Address */}
                <View style={styles.userInfo}>
                    <Text style={[styles.greeting, { color: colors.white }]}>
                        Hello,
                    </Text>
                    <Text style={[styles.userName, { color: colors.white }]}>
                        {userName}! 👋
                    </Text>

                    <AppTouchableRipple
                        style={[styles.addressContainer, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
                        onPress={onAddressPress}
                    >
                        <Icon name="map-marker" size={16} color={colors.white} />
                        <View style={styles.addressTextContainer}>
                            <Text style={[styles.addressText, { color: colors.white }]} numberOfLines={1}>
                                {formatAddress(selectedAddress)}
                            </Text>
                        </View>
                        <Icon name="chevron-down" size={18} color={colors.white} />
                    </AppTouchableRipple>
                </View>

                {/* Header Actions */}
                <View style={styles.headerActions}>
                    {/* Wishlist Button */}
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

                    {/* Cart Button */}
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

const SearchBar = memo(({ isListening, isVoiceAvailable, onSearchPress, onVoicePress }: SearchBarProps) => {
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

const SectionHeader = memo(({ title, onViewAll }: { title: string; onViewAll?: () => void }) => {
    const colors = useTheme();

    return (
        <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                {title}
            </Text>
            {onViewAll && (
                <AppTouchableRipple onPress={onViewAll}>
                    <View style={styles.viewAllButton}>
                        <Text style={[styles.viewAll, { color: colors.themePrimary }]}>
                            View All
                        </Text>
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
            <Text style={[styles.loadingText, { color: colors.textLabel }]}>
                {message}
            </Text>
        </View>
    );
});

const EmptyState = memo(({ message }: { message: string }) => {
    const colors = useTheme();

    return (
        <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textLabel }]}>
                {message}
            </Text>
        </View>
    );
});

const CategoryCard = memo(({ category, index, onPress }: CategoryCardProps) => {
    const colors = useTheme();
    const imageUrl = getImageUrl(category.image_url);

    return (
        <AppTouchableRipple
            style={[styles.categoryCard, { backgroundColor: colors.backgroundSecondary }]}
            onPress={() => onPress(category)}
        >
            {imageUrl ? (
                <Image
                    source={{ uri: imageUrl }}
                    style={styles.categoryImage}
                    resizeMode="cover"
                />
            ) : (
                <View
                    style={[
                        styles.categoryIconContainer,
                        { backgroundColor: getCategoryColor(index) + '20' },
                    ]}
                >
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

const ProductCard = memo(({ product, isInCart, onPress, onAddToCart }: ProductCardProps) => {
    const colors = useTheme();
    const imageUrl = product.image1 ? `${BASE_IMAGE_URL}${product.image1}` : null;

    return (
        <TouchableOpacity
            style={[styles.productCard, { backgroundColor: colors.backgroundSecondary }]}
            onPress={() => onPress(product)}
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

            <Text style={[styles.productName, { color: colors.textPrimary }]} numberOfLines={2}>
                {product.name}
            </Text>

            <Text style={[styles.productUnit, { color: colors.textLabel }]}>
                {product.category?.name || 'Product'}
            </Text>

            <View style={styles.productFooter}>
                <Text style={[styles.productPrice, { color: colors.themePrimary }]}>
                    {formatPrice(product.price)}
                </Text>
                <AppTouchableRipple
                    style={[
                        styles.addButton,
                        {
                            backgroundColor: isInCart
                                ? colors.themePrimary
                                : colors.themePrimaryLight,
                        },
                    ]}
                    onPress={(e) => {
                        e?.stopPropagation();
                        onAddToCart(product);
                    }}
                >
                    <Text
                        style={[
                            styles.addButtonText,
                            {
                                color: isInCart ? colors.white : colors.themePrimary,
                            },
                        ]}
                    >
                        {isInCart ? '✓' : '+'}
                    </Text>
                </AppTouchableRipple>
            </View>
        </TouchableOpacity>
    );
});

const CategoriesSection = memo(({
    categories,
    loading,
    onCategoryPress,
    onViewAll,
}: {
    categories: CategoryModel[];
    loading: boolean;
    onCategoryPress: (category: CategoryModel) => void;
    onViewAll: () => void;
}) => {
    return (
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
                    {categories.map((category, index) => (
                        <CategoryCard
                            key={category.id}
                            category={category}
                            index={index}
                            onPress={onCategoryPress}
                        />
                    ))}
                </ScrollView>
            ) : (
                <EmptyState message="No categories available" />
            )}
        </View>
    );
});

const FeaturedProductsSection = memo(({
    products,
    loading,
    isInCart,
    onProductPress,
    onAddToCart,
    onViewAll,
}: {
    products: ProductListProduct[];
    loading: boolean;
    isInCart: (id: number) => boolean;
    onProductPress: (product: ProductListProduct) => void;
    onAddToCart: (product: ProductListProduct) => void;
    onViewAll: () => void;
}) => {
    return (
        <View style={styles.section}>
            <SectionHeader title="Featured Products" onViewAll={onViewAll} />

            {loading ? (
                <LoadingState message="Loading products..." />
            ) : products.length > 0 ? (
                <View style={styles.productsGrid}>
                    {products.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            isInCart={isInCart(product.id)}
                            onPress={onProductPress}
                            onAddToCart={onAddToCart}
                        />
                    ))}
                </View>
            ) : (
                <EmptyState message="No featured products available" />
            )}
        </View>
    );
});

const WhyChooseUsSection = memo(() => {
    const colors = useTheme();

    return (
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Why Choose Us?
            </Text>
            <View style={[styles.featuresCard, { backgroundColor: colors.backgroundSecondary }]}>
                {WHY_CHOOSE_US_FEATURES.map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                        <Text style={styles.featureIcon}>{feature.icon}</Text>
                        <Text style={[styles.featureText, { color: colors.textPrimary }]}>
                            {feature.text}
                        </Text>
                    </View>
                ))}
            </View>
        </View>
    );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
    const colors = useTheme();
    const { addToCart, isInCart, cartCount } = useCart();
    const { wishlistCount } = useWishlist();
    const { selectedAddress, addresses, selectAddress } = useAddress();

    // ============================================================================
    // STATE
    // ============================================================================
    const [userName, setUserName] = useState<string>('Guest');
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [categories, setCategories] = useState<CategoryModel[]>([]);
    const [featuredProducts, setFeaturedProducts] = useState<ProductListProduct[]>([]);
    const [carousels, setCarousels] = useState<Banner[]>([]);
    const [categoriesLoading, setCategoriesLoading] = useState<boolean>(false);
    const [productsLoading, setProductsLoading] = useState<boolean>(false);
    const [carouselsLoading, setCarouselsLoading] = useState<boolean>(false);

    // ============================================================================
    // EFFECTS
    // ============================================================================
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

    // ============================================================================
    // API HANDLERS
    // ============================================================================
    const fetchCategories = useCallback(async () => {
        setCategoriesLoading(true);
        try {
            const token = await StorageManager.getItem(constant.shareInstanceKey.authToken);

            const response = await ApiManager.get<CategoryListModel>({
                endpoint: constant.apiEndPoints.allCategories,
                token: token || undefined,
                showError: false,
            });

            const categoryData: CategoryModel[] =
                response?.data && Array.isArray(response.data)
                    ? response.data
                    : response?.success && Array.isArray(response?.data)
                        ? response.data
                        : [];

            setCategories(categoryData.slice(0, MAX_CATEGORIES_DISPLAY));
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setCategoriesLoading(false);
        }
    }, []);

    const fetchFeaturedProducts = useCallback(async () => {
        setProductsLoading(true);
        try {
            const token = await StorageManager.getItem(constant.shareInstanceKey.authToken);

            const response = await ApiManager.get<ProductListModel>({
                endpoint: constant.apiEndPoints.allProducts,
                token: token || undefined,
                showError: false,
            });

            const productData: ProductModel[] =
                response?.data && Array.isArray(response.data)
                    ? response.data
                    : response?.status && Array.isArray(response?.data)
                        ? response.data
                        : [];

            // Transform ProductModel to ProductListProduct format
            const transformedProducts: ProductListProduct[] = productData.map((p: ProductModel) => {
                const stock = parseFloat(p.available_units) || 0;
                return {
                    id: p.id,
                    category_id: p.category_id,
                    name: p.name,
                    description: p.description,
                    price: p.price,
                    stock: stock,
                    unit_type: p.unit_type,
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
                };
            });

            const inStockProducts = transformedProducts
                .filter((p: ProductListProduct) => p.stock > 0)
                .slice(0, MAX_FEATURED_PRODUCTS);

            setFeaturedProducts(inStockProducts);
        } catch (error) {
            console.error('Error fetching featured products:', error);
        } finally {
            setProductsLoading(false);
        }
    }, []);

    // ============================================================================
    // FETCH CAROUSELS
    // ============================================================================
    const fetchCarousels = useCallback(async () => {
        setCarouselsLoading(true);
        try {
            const response = await ApiManager.get<CarouselItem[]>({
                endpoint: '/api/carousels',
                token: await StorageManager.getItem(constant.shareInstanceKey.authToken) || undefined,
                showError: false,
            });

            const carouselData: CarouselItem[] =
                response?.data && Array.isArray(response.data)
                    ? response.data
                    : response?.success && Array.isArray(response.data)
                        ? response.data
                        : [];

            // Filter only active carousels and sort by position
            const activeCarousels = carouselData
                .filter((carousel) => carousel.is_active)
                .sort((a, b) => a.position - b.position);

            // Map API response to Banner format
            const mappedBanners: Banner[] = activeCarousels.map((carousel) => ({
                id: carousel.id,
                title: carousel.title,
                subtitle: carousel.subtitle,
                image_url: carousel.image_url,
                image: carousel.image,
                link: carousel.link,
                link_type: carousel.link_type,
                backgroundColor: '#E8F5E9',
                textColor: '#FFFFFF',
            }));

            setCarousels(mappedBanners);
        } catch (error) {
            console.error('Error fetching carousels:', error);
            // Fallback to empty array on error
            setCarousels([]);
        } finally {
            setCarouselsLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchCategories();
            fetchFeaturedProducts();
            fetchCarousels();
        }, [fetchCategories, fetchFeaturedProducts, fetchCarousels])
    );

    // ============================================================================
    // NAVIGATION HANDLERS
    // ============================================================================
    const handleSearchPress = useCallback(() => {
        const propsToSend: ProductListScreenProps = { focusSearch: true };
        navigation.navigate(constant.routeName.products, propsToSend);
    }, [navigation]);

    const handleCategoryPress = useCallback(
        (category: CategoryModel) => {
            if (!category || !category.id) {
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

    const handleProductPress = useCallback(
        (product: ProductListProduct) => {
            navigation.navigate(constant.routeName.productDetail, { productId: product.id });
        },
        [navigation]
    );

    const handleViewAllProducts = useCallback(() => {
        navigation.navigate(constant.routeName.products);
    }, [navigation]);

    const handleViewAllCategories = useCallback(() => {
        navigation.navigate(constant.routeName.categories);
    }, [navigation]);

    const handleWishlistPress = useCallback(() => {
        navigation.navigate(constant.routeName.wishlist);
    }, [navigation]);

    const handleCartPress = useCallback(() => {
        navigation.navigate(constant.routeName.cart);
    }, [navigation]);

    // ============================================================================
    // CART HANDLERS
    // ============================================================================
    const handleAddToCart = useCallback(
        (product: ProductListProduct) => {
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
        },
        [isInCart, addToCart, navigation]
    );

    // ============================================================================
    // ADDRESS HANDLERS
    // ============================================================================
    const handleAddressPress = useCallback(() => {
        if (addresses.length === 0) {
            navigation.navigate(constant.routeName.addEditAddress, { mode: 'add' });
        } else {
            setShowAddressModal(true);
        }
    }, [addresses.length, navigation]);

    const handleSelectAddress = useCallback(
        async (address: Address) => {
            try {
                await selectAddress(address.id);
                setShowAddressModal(false);
            } catch (error) {
                Alert.alert('Error', 'Failed to select address. Please try again.');
            }
        },
        [selectAddress]
    );

    const handleManageAddresses = useCallback(() => {
        setShowAddressModal(false);
        navigation.navigate(constant.routeName.addressList);
    }, [navigation]);

    // ============================================================================
    // VOICE SEARCH HANDLERS
    // ============================================================================
    const handleVoiceResult = useCallback(
        (text: string) => {
            const propsToSend: ProductListScreenProps = {
                focusSearch: true,
                initialQuery: text,
            };
            navigation.navigate(constant.routeName.products, propsToSend);
        },
        [navigation]
    );

    const handleVoiceError = useCallback((error: Error) => {
        console.error('Voice search error:', error);
    }, []);

    const { isListening, isAvailable, startListening, stopListening } = useVoiceSearch({
        onResult: handleVoiceResult,
        onError: handleVoiceError,
        language: VOICE_SEARCH_LANGUAGE,
    });

    const handleVoiceButtonPress = useCallback(async () => {
        if (isListening) {
            await stopListening();
        } else {
            try {
                await startListening();
            } catch (error) {
                console.error('[HomeScreen] Error starting voice search:', error);
            }
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
    // BANNER HANDLERS
    // ============================================================================
    const handleBannerPress = useCallback(
        (banner: Banner) => {
            if (!banner.link || !banner.link_type) {
                return;
            }

            try {
                const linkId = parseInt(banner.link, 10);
                if (isNaN(linkId)) {
                    console.error('Invalid link ID:', banner.link);
                    return;
                }

                switch (banner.link_type) {
                    case 'category':
                        // Navigate to category detail
                        navigation.navigate(constant.routeName.categoryDetail, {
                            params: {
                                categoryId: linkId,
                                categoryName: banner.title,
                            },
                        });
                        break;
                    case 'product':
                        // Navigate to product detail
                        navigation.navigate(constant.routeName.productDetail, {
                            productId: linkId,
                        });
                        break;
                    default:
                        console.log('Unknown link type:', banner.link_type);
                        break;
                }
            } catch (error) {
                console.error('Error handling banner press:', error);
            }
        },
        [navigation]
    );

    // ============================================================================
    // RENDER
    // ============================================================================
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
                <HomeHeader
                    userName={userName}
                    selectedAddress={selectedAddress}
                    cartCount={cartCount}
                    wishlistCount={wishlistCount}
                    onAddressPress={handleAddressPress}
                    onCartPress={handleCartPress}
                    onWishlistPress={handleWishlistPress}
                />

                {/* Search Bar */}
                <SearchBar
                    isListening={isListening}
                    isVoiceAvailable={isAvailable}
                    onSearchPress={handleSearchPress}
                    onVoicePress={handleVoiceButtonPress}
                />

                {/* Banner Carousel */}
                {!carouselsLoading && carousels.length > 0 && (
                    <BannerCarousel
                        banners={carousels}
                        colors={colors}
                        onBannerPress={handleBannerPress}
                    />
                )}

                {/* Categories Section */}
                <CategoriesSection
                    categories={categories}
                    loading={categoriesLoading}
                    onCategoryPress={handleCategoryPress}
                    onViewAll={handleViewAllCategories}
                />

                {/* Featured Products Section */}
                <FeaturedProductsSection
                    products={featuredProducts}
                    loading={productsLoading}
                    isInCart={isInCart}
                    onProductPress={handleProductPress}
                    onAddToCart={handleAddToCart}
                    onViewAll={handleViewAllProducts}
                />

                {/* Why Choose Us Section */}
                <WhyChooseUsSection />
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
                language={VOICE_SEARCH_DISPLAY_LANGUAGE}
                colors={colors}
                onClose={stopListening}
            />
        </MainContainer>
    );
};

export default memo(HomeScreen);

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