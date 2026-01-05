import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    Dimensions,
    Animated,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import MainContainer from '../../container/MainContainer';
import { useTheme } from '../../contexts/ThemeProvider';
import { useCart } from '../../contexts/CardContext';
import { useWishlist } from '../../contexts/WishlistContext';
import AppTouchableRipple from '../../components/AppTouchableRipple';
import ApiManager from '../../managers/ApiManager';
import StorageManager from '../../managers/StorageManager';
import fonts from '../../styles/fonts';
import constant from '../../utilities/constant';
import { AppColors } from '../../styles/colors';
import { Category } from './ProductListScreen';
import { ProductModel, ProductDetailModel } from '../../dataModels/models';

// ============================================================================
// CONSTANTS
// ============================================================================
const { width, height } = Dimensions.get('window');
const IMAGE_HEIGHT = height * 0.45;
const BASE_IMAGE_URL = 'https://gayatriorganicfarm.com/storage/';
const DEFAULT_RATING = 4.8;

const UNIT_TYPE_CONFIG = {
    kg: { label: 'Kilogram', short: 'kg', icon: 'weight-kilogram' },
    g: { label: 'Gram', short: 'g', icon: 'weight-gram' },
    litre: { label: 'Litre', short: 'L', icon: 'cup-water' },
    ml: { label: 'Millilitre', short: 'ml', icon: 'eyedropper' },
    piece: { label: 'Piece', short: 'pc', icon: 'numeric-1-circle' },
    dozen: { label: 'Dozen', short: 'dz', icon: 'numeric-12-circle' },
    packet: { label: 'Packet', short: 'pkt', icon: 'package-variant' },
} as const;

const STOCK_STATUS_CONFIG = {
    OUT_OF_STOCK: { label: 'Out of Stock', color: '#FF5252', bgColor: '#FFEBEE', icon: 'close-circle' },
    LOW_STOCK: { label: 'Low Stock', color: '#FF9800', bgColor: '#FFF3E0', icon: 'alert-circle' },
    IN_STOCK: { label: 'In Stock', color: '#4CAF50', bgColor: '#E8F5E9', icon: 'check-circle' },
} as const;

const PRODUCT_FEATURES = [
    { icon: 'leaf', title: '100% Organic', description: 'Certified organic product', requiresOrganic: true },
    { icon: 'truck-fast', title: 'Fast Delivery', description: 'Same day delivery available', requiresOrganic: false },
    { icon: 'shield-check', title: 'Quality Assured', description: 'Freshness guaranteed', requiresOrganic: false },
] as const;

// ============================================================================
// TYPES
// ============================================================================
export interface ProductDetailScreenProps {
    productId: number;
}

interface ProductDetailScreenNavigationProps {
    navigation: NativeStackNavigationProp<any>;
    route: RouteProp<{ params: ProductDetailScreenProps }, 'params'>;
}

export interface Product {
    id: number;
    category_id: number;
    name: string;
    description: string;
    price: string;
    stock: number;
    product_type?: string;
    unit_type?: string;
    unit_value?: number;
    image1: string;
    image2: string | null;
    image3: string | null;
    image4: string | null;
    image5: string | null;
    created_at: string;
    updated_at: string;
    category: Category;
}

interface StockStatus {
    label: string;
    color: string;
    bgColor: string;
    icon: string;
}

interface UnitTypeInfo {
    label: string;
    short: string;
    icon: string;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
const getStockStatus = (stock: number): StockStatus => {
    if (stock === 0) return STOCK_STATUS_CONFIG.OUT_OF_STOCK;
    if (stock <= 5) return STOCK_STATUS_CONFIG.LOW_STOCK;
    return STOCK_STATUS_CONFIG.IN_STOCK;
};

const getUnitTypeInfo = (unitType?: string): UnitTypeInfo => {
    if (!unitType) return UNIT_TYPE_CONFIG.piece;
    const normalizedUnitType = unitType.toLowerCase();
    return UNIT_TYPE_CONFIG[normalizedUnitType as keyof typeof UNIT_TYPE_CONFIG] || UNIT_TYPE_CONFIG.piece;
};

const formatUnitDisplay = (unitType?: string, unitValue?: number): string => {
    if (!unitType) return 'pc';
    const unitInfo = getUnitTypeInfo(unitType);
    if (unitValue && unitValue > 1) {
        return `${unitValue} ${unitInfo.short}`;
    }
    return unitInfo.short;
};

const getImageUrl = (imagePath: string): string => {
    return `${BASE_IMAGE_URL}${imagePath}`;
};

const formatPrice = (price: string | number): string => {
    return `₹${parseFloat(price.toString()).toFixed(2)}`;
};

const extractProductImages = (product: Product): string[] => {
    return [product.image1, product.image2, product.image3, product.image4, product.image5]
        .filter((img): img is string => img !== null);
};

const extractProductData = (response: ProductDetailModel | any): Product | null => {
    let productData: ProductModel | null = null;

    if (response?.status && response?.data) {
        productData = response.data;
    } else if (response?.data) {
        productData = response.data;
    } else {
        return null;
    }

    if (!productData) return null;

    const stock = parseFloat(productData.available_units) || 0;

    const category: Category = {
        id: productData.category.id,
        name: productData.category.name,
        description: productData.category.description,
        image: productData.category.image,
    };

    return {
        id: productData.id,
        category_id: productData.category_id,
        name: productData.name,
        description: productData.description,
        price: productData.price,
        stock: stock,
        product_type: productData.product_type,
        unit_type: productData.unit_type,
        unit_value: productData.unit_value,
        image1: productData.image1,
        image2: productData.image2,
        image3: productData.image3,
        image4: productData.image4,
        image5: productData.image5,
        created_at: productData.created_at,
        updated_at: productData.updated_at,
        category: category,
    };
};

// ============================================================================
// SUB COMPONENTS
// ============================================================================
const ImageCard = memo(({ imageUrl, colors }: { imageUrl: string; colors: AppColors }) => {
    const [imageError, setImageError] = useState(false);

    return (
        <View style={styles.imageCard}>
            {!imageError ? (
                <Image
                    source={{ uri: imageUrl }}
                    style={styles.productImage}
                    resizeMode="cover"
                    onError={() => setImageError(true)}
                />
            ) : (
                <View style={[styles.imagePlaceholder, { backgroundColor: colors.themePrimaryLight }]}>
                    <Icon name="image-off" size={64} color={colors.themePrimary} />
                </View>
            )}
        </View>
    );
});

const ImageIndicators = memo(({ images, scrollX }: { images: string[]; scrollX: Animated.Value }) => {
    const colors = useTheme();

    if (images.length <= 1) return null;

    return (
        <View style={styles.imageIndicators}>
            {images.map((_, index) => {
                const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
                const dotWidth = scrollX.interpolate({
                    inputRange,
                    outputRange: [8, 20, 8],
                    extrapolate: 'clamp',
                });
                const opacity = scrollX.interpolate({
                    inputRange,
                    outputRange: [0.3, 1, 0.3],
                    extrapolate: 'clamp',
                });

                return (
                    <Animated.View
                        key={index}
                        style={[
                            styles.indicator,
                            {
                                width: dotWidth,
                                opacity,
                                backgroundColor: colors.white,
                            },
                        ]}
                    />
                );
            })}
        </View>
    );
});

const FloatingButtons = memo(({
    onBack,
    isFavorite,
    onToggleFavorite,
}: {
    onBack: () => void;
    isFavorite: boolean;
    onToggleFavorite: () => void;
}) => {
    return (
        <View style={styles.floatingButtons}>
            <AppTouchableRipple
                style={[styles.floatingButton, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
                onPress={onBack}
            >
                <Icon name="arrow-left" size={24} color="#FFFFFF" />
            </AppTouchableRipple>

            <AppTouchableRipple
                style={[styles.floatingButton, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
                onPress={onToggleFavorite}
            >
                <Icon
                    name={isFavorite ? 'heart' : 'heart-outline'}
                    size={24}
                    color={isFavorite ? '#FF5252' : '#FFFFFF'}
                />
            </AppTouchableRipple>
        </View>
    );
});

const ImageCarousel = memo(({ images, onBack, isFavorite, onToggleFavorite }: {
    images: string[];
    onBack: () => void;
    isFavorite: boolean;
    onToggleFavorite: () => void;
}) => {
    const colors = useTheme();
    const scrollX = useRef(new Animated.Value(0)).current;

    return (
        <View style={styles.imageCarouselContainer}>
            <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
                    useNativeDriver: false,
                })}
                scrollEventThrottle={16}
            >
                {images.map((image, index) => (
                    <ImageCard key={index} imageUrl={getImageUrl(image)} colors={colors} />
                ))}
            </ScrollView>

            <ImageIndicators images={images} scrollX={scrollX} />
            <FloatingButtons onBack={onBack} isFavorite={isFavorite} onToggleFavorite={onToggleFavorite} />
        </View>
    );
});

const CategoryBadge = memo(({ categoryName, onPress }: { categoryName: string; onPress: () => void }) => {
    const colors = useTheme();

    return (
        <TouchableOpacity
            style={[styles.categoryBadge, { backgroundColor: colors.themePrimaryLight }]}
            onPress={onPress}
        >
            <Icon name="tag" size={14} color={colors.themePrimary} />
            <Text style={[styles.categoryBadgeText, { color: colors.themePrimary }]}>
                {categoryName}
            </Text>
            <Icon name="chevron-right" size={14} color={colors.themePrimary} />
        </TouchableOpacity>
    );
});

// ⭐ NEW: Unit Information Card
const UnitInformationCard = memo(({
    unitTypeInfo,
    unitValue
}: {
    unitTypeInfo: UnitTypeInfo;
    unitValue?: number;
}) => {
    const colors = useTheme();
    const hasPackaging = unitValue && unitValue > 1;
    const pluralLabel = hasPackaging && unitTypeInfo.label !== 'Piece'
        ? `${unitTypeInfo.label}s`
        : unitTypeInfo.label;

    return (
        <View style={[styles.unitInfoCard, { backgroundColor: colors.backgroundSecondary }]}>
            <View style={[styles.unitIconContainer, { backgroundColor: colors.themePrimaryLight }]}>
                <Icon name={unitTypeInfo.icon} size={28} color={colors.themePrimary} />
            </View>

            <View style={styles.unitInfoContent}>
                <Text style={[styles.unitInfoLabel, { color: colors.textLabel }]}>
                    PACKAGE SIZE
                </Text>

                {hasPackaging ? (
                    <View style={styles.unitValueContainer}>
                        <Text style={[styles.unitValueLarge, { color: colors.themePrimary }]}>
                            {unitValue}
                        </Text>
                        <Text style={[styles.unitValueUnit, { color: colors.textPrimary }]}>
                            {pluralLabel}
                        </Text>
                    </View>
                ) : (
                    <Text style={[styles.unitValueSingle, { color: colors.textPrimary }]}>
                        1 {unitTypeInfo.label}
                    </Text>
                )}

                {hasPackaging && (
                    <View style={[styles.packageBadge, { backgroundColor: colors.themePrimaryLight }]}>
                        <Icon name="package-variant-closed" size={14} color={colors.themePrimary} />
                        <Text style={[styles.packageBadgeText, { color: colors.themePrimary }]}>
                            PACKAGED PRODUCT
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
});

// Compact badge for status row
const UnitTypeBadge = memo(({
    unitTypeInfo,
    unitValue
}: {
    unitTypeInfo: UnitTypeInfo;
    unitValue?: number;
}) => {
    const colors = useTheme();
    const displayText = unitValue && unitValue > 1
        ? `${unitValue} ${unitTypeInfo.short}`
        : unitTypeInfo.short;

    return (
        <View style={[styles.unitTypeBadge, { backgroundColor: colors.backgroundSecondary }]}>
            <Icon name={unitTypeInfo.icon} size={14} color={colors.themePrimary} />
            <Text style={[styles.unitTypeText, { color: colors.textPrimary }]} numberOfLines={1}>
                {displayText}
            </Text>
        </View>
    );
});

const StockStatusBadge = memo(({ stockStatus, stock }: { stockStatus: StockStatus; stock: number }) => {
    return (
        <View style={[styles.stockStatusBadge, { backgroundColor: stockStatus.bgColor }]}>
            <Icon name={stockStatus.icon} size={16} color={stockStatus.color} />
            <Text style={[styles.stockStatusText, { color: stockStatus.color }]}>
                {stockStatus.label} • {stock} units
            </Text>
        </View>
    );
});

const ProductHeader = memo(({
    product,
    stockStatus,
    unitTypeInfo,
    onCategoryPress
}: {
    product: Product;
    stockStatus: StockStatus;
    unitTypeInfo: UnitTypeInfo;
    onCategoryPress: () => void;
}) => {
    const colors = useTheme();

    // Format product name with unit information
    const getProductNameWithUnit = (): string => {
        if (product.unit_value && product.unit_value > 1 && product.unit_type) {
            const unitDisplay = formatUnitDisplay(product.unit_type, product.unit_value);
            return `${product.name} (${unitDisplay})`;
        }
        return product.name;
    };

    return (
        <>
            <View style={styles.badgeContainer}>
                <CategoryBadge categoryName={product.category.name} onPress={onCategoryPress} />
                {product.product_type === 'organic' && (
                    <View style={[styles.organicBadge, { backgroundColor: '#E8F5E9' }]}>
                        <Icon name="leaf" size={14} color="#4CAF50" />
                        <Text style={[styles.organicBadgeText, { color: '#4CAF50' }]}>
                            ORGANIC
                        </Text>
                    </View>
                )}
            </View>
            <Text style={[styles.productName, { color: colors.textPrimary }]}>
                {getProductNameWithUnit()}
            </Text>
            <View style={styles.statusContainer}>
                <StockStatusBadge stockStatus={stockStatus} stock={product.stock} />
                <UnitTypeBadge unitTypeInfo={unitTypeInfo} unitValue={product.unit_value} />
            </View>
        </>
    );
});

const QuantitySelector = memo(({
    quantity,
    maxStock,
    onQuantityChange,
}: {
    quantity: number;
    maxStock: number;
    onQuantityChange: (change: number) => void;
}) => {
    const colors = useTheme();

    return (
        <View style={[styles.quantitySelector, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[styles.quantityLabel, { color: colors.textLabel }]}>Quantity</Text>
            <View style={styles.quantityControls}>
                <AppTouchableRipple
                    style={[styles.quantityButton, { backgroundColor: colors.themePrimaryLight }]}
                    onPress={() => onQuantityChange(-1)}
                    disabled={quantity <= 1}
                >
                    <Icon name="minus" size={20} color={colors.themePrimary} />
                </AppTouchableRipple>

                <Text style={[styles.quantityValue, { color: colors.textPrimary }]}>
                    {quantity}
                </Text>

                <AppTouchableRipple
                    style={[styles.quantityButton, { backgroundColor: colors.themePrimaryLight }]}
                    onPress={() => onQuantityChange(1)}
                    disabled={quantity >= maxStock}
                >
                    <Icon name="plus" size={20} color={colors.themePrimary} />
                </AppTouchableRipple>
            </View>
        </View>
    );
});

// ⭐ ENHANCED: Price Section
const PriceSection = memo(({
    price,
    quantity,
    maxStock,
    unitTypeInfo,
    unitValue,
    onQuantityChange
}: {
    price: string;
    quantity: number;
    maxStock: number;
    unitTypeInfo: UnitTypeInfo;
    unitValue?: number;
    onQuantityChange: (change: number) => void;
}) => {
    const colors = useTheme();
    const hasPackaging = unitValue && unitValue > 1;

    const packagePrice = parseFloat(price);
    const perUnitPrice = hasPackaging ? packagePrice / unitValue! : packagePrice;

    return (
        <View style={styles.priceSection}>
            <View style={styles.pricingDetails}>
                <Text style={[styles.priceLabel, { color: colors.textLabel }]}>
                    {hasPackaging ? 'Package Price' : 'Price'}
                </Text>
                <Text style={[styles.price, { color: colors.themePrimary }]}>
                    {formatPrice(price)}
                </Text>

                {hasPackaging && (
                    <View style={[styles.perUnitBreakdown, { backgroundColor: colors.themePrimaryLight }]}>
                        <Icon name="calculator-variant" size={14} color={colors.themePrimary} />
                        <Text style={[styles.perUnitText, { color: colors.themePrimary }]}>
                            ₹{perUnitPrice.toFixed(2)} per {unitTypeInfo.short}
                        </Text>
                    </View>
                )}

                {!hasPackaging && (
                    <Text style={[styles.priceSubtext, { color: colors.textDescription }]}>
                        Per {unitTypeInfo.short}
                    </Text>
                )}
            </View>

            <QuantitySelector
                quantity={quantity}
                maxStock={maxStock}
                onQuantityChange={onQuantityChange}
            />
        </View>
    );
});

const TotalPriceCard = memo(({ totalPrice }: { totalPrice: number }) => {
    const colors = useTheme();

    return (
        <View style={[styles.totalPriceCard, { backgroundColor: colors.themePrimaryLight }]}>
            <View>
                <Text style={[styles.totalLabel, { color: colors.themePrimary }]}>
                    Total Amount
                </Text>
                <Text style={[styles.totalPrice, { color: colors.themePrimary }]}>
                    ₹{totalPrice.toFixed(2)}
                </Text>
            </View>
            <View style={{ opacity: 0.3 }}>
                <Icon name="calculator" size={32} color={colors.themePrimary} />
            </View>
        </View>
    );
});

const ProductDescription = memo(({ description }: { description: string }) => {
    const colors = useTheme();

    return (
        <View style={styles.descriptionSection}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Product Description
            </Text>
            <Text style={[styles.description, { color: colors.textDescription }]}>
                {description}
            </Text>
        </View>
    );
});

const FeatureItem = memo(({
    icon,
    title,
    description,
}: {
    icon: string;
    title: string;
    description: string;
}) => {
    const colors = useTheme();

    return (
        <View style={[styles.featureItem, { backgroundColor: colors.backgroundSecondary }]}>
            <View style={[styles.featureIcon, { backgroundColor: colors.themePrimaryLight }]}>
                <Icon name={icon} size={20} color={colors.themePrimary} />
            </View>
            <View style={styles.featureContent}>
                <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>
                    {title}
                </Text>
                <Text style={[styles.featureDescription, { color: colors.textDescription }]}>
                    {description}
                </Text>
            </View>
        </View>
    );
});

const ProductFeatures = memo(({ productType }: { productType?: string }) => {
    const colors = useTheme();

    const filteredFeatures = PRODUCT_FEATURES.filter((feature) => {
        if (feature.requiresOrganic) {
            return productType === 'organic';
        }
        return true;
    });

    if (filteredFeatures.length === 0) return null;

    return (
        <View style={styles.featuresSection}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Product Features
            </Text>
            <View style={styles.featuresList}>
                {filteredFeatures.map((feature, index) => (
                    <FeatureItem
                        key={index}
                        icon={feature.icon}
                        title={feature.title}
                        description={feature.description}
                    />
                ))}
            </View>
        </View>
    );
});

const InfoCard = memo(({
    icon,
    iconColor,
    label,
    value,
}: {
    icon: string;
    iconColor?: string;
    label: string;
    value: string | number;
}) => {
    const colors = useTheme();

    return (
        <View style={[styles.infoCard, { backgroundColor: colors.backgroundSecondary }]}>
            <Icon name={icon} size={24} color={iconColor || colors.themePrimary} />
            <Text style={[styles.infoLabel, { color: colors.textLabel }]}>
                {label}
            </Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]} numberOfLines={1}>
                {value}
            </Text>
        </View>
    );
});

const ProductInfoGrid = memo(({ product }: { product: Product }) => {
    return (
        <View style={styles.infoGrid}>
            <InfoCard icon="package-variant" label="Stock" value={product.stock} />
            <InfoCard icon="tag-multiple" label="Category" value={product.category.name} />
            <InfoCard icon="star" iconColor="#FFC107" label="Rating" value={`${DEFAULT_RATING}★`} />
        </View>
    );
});

const BottomActionBar = memo(({
    totalPrice,
    inCart,
    isOutOfStock,
    onAddToCart
}: {
    totalPrice: number;
    inCart: boolean;
    isOutOfStock: boolean;
    onAddToCart: () => void;
}) => {
    const colors = useTheme();
    const insets = useSafeAreaInsets();

    return (
        <View
            style={[
                styles.bottomBar,
                {
                    backgroundColor: colors.backgroundPrimary,
                    marginBottom: insets.bottom,
                },
            ]}
        >
            <View style={styles.bottomBarContent}>
                <View>
                    <Text style={[styles.bottomBarLabel, { color: colors.textLabel }]}>
                        Total Price
                    </Text>
                    <Text style={[styles.bottomBarPrice, { color: colors.themePrimary }]}>
                        ₹{totalPrice.toFixed(2)}
                    </Text>
                </View>

                <AppTouchableRipple
                    style={[
                        styles.addToCartButton,
                        {
                            backgroundColor: isOutOfStock
                                ? colors.textLabel
                                : colors.themePrimary,
                        },
                    ]}
                    onPress={onAddToCart}
                    disabled={isOutOfStock}
                >
                    <Icon
                        name={inCart ? 'check-circle' : 'cart-plus'}
                        size={22}
                        color={colors.white}
                    />
                    <Text style={[styles.addToCartText, { color: colors.white }]}>
                        {isOutOfStock ? 'Out of Stock' : inCart ? 'Update Cart' : 'Add to Cart'}
                    </Text>
                </AppTouchableRipple>
            </View>
        </View>
    );
});

const LoadingState = memo(() => {
    const colors = useTheme();

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
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const ProductDetailScreen: React.FC<ProductDetailScreenNavigationProps> = ({ navigation, route }) => {
    const colors = useTheme();
    const insets = useSafeAreaInsets();
    const { productId } = route.params;
    const { addToCart, isInCart, updateQuantity, getCartItem } = useCart();
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [quantity, setQuantity] = useState<number>(1);

    const productImages = useMemo(() => (product ? extractProductImages(product) : []), [product]);
    const stockStatus = useMemo(() => (product ? getStockStatus(product.stock) : null), [product]);
    const unitTypeInfo = useMemo(() => getUnitTypeInfo(product?.unit_type), [product?.unit_type]);
    const inCart = useMemo(() => (product ? isInCart(product.id) : false), [product, isInCart]);
    const isFavorite = useMemo(() => (product ? isInWishlist(product.id) : false), [product, isInWishlist]);
    const totalPrice = useMemo(() => {
        if (!product) return 0;
        return parseFloat(product.price) * quantity;
    }, [product, quantity]);

    const scrollContentStyle = useMemo(
        () => ({
            ...styles.scrollContent,
            paddingBottom: 100 + insets.bottom,
        }),
        [insets.bottom]
    );

    const fetchProductDetail = useCallback(async () => {
        setLoading(true);
        try {
            const token = await StorageManager.getItem(constant.shareInstanceKey.authToken);

            const response = await ApiManager.get<ProductDetailModel>({
                endpoint: `${constant.apiEndPoints.getProduct}${productId}`,
                token: token || undefined,
                showError: true,
            });

            const productData = extractProductData(response);

            if (productData) {
                setProduct(productData);
            } else {
                Alert.alert('Error', 'Product not found');
                navigation.goBack();
            }
        } catch (error: any) {
            console.error('❌ Fetch Product Error:', error);
            Alert.alert('Error', 'Failed to load product details');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    }, [productId, navigation]);

    useEffect(() => {
        fetchProductDetail();
    }, [fetchProductDetail]);

    useEffect(() => {
        if (product && isInCart(product.id)) {
            const cartItem = getCartItem(product.id);
            if (cartItem) {
                setQuantity(cartItem.quantity || 1);
            }
        }
    }, [product, isInCart, getCartItem]);

    const handleAddToCart = useCallback(() => {
        if (!product || product.stock === 0) return;

        if (isInCart(product.id)) {
            updateQuantity(product.id, quantity);
            Alert.alert('Cart Updated', `Updated ${product.name} quantity to ${quantity}`, [
                { text: 'Continue Shopping', style: 'cancel' },
                {
                    text: 'View Cart',
                    onPress: () =>
                        navigation.navigate(constant.routeName.mainTabs, {
                            screen: constant.routeName.cart,
                        }),
                },
            ]);
        } else {
            addToCart({
                id: product.id,
                name: product.name,
                price: parseFloat(product.price),
                image: product.image1,
                unit: product.unit_type || 'piece',
                unitValue: product.unit_value,
                quantity: quantity,
                categoryId: product.category_id || product.category?.id,
                productId: product.id,
            });
            Alert.alert('Added to Cart', `${product.name} (${quantity}) has been added to your cart`, [
                { text: 'Continue Shopping', style: 'cancel' },
                {
                    text: 'View Cart',
                    onPress: () =>
                        navigation.navigate(constant.routeName.mainTabs, {
                            screen: constant.routeName.cart,
                        }),
                },
            ]);
        }
    }, [product, quantity, isInCart, updateQuantity, addToCart, navigation]);

    const handleQuantityChange = useCallback(
        (change: number) => {
            if (!product) return;
            const newQuantity = quantity + change;
            if (newQuantity >= 1 && newQuantity <= product.stock) {
                setQuantity(newQuantity);
            }
        },
        [product, quantity]
    );

    const handleToggleFavorite = useCallback(() => {
        if (!product) return;
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
                unit_type: product.unit_type,
                unit_value: product.unit_value,
            });
        }
    }, [product, isInWishlist, addToWishlist, removeFromWishlist]);

    const handleCategoryPress = useCallback(() => {
        if (!product?.category_id) {
            console.error('❌ Product category_id is missing');
            return;
        }
        navigation.navigate(constant.routeName.categoryDetail, {
            params: {
                categoryId: product.category_id,
                categoryName: product.category.name,
            },
        });
    }, [product, navigation]);

    const handleGoBack = useCallback(() => {
        navigation.goBack();
    }, [navigation]);

    if (loading || !product || !stockStatus) {
        return <LoadingState />;
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
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={scrollContentStyle}
                >
                    <ImageCarousel
                        images={productImages}
                        onBack={handleGoBack}
                        isFavorite={isFavorite}
                        onToggleFavorite={handleToggleFavorite}
                    />

                    <View style={[styles.productInfoCard, { backgroundColor: colors.backgroundPrimary }]}>
                        <ProductHeader
                            product={product}
                            stockStatus={stockStatus}
                            unitTypeInfo={unitTypeInfo}
                            onCategoryPress={handleCategoryPress}
                        />

                        {/* ⭐ NEW: Unit Information Card */}
                        <UnitInformationCard
                            unitTypeInfo={unitTypeInfo}
                            unitValue={product.unit_value}
                        />

                        <PriceSection
                            price={product.price}
                            quantity={quantity}
                            maxStock={product.stock}
                            unitTypeInfo={unitTypeInfo}
                            unitValue={product.unit_value}
                            onQuantityChange={handleQuantityChange}
                        />

                        <TotalPriceCard totalPrice={totalPrice} />
                        <ProductDescription description={product.description} />
                        <ProductFeatures productType={product.product_type} />
                        <ProductInfoGrid product={product} />
                    </View>
                </ScrollView>

                <BottomActionBar
                    totalPrice={totalPrice}
                    inCart={inCart}
                    isOutOfStock={product.stock === 0}
                    onAddToCart={handleAddToCart}
                />
            </View>
        </MainContainer>
    );
};

export default memo(ProductDetailScreen);

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollView: { flex: 1 },
    scrollContent: { paddingBottom: 100 },

    // Image Carousel
    imageCarouselContainer: {
        width: width,
        height: IMAGE_HEIGHT,
        position: 'relative',
    },
    imageCard: {
        width: width,
        height: IMAGE_HEIGHT,
    },
    productImage: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageIndicators: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    indicator: {
        height: 8,
        borderRadius: 4,
    },
    floatingButtons: {
        position: 'absolute',
        top: 50,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    floatingButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Product Info
    productInfoCard: {
        marginTop: -30,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingHorizontal: 20,
        paddingTop: 24,
    },
    badgeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
        flexWrap: 'wrap',
    },
    categoryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    categoryBadgeText: {
        fontSize: fonts.size.font12,
        fontFamily: fonts.family.primaryBold,
        textTransform: 'uppercase',
    },
    organicBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 4,
    },
    organicBadgeText: {
        fontSize: fonts.size.font11,
        fontFamily: fonts.family.primaryBold,
        textTransform: 'uppercase',
    },
    productName: {
        fontSize: fonts.size.font28,
        fontFamily: fonts.family.primaryBold,
        marginBottom: 12,
        lineHeight: 36,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 20,
        flexWrap: 'wrap',
    },
    stockStatusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 8,
    },
    stockStatusText: {
        fontSize: fonts.size.font13,
        fontFamily: fonts.family.primaryBold,
    },
    unitTypeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 4,
        maxWidth: 100,
    },
    unitTypeText: {
        fontSize: fonts.size.font12,
        fontFamily: fonts.family.primaryBold,
        flexShrink: 1,
    },

    // ⭐ NEW: Unit Information Card
    unitInfoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 20,
        gap: 16,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    unitIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    unitInfoContent: {
        flex: 1,
    },
    unitInfoLabel: {
        fontSize: fonts.size.font11,
        fontFamily: fonts.family.primaryBold,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    unitValueContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 6,
    },
    unitValueLarge: {
        fontSize: fonts.size.font28,
        fontFamily: fonts.family.primaryBold,
        lineHeight: 32,
    },
    unitValueUnit: {
        fontSize: fonts.size.font16,
        fontFamily: fonts.family.primaryMedium,
    },
    unitValueSingle: {
        fontSize: fonts.size.font20,
        fontFamily: fonts.family.primaryBold,
    },
    packageBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
        marginTop: 6,
    },
    packageBadgeText: {
        fontSize: fonts.size.font10,
        fontFamily: fonts.family.primaryBold,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },

    // ⭐ ENHANCED: Price Section
    priceSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    pricingDetails: {
        flex: 1,
    },
    priceLabel: {
        fontSize: fonts.size.font13,
        fontFamily: fonts.family.secondaryRegular,
        marginBottom: 4,
    },
    price: {
        fontSize: fonts.size.font30,
        fontFamily: fonts.family.primaryBold,
        marginBottom: 4,
    },
    perUnitBreakdown: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginTop: 8,
    },
    perUnitText: {
        fontSize: fonts.size.font12,
        fontFamily: fonts.family.primaryBold,
    },
    priceSubtext: {
        fontSize: fonts.size.font12,
        fontFamily: fonts.family.secondaryRegular,
    },

    // Quantity Selector
    quantitySelector: {
        borderRadius: 16,
        padding: 12,
        alignItems: 'center',
    },
    quantityLabel: {
        fontSize: fonts.size.font12,
        fontFamily: fonts.family.primaryMedium,
        marginBottom: 8,
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    quantityButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    quantityValue: {
        fontSize: fonts.size.font20,
        fontFamily: fonts.family.primaryBold,
        minWidth: 40,
        textAlign: 'center',
    },

    // Total Price Card
    totalPriceCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderRadius: 16,
        marginBottom: 24,
    },
    totalLabel: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.primaryMedium,
        marginBottom: 4,
    },
    totalPrice: {
        fontSize: fonts.size.font28,
        fontFamily: fonts.family.primaryBold,
    },

    // Description
    descriptionSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: fonts.size.font18,
        fontFamily: fonts.family.primaryBold,
        marginBottom: 12,
    },
    description: {
        fontSize: fonts.size.font15,
        fontFamily: fonts.family.secondaryRegular,
        lineHeight: 24,
    },

    // Features
    featuresSection: {
        marginBottom: 24,
    },
    featuresList: {
        gap: 12,
    },
    featureItem: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 16,
        gap: 16,
    },
    featureIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    featureContent: {
        flex: 1,
    },
    featureTitle: {
        fontSize: fonts.size.font15,
        fontFamily: fonts.family.primaryBold,
        marginBottom: 4,
    },
    featureDescription: {
        fontSize: fonts.size.font13,
        fontFamily: fonts.family.secondaryRegular,
    },

    // Info Grid
    infoGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    infoCard: {
        flex: 1,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        gap: 8,
    },
    infoLabel: {
        fontSize: fonts.size.font11,
        fontFamily: fonts.family.secondaryRegular,
    },
    infoValue: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.primaryBold,
    },

    // Bottom Bar
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },
    bottomBarContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
    },
    bottomBarLabel: {
        fontSize: fonts.size.font12,
        fontFamily: fonts.family.secondaryRegular,
        marginBottom: 4,
    },
    bottomBarPrice: {
        fontSize: fonts.size.font24,
        fontFamily: fonts.family.primaryBold,
    },
    addToCartButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 16,
        gap: 10,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    addToCartText: {
        fontSize: fonts.size.font16,
        fontFamily: fonts.family.primaryBold,
    },
});