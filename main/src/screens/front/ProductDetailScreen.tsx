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
    Alert
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MainContainer from '../../container/MainContainer';
import { useTheme } from '../../contexts/ThemeProvider';
import fonts from '../../styles/fonts';
import AppTouchableRipple from '../../components/AppTouchableRipple';
import ApiManager from '../../managers/ApiManager';
import StorageManager from '../../managers/StorageManager';
import constant from '../../utilities/constant';
import { useCart } from '../../contexts/CardContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppColors } from '../../styles/colors';
import { Category } from './ProductListScreen';

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
    image1: string;
    image2: string | null;
    image3: string | null;
    image4: string | null;
    image5: string | null;
    created_at: string;
    updated_at: string;
    category: Category;
}

const { width, height } = Dimensions.get('window');
const IMAGE_HEIGHT = height * 0.45;

const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Out of Stock', color: '#FF5252', bgColor: '#FFEBEE', icon: 'close-circle' };
    if (stock <= 5) return { label: 'Low Stock', color: '#FF9800', bgColor: '#FFF3E0', icon: 'alert-circle' };
    return { label: 'In Stock', color: '#4CAF50', bgColor: '#E8F5E9', icon: 'check-circle' };
};

const getImageUrl = (imagePath: string) => `https://gayatriorganicfarm.com/storage/${imagePath}`;

const ProductDetailScreen: React.FC<ProductDetailScreenNavigationProps> = ({ navigation, route }) => {
    const colors = useTheme();
    const insets = useSafeAreaInsets();

    const { productId } = route.params;
    const { addToCart, isInCart, updateQuantity, getCartItem } = useCart();
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [quantity, setQuantity] = useState<number>(1);
    const scrollX = useRef(new Animated.Value(0)).current;
    const scrollViewRef = useRef<ScrollView>(null);

    const fetchProductDetail = useCallback(async () => {
        setLoading(true);
        try {
            const token = await StorageManager.getItem(constant.shareInstanceKey.authToken);

            const response = await ApiManager.get({
                endpoint: `${constant.apiEndPoints.getProduct}${productId}`,
                token: token || undefined,
                showError: true,
            });

            if (response?.status && response?.data) {
                setProduct(response.data);
            } else if (response?.data) {
                setProduct(response.data);
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
            Alert.alert(
                'Cart Updated',
                `Updated ${product.name} quantity to ${quantity}`,
                [
                    { text: 'Continue Shopping', style: 'cancel' },
                    {
                        text: 'View Cart',
                        onPress: () => navigation.navigate(constant.routeName.mainTabs, { screen: constant.routeName.cart })
                    }
                ]
            );
        } else {
            addToCart({
                id: product.id,
                name: product.name,
                price: parseFloat(product.price),
                image: product.image1,
                unit: 'pc',
                quantity: quantity
            });
            Alert.alert(
                'Added to Cart',
                `${product.name} (${quantity}) has been added to your cart`,
                [
                    { text: 'Continue Shopping', style: 'cancel' },
                    { text: 'View Cart', onPress: () => navigation.navigate(constant.routeName.mainTabs, { screen: constant.routeName.cart }) }
                ]
            );
        }
    }, [product, quantity, isInCart, updateQuantity, addToCart, navigation]);

    const handleQuantityChange = useCallback((change: number) => {
        if (!product) return;
        const newQuantity = quantity + change;
        if (newQuantity >= 1 && newQuantity <= product.stock) {
            setQuantity(newQuantity);
        }
    }, [product, quantity]);

    const productImages = useMemo(() => {
        if (!product) return [];
        return [product.image1, product.image2, product.image3, product.image4, product.image5]
            .filter((img): img is string => img !== null);
    }, [product]);

    const stockStatus = useMemo(() => product ? getStockStatus(product.stock) : null, [product]);
    const inCart = useMemo(() => product ? isInCart(product.id) : false, [product, isInCart]);
    const isFavorite = useMemo(() => product ? isInWishlist(product.id) : false, [product, isInWishlist]);
    const totalPrice = useMemo(() => {
        if (!product) return 0;
        return parseFloat(product.price) * quantity;
    }, [product, quantity]);

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
            });
        }
    }, [product, isInWishlist, addToWishlist, removeFromWishlist]);

    const scrollContentStyle = useMemo(() => ({
        ...styles.scrollContent,
        paddingBottom: 100 + insets.bottom
    }), [insets.bottom]);

    if (loading || !product || !stockStatus) {
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
                    ref={scrollViewRef}
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={scrollContentStyle}
                >
                    <View style={styles.imageCarouselContainer}>
                        <ScrollView
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            onScroll={Animated.event(
                                [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                                { useNativeDriver: false }
                            )}
                            scrollEventThrottle={16}
                        >
                            {productImages.map((image, index) => (
                                <ImageCard key={index} imageUrl={getImageUrl(image)} colors={colors} />
                            ))}
                        </ScrollView>

                        {productImages.length > 1 && (
                            <View style={styles.imageIndicators}>
                                {productImages.map((_, index) => {
                                    const inputRange = [
                                        (index - 1) * width,
                                        index * width,
                                        (index + 1) * width
                                    ];
                                    const dotWidth = scrollX.interpolate({
                                        inputRange,
                                        outputRange: [8, 20, 8],
                                        extrapolate: 'clamp'
                                    });
                                    const opacity = scrollX.interpolate({
                                        inputRange,
                                        outputRange: [0.3, 1, 0.3],
                                        extrapolate: 'clamp'
                                    });

                                    return (
                                        <Animated.View
                                            key={index}
                                            style={[
                                                styles.indicator,
                                                {
                                                    width: dotWidth,
                                                    opacity,
                                                    backgroundColor: colors.white
                                                }
                                            ]}
                                        />
                                    );
                                })}
                            </View>
                        )}

                        {/* Floating Buttons */}
                        <View style={styles.floatingButtons}>
                            <AppTouchableRipple
                                style={{ ...styles.floatingButton, backgroundColor: 'rgba(0,0,0,0.5)' }}
                                onPress={() => navigation.goBack()}
                            >
                                <Icon name="arrow-left" size={24} color="#FFFFFF" />
                            </AppTouchableRipple>

                            <AppTouchableRipple
                                style={{ ...styles.floatingButton, backgroundColor: 'rgba(0,0,0,0.5)' }}
                                onPress={handleToggleFavorite}
                            >
                                <Icon
                                    name={isFavorite ? "heart" : "heart-outline"}
                                    size={24}
                                    color={isFavorite ? "#FF5252" : "#FFFFFF"}
                                />
                            </AppTouchableRipple>
                        </View>
                    </View>

                    {/* Product Info Card */}
                    <View style={[styles.productInfoCard, { backgroundColor: colors.backgroundPrimary }]}>
                        {/* Category Badge */}
                        <TouchableOpacity
                            style={[styles.categoryBadge, { backgroundColor: colors.themePrimaryLight }]}
                            onPress={() => navigation.navigate(constant.routeName.categoryDetail, {
                                categoryId: product.category_id,
                                categoryName: product.category.name
                            })}
                        >
                            <Icon name="tag" size={14} color={colors.themePrimary} />
                            <Text style={[styles.categoryBadgeText, { color: colors.themePrimary }]}>
                                {product.category.name}
                            </Text>
                            <Icon name="chevron-right" size={14} color={colors.themePrimary} />
                        </TouchableOpacity>

                        {/* Product Name */}
                        <Text style={[styles.productName, { color: colors.textPrimary }]}>
                            {product.name}
                        </Text>

                        {/* Stock Status */}
                        <View style={[styles.stockStatusBadge, { backgroundColor: stockStatus.bgColor }]}>
                            <Icon name={stockStatus.icon} size={16} color={stockStatus.color} />
                            <Text style={[styles.stockStatusText, { color: stockStatus.color }]}>
                                {stockStatus.label} • {product.stock} units available
                            </Text>
                        </View>

                        {/* Price Section */}
                        <View style={styles.priceSection}>
                            <View>
                                <Text style={[styles.priceLabel, { color: colors.textLabel }]}>Price</Text>
                                <Text style={[styles.price, { color: colors.themePrimary }]}>
                                    ₹{parseFloat(product.price).toFixed(2)}
                                </Text>
                                <Text style={[styles.priceSubtext, { color: colors.textDescription }]}>
                                    Per piece
                                </Text>
                            </View>

                            {/* Quantity Selector */}
                            <View style={[styles.quantitySelector, { backgroundColor: colors.backgroundSecondary }]}>
                                <Text style={[styles.quantityLabel, { color: colors.textLabel }]}>Quantity</Text>
                                <View style={styles.quantityControls}>
                                    <AppTouchableRipple
                                        style={{
                                            ...styles.quantityButton,
                                            backgroundColor: colors.themePrimaryLight
                                        }}
                                        onPress={() => handleQuantityChange(-1)}
                                        disabled={quantity <= 1}
                                    >
                                        <Icon name="minus" size={20} color={colors.themePrimary} />
                                    </AppTouchableRipple>

                                    <Text style={[styles.quantityValue, { color: colors.textPrimary }]}>
                                        {quantity}
                                    </Text>

                                    <AppTouchableRipple
                                        style={{
                                            ...styles.quantityButton,
                                            backgroundColor: colors.themePrimaryLight
                                        }}
                                        onPress={() => handleQuantityChange(1)}
                                        disabled={quantity >= product.stock}
                                    >
                                        <Icon name="plus" size={20} color={colors.themePrimary} />
                                    </AppTouchableRipple>
                                </View>
                            </View>
                        </View>

                        {/* Total Price */}
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

                        {/* Description */}
                        <View style={styles.descriptionSection}>
                            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                                Product Description
                            </Text>
                            <Text style={[styles.description, { color: colors.textDescription }]}>
                                {product.description}
                            </Text>
                        </View>

                        {/* Features */}
                        <View style={styles.featuresSection}>
                            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                                Product Features
                            </Text>
                            <View style={styles.featuresList}>
                                <FeatureItem
                                    icon="leaf"
                                    title="100% Organic"
                                    description="Certified organic product"
                                    colors={colors}
                                />
                                <FeatureItem
                                    icon="truck-fast"
                                    title="Fast Delivery"
                                    description="Same day delivery available"
                                    colors={colors}
                                />
                                <FeatureItem
                                    icon="shield-check"
                                    title="Quality Assured"
                                    description="Freshness guaranteed"
                                    colors={colors}
                                />
                                <FeatureItem
                                    icon="cash-refund"
                                    title="Easy Returns"
                                    description="7-day return policy"
                                    colors={colors}
                                />
                            </View>
                        </View>

                        {/* Product Info Grid */}
                        <View style={styles.infoGrid}>
                            <View style={[styles.infoCard, { backgroundColor: colors.backgroundSecondary }]}>
                                <Icon name="package-variant" size={24} color={colors.themePrimary} />
                                <Text style={[styles.infoLabel, { color: colors.textLabel }]}>Stock</Text>
                                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                                    {product.stock}
                                </Text>
                            </View>

                            <View style={[styles.infoCard, { backgroundColor: colors.backgroundSecondary }]}>
                                <Icon name="tag-multiple" size={24} color={colors.themePrimary} />
                                <Text style={[styles.infoLabel, { color: colors.textLabel }]}>Category</Text>
                                <Text style={[styles.infoValue, { color: colors.textPrimary }]} numberOfLines={1}>
                                    {product.category.name}
                                </Text>
                            </View>

                            <View style={[styles.infoCard, { backgroundColor: colors.backgroundSecondary }]}>
                                <Icon name="star" size={24} color="#FFC107" />
                                <Text style={[styles.infoLabel, { color: colors.textLabel }]}>Rating</Text>
                                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                                    4.8★
                                </Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>

                {/* Bottom Action Bar */}
                <View style={[styles.bottomBar, { backgroundColor: colors.backgroundPrimary, marginBottom: insets.bottom }]}>
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
                            style={{
                                ...styles.addToCartButton,
                                backgroundColor: product.stock === 0
                                    ? colors.textLabel
                                    : inCart
                                        ? colors.themePrimary
                                        : colors.themePrimary
                            }}
                            onPress={handleAddToCart}
                            disabled={product.stock === 0}
                        >
                            <Icon
                                name={inCart ? "check-circle" : "cart-plus"}
                                size={22}
                                color={colors.white}
                            />
                            <Text style={[styles.addToCartText, { color: colors.white }]}>
                                {product.stock === 0
                                    ? 'Out of Stock'
                                    : inCart
                                        ? 'Update Cart'
                                        : 'Add to Cart'}
                            </Text>
                        </AppTouchableRipple>
                    </View>
                </View>
            </View>
        </MainContainer>
    );
};

// Image Card Component
interface ImageCardProps {
    imageUrl: string;
    colors: AppColors;
}

const ImageCard: React.FC<ImageCardProps> = memo(({ imageUrl, colors }) => {
    const [imageError, setImageError] = useState(false);

    const handleImageError = useCallback(() => {
        setImageError(true);
    }, []);

    return (
        <View style={styles.imageCard}>
            {!imageError ? (
                <Image
                    source={{ uri: imageUrl }}
                    style={styles.productImage}
                    resizeMode="cover"
                    onError={handleImageError}
                />
            ) : (
                <View style={[styles.imagePlaceholder, { backgroundColor: colors.themePrimaryLight }]}>
                    <Icon name="image-off" size={64} color={colors.themePrimary} />
                </View>
            )}
        </View>
    );
});

// Feature Item Component
interface FeatureItemProps {
    icon: string;
    title: string;
    description: string;
    colors: AppColors;
}

const FeatureItem: React.FC<FeatureItemProps> = memo(({ icon, title, description, colors }) => {
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

export default ProductDetailScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100,
    },

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
    categoryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
        marginBottom: 12,
    },
    categoryBadgeText: {
        fontSize: fonts.size.font12,
        fontFamily: fonts.family.primaryBold,
        textTransform: 'uppercase',
    },
    productName: {
        fontSize: fonts.size.font28,
        fontFamily: fonts.family.primaryBold,
        marginBottom: 12,
        lineHeight: 36,
    },
    stockStatusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 8,
        marginBottom: 20,
    },
    stockStatusText: {
        fontSize: fonts.size.font13,
        fontFamily: fonts.family.primaryBold,
    },

    // Price Section
    priceSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
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