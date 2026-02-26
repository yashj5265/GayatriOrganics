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

export interface ProductGridItemProps {
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
 * Only show the strikethrough "actual price" when it differs from the selling price.
 */
const shouldShowActualPrice = (actualPrice?: string, currentPrice?: string): boolean => {
    if (!actualPrice || actualPrice === '0' || actualPrice === '0.00') return false;
    if (!currentPrice) return false;
    return parseFloat(actualPrice) !== parseFloat(currentPrice);
};

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

/** Shows selling price and, when relevant, the struck-through original price. */
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

const ProductGridItem: React.FC<ProductGridItemProps> = memo(({
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
            {/* ── Product image with overlaid badges ── */}
            <View style={styles.imageWrapper}>
                {item.image1 && !imageError ? (
                    <Image
                        source={{ uri: getImageUrl(item.image1) }}
                        style={styles.image}
                        resizeMode="cover"
                        onError={handleImageError}
                    />
                ) : (
                    <View style={[styles.imagePlaceholder, { backgroundColor: colors.themePrimaryLight }]}>
                        <Icon name="image-off" size={28} color={colors.themePrimary} />
                    </View>
                )}

                {/* Stock count badge – top-right */}
                <View style={[styles.stockBadge, { backgroundColor: stockStatus.bgColor }]}>
                    <Text style={[styles.stockBadgeText, { color: stockStatus.color }]}>
                        {item.stock}
                    </Text>
                </View>

                {/* Wishlist button – top-left */}
                {onToggleFavorite && (
                    <TouchableOpacity
                        style={styles.wishlistBtn}
                        activeOpacity={0.7}
                        onPressIn={e => e.stopPropagation()}
                        onPress={handleFavorite}
                    >
                        <Icon
                            name={isFavorite ? 'heart' : 'heart-outline'}
                            size={14}
                            color={isFavorite ? '#FF5252' : colors.themePrimary}
                        />
                    </TouchableOpacity>
                )}
            </View>

            {/* ── Card body ── */}
            <View style={styles.body}>
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
                    numberOfLines={2}
                >
                    {item.name}
                </Text>

                {/* Stock status label */}
                <View style={[styles.stockLabel, { backgroundColor: stockStatus.bgColor }]}>
                    <Icon name="package-variant" size={10} color={stockStatus.color} />
                    <Text style={[styles.stockLabelText, { color: stockStatus.color }]}>
                        {stockStatus.label}
                    </Text>
                </View>

                {/* ── Footer: price row + action ──────────────────────────────
                 *  LAYOUT RULE:
                 *  • Default state  → row  (price left, cart-icon button right)
                 *  • In-cart state  → column (price on top, stepper below)
                 *
                 *  Keeping them separate avoids the stepper overflowing the
                 *  narrow grid-column width.
                 * ─────────────────────────────────────────────────────────── */}
                <View style={styles.footer}>
                    <PriceDisplay
                        price={item.price}
                        actualPrice={item.actual_price}
                        colors={colors}
                    />

                    {showStepper ? (
                        /* In-cart: stepper sits on its own row, full width */
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
                                variant="grid"
                            />
                        </View>
                    ) : (
                        /* Not in cart: small circular "add" button aligned right */
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
                            <Icon name="cart-plus" size={14} color={colors.white} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
});

ProductGridItem.displayName = 'ProductGridItem';
export default ProductGridItem;

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    // ── Card shell ────────────────────────────────────────────────────────────
    card: {
        flex: 1,
        borderRadius: 14,
        overflow: 'hidden',
        marginBottom: 10,
        marginHorizontal: 3,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.07,
        shadowRadius: 6,
    },

    // ── Image area ────────────────────────────────────────────────────────────
    imageWrapper: {
        width: '100%',
        height: 100,           // Reduced from 124 → more compact
        position: 'relative',
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
        top: 6,
        right: 6,
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 7,
        minWidth: 22,
        alignItems: 'center',
    },
    stockBadgeText: {
        fontSize: fonts.size.font9,
        fontFamily: fonts.family.primaryBold,
    },
    wishlistBtn: {
        position: 'absolute',
        top: 6,
        left: 6,
        width: 26,
        height: 26,
        borderRadius: 13,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.92)',
        elevation: 1,
    },

    // ── Card body ─────────────────────────────────────────────────────────────
    body: {
        padding: 8,             // Reduced from 12 → tighter / more modern
        gap: 4,
    },

    // ── Category chip ─────────────────────────────────────────────────────────
    categoryChip: {
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 5,
        alignSelf: 'flex-start',
    },
    categoryChipText: {
        fontSize: fonts.size.font9,
        fontFamily: fonts.family.primaryBold,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },

    // ── Product name ──────────────────────────────────────────────────────────
    productName: {
        fontSize: fonts.size.font12,   // Reduced from 13
        fontFamily: fonts.family.primaryBold,
        minHeight: 30,
        lineHeight: 16,
    },

    // ── Stock status label ────────────────────────────────────────────────────
    stockLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 6,
        gap: 3,
    },
    stockLabelText: {
        fontSize: fonts.size.font9,
        fontFamily: fonts.family.primaryBold,
    },

    // ── Footer ────────────────────────────────────────────────────────────────
    /**
     * Column layout so:
     *  - Price always renders at the top
     *  - The stepper renders below when in cart, using full card width
     *  - This prevents the stepper from overflowing in narrow grid columns
     */
    footer: {
        marginTop: 4,
        flexDirection: 'column',
        gap: 6,
    },
    /** Row containing the CartQuickAdjust, fills available width. */
    stepperRow: {
        width: '100%',
        alignItems: 'center',
    },

    // ── Prices ────────────────────────────────────────────────────────────────
    strikePrice: {
        fontSize: fonts.size.font10,
        fontFamily: fonts.family.secondaryRegular,
        textDecorationLine: 'line-through',
        marginBottom: 1,
    },
    price: {
        fontSize: fonts.size.font13,   // Slightly smaller for compact grid
        fontFamily: fonts.family.primaryBold,
    },

    // ── Add-to-cart button (default state) ────────────────────────────────────
    addButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'flex-end',   // Keep it right-aligned even in column layout
    },
});