import React, { useState, useCallback, useMemo, memo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppColors } from '../styles/colors';
import fonts from '../styles/fonts';
import { getImageUrl, getStockStatus } from './utils';
import { Product } from '../screens/front/ProductListScreen';
import CartQuickAdjust from '../components/CartQuickAdjust';
import { MAX_CART_QUANTITY_PER_ITEM } from '../contexts/CardContext';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

const formatPrice = (price: string | number): string =>
    `₹${parseFloat(price.toString()).toFixed(2)}`;

/**
 * Only show the original (struck-through) price when it is different
 * from the current selling price.
 */
const shouldShowActualPrice = (actualPrice?: string, currentPrice?: string): boolean => {
    if (!actualPrice || actualPrice === '0' || actualPrice === '0.00') return false;
    if (!currentPrice) return false;
    return parseFloat(actualPrice) !== parseFloat(currentPrice);
};

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

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
                <Text style={[styles.strikePrice, { color: colors.textDescription }]}>
                    {formatPrice(actualPrice!)}
                </Text>
            )}
            <Text style={[styles.price, { color: colors.textPrimary }]}>
                {formatPrice(price)}
            </Text>
        </View>
    );
});
PriceDisplay.displayName = 'PriceDisplay';

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

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
    isFavorite = false,
}) => {
    const stockStatus = useMemo(() => getStockStatus(item.stock), [item.stock]);
    const [imageError, setImageError] = useState(false);

    const handleImageError = useCallback(() => setImageError(true), []);
    const handlePress = useCallback(() => onPress(item), [item, onPress]);
    const handleAddToCart = useCallback(() => onAddToCart(item), [item, onAddToCart]);
    const handleFavorite = useCallback(() => onToggleFavorite?.(item), [item, onToggleFavorite]);

    /** True when the quantity stepper should replace the "add" button. */
    const showStepper = isInCart && cartQuantity > 0 && !!onUpdateQuantity && !!onRemoveFromCart;

    return (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.backgroundSecondary }]}
            onPress={handlePress}
            activeOpacity={0.85}
        >
            {/* ── Left: product image ── */}
            <View style={styles.imageWrapper}>
                {item.image1 && !imageError ? (
                    <Image
                        source={{ uri: getImageUrl(item.image1) }}
                        style={styles.image}
                        resizeMode="center"
                        onError={handleImageError}
                    />
                ) : (
                    <View style={[styles.imagePlaceholder, { backgroundColor: colors.themePrimaryLight }]}>
                        <Icon name="image-off" size={28} color={colors.themePrimary} />
                    </View>
                )}

                {/* Stock count badge */}
                <View style={[styles.stockBadge, { backgroundColor: stockStatus.bgColor }]}>
                    <Text style={[styles.stockBadgeText, { color: stockStatus.color }]}>
                        {item.stock}
                    </Text>
                </View>

                {/* Wishlist button */}
                {onToggleFavorite && (
                    <TouchableOpacity
                        style={styles.wishlistBtn}
                        onPress={handleFavorite}
                        activeOpacity={0.7}
                        onPressIn={e => e.stopPropagation()}
                    >
                        <Icon
                            name={isFavorite ? 'heart' : 'heart-outline'}
                            size={18}
                            color={isFavorite ? '#FF5252' : colors.themePrimary}
                        />
                    </TouchableOpacity>
                )}
            </View>

            {/* ── Right: product info ── */}
            <View style={styles.info}>

                {/* Category chip */}
                <View style={[styles.categoryChip, { backgroundColor: colors.themePrimaryLight }]}>
                    <Text
                        style={[styles.categoryChipText, { color: colors.themePrimary }]}
                        numberOfLines={1}
                    >
                        {item.category.name}
                    </Text>
                </View>

                {/* Product name */}
                <Text
                    style={[styles.productName, { color: colors.textPrimary }]}
                    numberOfLines={1}
                >
                    {item.name}
                </Text>

                {/* Description */}
                <Text
                    style={[styles.description, { color: colors.textDescription }]}
                    numberOfLines={2}
                >
                    {item.description}
                </Text>

                {/* ── Footer: price + stock status + action ──────────────────
                 *  LAYOUT RULES:
                 *  • Default state → price left, [stock badge + cart button] right
                 *  • In-cart state → price left, [stock badge] right on the first
                 *    row; stepper on its own second row (full width of info column)
                 *
                 *  Separating the stepper into its own row prevents it from
                 *  getting squeezed or pushed outside the card.
                 * ─────────────────────────────────────────────────────────── */}
                <View style={styles.footer}>

                    {/* Row 1: price + stock badge (+ cart button when NOT in cart) */}
                    <View style={styles.footerRow}>
                        <PriceDisplay
                            price={item.price}
                            actualPrice={item.actual_price}
                            colors={colors}
                        />

                        <View style={styles.rightActions}>
                            {/* Stock status label */}
                            <View style={[styles.stockLabel, { backgroundColor: stockStatus.bgColor }]}>
                                <Icon name="package-variant" size={12} color={stockStatus.color} />
                                <Text style={[styles.stockLabelText, { color: stockStatus.color }]}>
                                    {stockStatus.label}
                                </Text>
                            </View>

                            {/* Add-to-cart button (only in default state) */}
                            {!showStepper && (
                                <TouchableOpacity
                                    style={[
                                        styles.addButton,
                                        {
                                            backgroundColor: item.stock === 0
                                                ? colors.buttonDisabled
                                                : colors.themePrimary,
                                            opacity: item.stock === 0 ? 0.6 : 1,
                                        },
                                    ]}
                                    onPress={handleAddToCart}
                                    onPressIn={e => e.stopPropagation()}
                                    disabled={item.stock === 0}
                                    activeOpacity={0.75}
                                >
                                    <Icon name="cart-plus" size={18} color={colors.white} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Row 2: quantity stepper – only rendered when item is in cart */}
                    {showStepper && (
                        <View
                            style={styles.stepperRow}
                            onStartShouldSetResponder={() => true}
                        >
                            <CartQuickAdjust
                                quantity={cartQuantity}
                                onIncrease={() => onUpdateQuantity!(item.id, cartQuantity + 1)}
                                onDecrease={() => onUpdateQuantity!(item.id, cartQuantity - 1)}
                                onRemove={() => onRemoveFromCart!(item.id)}
                                maxQuantity={Math.min(item.stock, MAX_CART_QUANTITY_PER_ITEM)}
                                disabled={item.stock === 0}
                                colors={colors}
                                variant="list"
                            />
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
});

ProductListItem.displayName = 'ProductListItem';
export default ProductListItem;

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    // ── Card shell ────────────────────────────────────────────────────────────
    card: {
        flexDirection: 'row',
        gap: 14,
        borderRadius: 18,
        padding: 14,
        marginBottom: 14,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
    },

    // ── Image area ────────────────────────────────────────────────────────────
    imageWrapper: {
        width: 100,
        height: 100,
        borderRadius: 14,
        overflow: 'hidden',
        position: 'relative',
        flexShrink: 0,          // Never let the image compress
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // ── Overlaid badges ───────────────────────────────────────────────────────
    stockBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        minWidth: 24,
        alignItems: 'center',
    },
    stockBadgeText: {
        fontSize: fonts.size.font10,
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
        backgroundColor: 'rgba(255,255,255,0.92)',
        elevation: 1,
    },

    // ── Info column ───────────────────────────────────────────────────────────
    info: {
        flex: 1,                // Takes all remaining width after the image
        gap: 5,
        minWidth: 0,            // Allows flex children to shrink/wrap properly
    },

    // ── Category chip ─────────────────────────────────────────────────────────
    categoryChip: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    categoryChipText: {
        fontSize: fonts.size.font9,
        fontFamily: fonts.family.primaryBold,
        textTransform: 'uppercase',
        letterSpacing: 0.4,
    },

    // ── Text ──────────────────────────────────────────────────────────────────
    productName: {
        fontSize: fonts.size.font16,
        fontFamily: fonts.family.primaryBold,
    },
    description: {
        fontSize: fonts.size.font12,
        fontFamily: fonts.family.secondaryRegular,
        lineHeight: 18,
    },

    // ── Footer ────────────────────────────────────────────────────────────────
    footer: {
        marginTop: 'auto',
        gap: 8,                 // Space between row-1 and the stepper row-2
    },
    /**
     * Row 1: price on the left, stock-badge + add-button on the right.
     * Using `flexShrink: 1` on the price ensures the right-side actions
     * never get pushed off-screen.
     */
    footerRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 8,
    },
    /** Groups the stock badge and the add-to-cart button. */
    rightActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexShrink: 0,          // Keep the action group intact, never squish it
    },
    /** Stock status chip inside the footer. */
    stockLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    stockLabelText: {
        fontSize: fonts.size.font9,
        fontFamily: fonts.family.primaryBold,
    },
    /** Add-to-cart button (default / not-in-cart state). */
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    /**
     * Row 2 (in-cart only): stepper sits on its own full-width row so it
     * never overflows or competes for horizontal space with the price.
     */
    stepperRow: {
        alignSelf: 'flex-end',  // Right-align the stepper within the info column
    },

    // ── Prices ────────────────────────────────────────────────────────────────
    strikePrice: {
        fontSize: fonts.size.font12,
        fontFamily: fonts.family.secondaryRegular,
        textDecorationLine: 'line-through',
        marginBottom: 2,
    },
    price: {
        fontSize: fonts.size.font18,
        fontFamily: fonts.family.primaryBold,
    },
});