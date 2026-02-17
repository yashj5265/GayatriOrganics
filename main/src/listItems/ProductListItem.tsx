import React, { useState, useCallback, useMemo, memo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppColors } from '../styles/colors';
import fonts from '../styles/fonts';
import { getImageUrl, getStockStatus } from './utils';
import { Product } from '../screens/front/ProductListScreen';
import CartQuickAdjust from '../components/CartQuickAdjust';
import { MAX_CART_QUANTITY_PER_ITEM } from '../contexts/CardContext';

// ============================================================================
// TYPES
// ============================================================================
export interface ProductListItemProps {
    item: Product;
    onPress: (product: Product) => void;
    onAddToCart: (product: Product) => void;
    isInCart: boolean;
    cartQuantity?: number;
    onUpdateQuantity?: (productId: number, quantity: number) => void;
    onRemoveFromCart?: (productId: number) => void;
    colors: AppColors;
    onToggleFavorite?: (product: Product) => void;
    isFavorite?: boolean;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
const formatPrice = (price: string | number): string => {
    return `₹${parseFloat(price.toString()).toFixed(2)}`;
};

const shouldShowActualPrice = (actualPrice?: string, currentPrice?: string): boolean => {
    if (!actualPrice || actualPrice === '0' || actualPrice === '0.00') return false;
    if (!currentPrice) return false;
    return parseFloat(actualPrice) !== parseFloat(currentPrice);
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================
const PriceDisplay = memo(({
    price,
    actualPrice,
    colors,
}: {
    price: string;
    actualPrice?: string;
    colors: AppColors;
}) => {
    const showActualPrice = shouldShowActualPrice(actualPrice, price);

    return (
        <View>
            {showActualPrice && (
                <Text style={[styles.actualPriceList, { color: colors.textDescription }]}>
                    {formatPrice(actualPrice!)}
                </Text>
            )}
            <Text style={[styles.listPrice, { color: colors.textPrimary }]}>
                {formatPrice(price)}
            </Text>
        </View>
    );
});

PriceDisplay.displayName = 'PriceDisplay';

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const ProductListItem: React.FC<ProductListItemProps> = memo(({
    item,
    onPress,
    onAddToCart,
    isInCart,
    cartQuantity = 0,
    onUpdateQuantity,
    onRemoveFromCart,
    colors,
    onToggleFavorite,
    isFavorite = false
}) => {
    const stockStatus = useMemo(() => getStockStatus(item.stock), [item.stock]);
    const [imageError, setImageError] = useState(false);

    const handleImageError = useCallback(() => {
        setImageError(true);
    }, []);

    const handlePress = useCallback(() => {
        onPress(item);
    }, [item, onPress]);

    const handleAddToCartPress = useCallback(() => {
        onAddToCart(item);
    }, [item, onAddToCart]);

    const handleFavoritePress = useCallback(() => {
        onToggleFavorite?.(item);
    }, [item, onToggleFavorite]);

    const cardStyle = useMemo(() => ({
        ...styles.listCard,
        backgroundColor: colors.backgroundSecondary
    }), [colors.backgroundSecondary]);

    return (
        <TouchableOpacity
            style={cardStyle}
            onPress={handlePress}
            activeOpacity={0.8}
        >
            <View style={styles.listContent}>
                <View style={styles.listImageContainer}>
                    {item.image1 && !imageError ? (
                        <Image
                            source={{ uri: getImageUrl(item.image1) }}
                            style={styles.listImage}
                            resizeMode='center'
                            onError={handleImageError}
                        />
                    ) : (
                        <View style={[styles.listImagePlaceholder, { backgroundColor: colors.themePrimaryLight }]}>
                            <Icon name="image-off" size={28} color={colors.themePrimary} />
                        </View>
                    )}

                    <View style={[styles.listStockBadge, { backgroundColor: stockStatus.bgColor }]}>
                        <Text style={[styles.listStockBadgeText, { color: stockStatus.color }]}>
                            {item.stock}
                        </Text>
                    </View>

                    {onToggleFavorite && (
                        <TouchableOpacity
                            style={styles.favoriteButton}
                            onPress={handleFavoritePress}
                            activeOpacity={0.7}
                            onPressIn={(e) => e.stopPropagation()}
                        >
                            <Icon
                                name={isFavorite ? "heart" : "heart-outline"}
                                size={18}
                                color={isFavorite ? "#FF5252" : colors.themePrimary}
                            />
                        </TouchableOpacity>
                    )}
                </View>

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
                        <PriceDisplay
                            price={item.price}
                            actualPrice={item.actual_price}
                            colors={colors}
                        />

                        <View style={styles.listActions}>
                            <View style={[styles.stockStatus, { backgroundColor: stockStatus.bgColor }]}>
                                <Icon name="package-variant" size={12} color={stockStatus.color} />
                                <Text style={[styles.stockStatusText, { color: stockStatus.color }]}>
                                    {stockStatus.label}
                                </Text>
                            </View>
                            {isInCart && cartQuantity > 0 && onUpdateQuantity && onRemoveFromCart ? (
                                <View style={styles.quickAdjustWrap} onStartShouldSetResponder={() => true}>
                                    <CartQuickAdjust
                                        quantity={cartQuantity}
                                        onIncrease={() => onUpdateQuantity(item.id, cartQuantity + 1)}
                                        onDecrease={() => onUpdateQuantity(item.id, cartQuantity - 1)}
                                        onRemove={() => onRemoveFromCart(item.id)}
                                        maxQuantity={Math.min(item.stock, MAX_CART_QUANTITY_PER_ITEM)}
                                        disabled={item.stock === 0}
                                        colors={colors}
                                        variant="list"
                                    />
                                </View>
                            ) : (
                            <TouchableOpacity
                                style={[
                                    styles.cartButton,
                                    {
                                        backgroundColor: item.stock === 0 ? colors.buttonDisabled : colors.themePrimary,
                                        opacity: item.stock === 0 ? 0.6 : 1,
                                    }
                                ]}
                                onPress={handleAddToCartPress}
                                onPressIn={(e) => e.stopPropagation()}
                                disabled={item.stock === 0}
                                activeOpacity={0.7}
                            >
                                <Icon
                                    name="cart-plus"
                                    size={18}
                                    color={colors.white}
                                />
                            </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
});

ProductListItem.displayName = 'ProductListItem';

export default ProductListItem;

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
    listCard: {
        borderRadius: 18,
        padding: 14,
        marginBottom: 14,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
    },
    listContent: {
        flexDirection: 'row',
        gap: 14,
    },
    listImageContainer: {
        width: 100,
        height: 100,
        borderRadius: 14,
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
        top: 8,
        right: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        minWidth: 24,
        alignItems: 'center',
    },
    listStockBadgeText: {
        fontSize: fonts.size.font10,
        fontFamily: fonts.family.primaryBold,
    },
    favoriteButton: {
        position: 'absolute',
        top: 8,
        left: 8,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.92)',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
    },
    listInfo: {
        flex: 1,
        gap: 6,
    },
    categoryTag: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginBottom: 6,
        alignSelf: 'flex-start',
    },
    categoryTagText: {
        fontSize: fonts.size.font9,
        fontFamily: fonts.family.primaryBold,
        textTransform: 'uppercase',
        letterSpacing: 0.4,
    },
    listProductName: {
        fontSize: fonts.size.font16,
        fontFamily: fonts.family.primaryBold,
    },
    listDescription: {
        fontSize: fonts.size.font12,
        fontFamily: fonts.family.secondaryRegular,
        lineHeight: 18,
    },
    listFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: 'auto',
    },
    actualPriceList: {
        fontSize: fonts.size.font12,
        fontFamily: fonts.family.secondaryRegular,
        textDecorationLine: 'line-through',
        marginBottom: 2,
    },
    listPrice: {
        fontSize: fonts.size.font18,
        fontFamily: fonts.family.primaryBold,
    },
    listActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    stockStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    stockStatusText: {
        fontSize: fonts.size.font9,
        fontFamily: fonts.family.primaryBold,
    },
    cartButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    quickAdjustWrap: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});