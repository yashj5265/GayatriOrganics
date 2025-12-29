import React, { useState, useCallback, memo, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import MainContainer from '../../container/MainContainer';
import { useTheme } from '../../contexts/ThemeProvider';
import { useCart } from '../../contexts/CardContext';
import AppTouchableRipple from '../../components/AppTouchableRipple';
import EmptyData, { EmptyDataType } from '../../components/EmptyData';
import fonts from '../../styles/fonts';
import constant from '../../utilities/constant';
import { getImageUrl } from '../../listItems';

// ============================================================================
// CONSTANTS
// ============================================================================
const DELIVERY_CHARGE = 30;
const FREE_DELIVERY_THRESHOLD = 200;
const ESTIMATED_DELIVERY_TIME = '24-48 hours';
const CURRENT_SAVINGS = 0;

// ============================================================================
// TYPES
// ============================================================================
interface CartScreenProps {
    navigation: NativeStackNavigationProp<any>;
};

interface CartItemType {
    id: number;
    name: string;
    price: number;
    quantity: number;
    unit: string;
    image?: string;
}

interface QuantityControlsProps {
    quantity: number;
    isProcessing: boolean;
    onIncrease: () => void;
    onDecrease: () => void;
}

interface CartItemCardProps {
    item: CartItemType;
    isProcessing: boolean;
    hasImageError: boolean;
    onQuantityChange: (change: number) => void;
    onRemove: () => void;
    onImageError: () => void;
}

interface BillDetailsProps {
    cartCount: number;
    cartTotal: number;
    deliveryCharge: number;
    total: number;
    savings: number;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
const formatCurrency = (amount: number | string | undefined | null): string => {
    if (amount === undefined || amount === null) {
        return '₹0.00';
    }
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) {
        return '₹0.00';
    }
    return `₹${numAmount.toFixed(2)}`;
};

const getItemWord = (count: number): string => {
    return count === 1 ? 'item' : 'items';
};

// ============================================================================
// SUB COMPONENTS
// ============================================================================
const CartHeader = memo(({
    cartCount,
    hasItems,
    onClearCart,
}: {
    cartCount: number;
    hasItems: boolean;
    onClearCart: () => void;
}) => {
    const colors = useTheme();

    return (
        <View style={[styles.header, { backgroundColor: colors.themePrimary }]}>
            <View style={styles.headerContent}>
                <View>
                    <Text style={[styles.headerTitle, { color: colors.white }]}>
                        My Cart
                    </Text>
                    <Text style={[styles.headerSubtitle, { color: colors.white }]}>
                        {cartCount} {getItemWord(cartCount)}
                    </Text>
                </View>

                {hasItems && (
                    <AppTouchableRipple
                        style={[styles.clearButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
                        onPress={onClearCart}
                    >
                        <Icon name="delete-outline" size={20} color={colors.white} />
                        <Text style={[styles.clearButtonText, { color: colors.white }]}>
                            Clear
                        </Text>
                    </AppTouchableRipple>
                )}
            </View>
        </View>
    );
});

const EmptyCartView = memo(({ onShopNow }: { onShopNow: () => void }) => {
    const colors = useTheme();

    return (
        <>
            <View style={[styles.header, { backgroundColor: colors.themePrimary }]}>
                <Text style={[styles.headerTitle, { color: colors.white }]}>
                    My Cart
                </Text>
                <Text style={[styles.headerSubtitle, { color: colors.white }]}>
                    0 items
                </Text>
            </View>

            <View style={styles.emptyContainer}>
                <EmptyData
                    type={EmptyDataType.NO_RECORDS}
                    title="Your Cart is Empty"
                    description="Add products to your cart to see them here"
                />

                <AppTouchableRipple
                    style={[styles.shopNowButton, { backgroundColor: colors.themePrimary }]}
                    onPress={onShopNow}
                >
                    <Icon name="shopping" size={20} color={colors.white} />
                    <Text style={[styles.shopNowText, { color: colors.white }]}>
                        Start Shopping
                    </Text>
                </AppTouchableRipple>
            </View>
        </>
    );
});

const QuantityControls = memo(({
    quantity,
    isProcessing,
    onIncrease,
    onDecrease,
}: QuantityControlsProps) => {
    const colors = useTheme();

    return (
        <View style={styles.quantityContainer}>
            <AppTouchableRipple
                style={[
                    styles.quantityButton,
                    {
                        backgroundColor: colors.themePrimaryLight,
                        opacity: isProcessing ? 0.5 : 1,
                    },
                ]}
                onPress={onDecrease}
                disabled={isProcessing}
            >
                <Icon name="minus" size={16} color={colors.themePrimary} />
            </AppTouchableRipple>

            <Text style={[styles.quantityText, { color: colors.textPrimary }]}>
                {quantity}
            </Text>

            <AppTouchableRipple
                style={[
                    styles.quantityButton,
                    {
                        backgroundColor: colors.themePrimaryLight,
                        opacity: isProcessing ? 0.5 : 1,
                    },
                ]}
                onPress={onIncrease}
                disabled={isProcessing}
            >
                <Icon name="plus" size={16} color={colors.themePrimary} />
            </AppTouchableRipple>
        </View>
    );
});

const CartItemCard = memo(({
    item,
    isProcessing,
    hasImageError,
    onQuantityChange,
    onRemove,
    onImageError,
}: CartItemCardProps) => {
    const colors = useTheme();
    const itemTotal = item.price * item.quantity;

    return (
        <View
            style={[
                styles.cartItem,
                {
                    backgroundColor: colors.backgroundSecondary,
                    opacity: isProcessing ? 0.7 : 1,
                },
            ]}
        >
            {/* Item Image */}
            <View style={[styles.itemImageContainer, { backgroundColor: colors.themePrimaryLight }]}>
                {item.image && !hasImageError ? (
                    <Image
                        source={{ uri: getImageUrl(item.image) }}
                        style={styles.itemImage}
                        resizeMode="cover"
                        onError={onImageError}
                    />
                ) : (
                    <Icon name="image-off" size={32} color={colors.themePrimary} />
                )}
            </View>

            {/* Item Details */}
            <View style={styles.itemDetails}>
                <Text style={[styles.itemName, { color: colors.textPrimary }]}>
                    {item.name}
                </Text>
                <Text style={[styles.itemUnit, { color: colors.textLabel }]}>
                    ₹{item.price} per {item.unit}
                </Text>

                <QuantityControls
                    quantity={item.quantity}
                    isProcessing={isProcessing}
                    onIncrease={() => onQuantityChange(1)}
                    onDecrease={() => onQuantityChange(-1)}
                />
            </View>

            {/* Item Right - Price & Remove */}
            <View style={styles.itemRight}>
                <Text style={[styles.itemTotal, { color: colors.themePrimary }]}>
                    ₹{itemTotal}
                </Text>
                <AppTouchableRipple onPress={onRemove} style={styles.removeButton}>
                    <Icon name="delete-outline" size={22} color="#FF5252" />
                </AppTouchableRipple>
            </View>
        </View>
    );
});

const BillRow = memo(({
    label,
    value,
    subtitle,
    isTotal = false,
}: {
    label: string;
    value: string;
    subtitle?: string;
    isTotal?: boolean;
}) => {
    const colors = useTheme();

    return (
        <View style={styles.billRow}>
            <View style={styles.billLabelContainer}>
                <Text
                    style={[
                        isTotal ? styles.totalLabel : styles.billLabel,
                        { color: isTotal ? colors.textPrimary : colors.textDescription },
                    ]}
                >
                    {label}
                </Text>
                {subtitle && (
                    <Text style={[styles.deliveryNote, { color: colors.textLabel }]}>
                        {subtitle}
                    </Text>
                )}
            </View>
            <Text
                style={[
                    isTotal ? styles.totalValue : styles.billValue,
                    { color: isTotal ? colors.themePrimary : colors.textPrimary },
                ]}
            >
                {value}
            </Text>
        </View>
    );
});

const BillDetails = memo(({
    cartCount,
    cartTotal,
    deliveryCharge,
    total,
    savings,
}: BillDetailsProps) => {
    const colors = useTheme();

    return (
        <View style={[styles.billCard, { backgroundColor: colors.backgroundSecondary }]}>
            {/* Header */}
            <View style={styles.billHeader}>
                <Icon name="receipt" size={20} color={colors.themePrimary} />
                <Text style={[styles.billTitle, { color: colors.textPrimary }]}>
                    Bill Details
                </Text>
            </View>

            {/* Item Total */}
            <BillRow
                label={`Item Total (${cartCount} ${getItemWord(cartCount)})`}
                value={formatCurrency(cartTotal)}
            />

            {/* Delivery Charge */}
            <BillRow
                label="Delivery Charge"
                value={deliveryCharge > 0 ? formatCurrency(deliveryCharge) : 'FREE'}
                subtitle={deliveryCharge > 0 ? 'Standard delivery' : undefined}
            />

            {/* Divider */}
            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Total */}
            <BillRow
                label="To Pay"
                value={formatCurrency(total)}
                isTotal
            />

            {/* Savings Badge */}
            <View style={[styles.savingsBadge, { backgroundColor: '#E8F5E9' }]}>
                <Icon name="tag" size={16} color="#4CAF50" />
                <Text style={styles.savingsText}>
                    You're saving ₹{savings} on this order
                </Text>
            </View>
        </View>
    );
});

const DeliveryInfo = memo(() => {
    const colors = useTheme();

    return (
        <View style={[styles.infoCard, { backgroundColor: colors.backgroundSecondary }]}>
            <Icon name="information" size={20} color={colors.themePrimary} />
            <View style={styles.infoContent}>
                <Text style={[styles.infoTitle, { color: colors.textPrimary }]}>
                    Delivery Information
                </Text>
                <Text style={[styles.infoText, { color: colors.textDescription }]}>
                    Your order will be delivered within {ESTIMATED_DELIVERY_TIME}. Free delivery on orders above ₹{FREE_DELIVERY_THRESHOLD}.
                </Text>
            </View>
        </View>
    );
});

const CheckoutFooter = memo(({
    total,
    onCheckout,
}: {
    total: number;
    onCheckout: () => void;
}) => {
    const colors = useTheme();

    return (
        <View
            style={[
                styles.footer,
                {
                    backgroundColor: colors.backgroundPrimary,
                    borderTopColor: colors.border,
                },
            ]}
        >
            <View>
                <Text style={[styles.footerLabel, { color: colors.textLabel }]}>
                    Total Amount
                </Text>
                <Text style={[styles.footerTotal, { color: colors.themePrimary }]}>
                    {formatCurrency(total)}
                </Text>
                <Text style={[styles.footerSubtext, { color: colors.textLabel }]}>
                    Including all taxes
                </Text>
            </View>

            <AppTouchableRipple
                style={[styles.checkoutButton, { backgroundColor: colors.themePrimary }]}
                onPress={onCheckout}
            >
                <Text style={[styles.checkoutText, { color: colors.white }]}>
                    Proceed to Checkout
                </Text>
                <Icon name="arrow-right" size={20} color={colors.white} />
            </AppTouchableRipple>
        </View>
    );
});

const CartItemsList = memo(({
    cartItems,
    processingItemId,
    imageErrors,
    onQuantityChange,
    onRemoveItem,
    onImageError,
}: {
    cartItems: CartItemType[];
    processingItemId: number | null;
    imageErrors: Set<number>;
    onQuantityChange: (itemId: number, change: number) => void;
    onRemoveItem: (itemId: number) => void;
    onImageError: (itemId: number) => void;
}) => {
    const colors = useTheme();

    return (
        <View style={styles.itemsSection}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Cart Items ({cartItems.length})
            </Text>

            {cartItems.map((item) => (
                <CartItemCard
                    key={item.id}
                    item={item}
                    isProcessing={processingItemId === item.id}
                    hasImageError={imageErrors.has(item.id)}
                    onQuantityChange={(change) => onQuantityChange(item.id, change)}
                    onRemove={() => onRemoveItem(item.id)}
                    onImageError={() => onImageError(item.id)}
                />
            ))}
        </View>
    );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const CartScreen: React.FC<CartScreenProps> = ({ navigation }) => {
    const colors = useTheme();
    const { cartItems, cartCount, cartTotal, updateQuantity, removeFromCart, clearCart } = useCart();
    const [processingItemId, setProcessingItemId] = useState<number | null>(null);
    const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

    // ============================================================================
    // COMPUTED VALUES
    // ============================================================================
    const deliveryCharge = useMemo(
        () => (cartItems.length > 0 ? DELIVERY_CHARGE : 0),
        [cartItems.length]
    );

    const total = useMemo(
        () => cartTotal + deliveryCharge,
        [cartTotal, deliveryCharge]
    );

    const hasItems = cartItems.length > 0;

    // ============================================================================
    // HANDLERS
    // ============================================================================
    const handleQuantityChange = useCallback(
        (itemId: number, change: number) => {
            const item = cartItems.find((i) => i.id === itemId);
            if (!item) return;

            const newQuantity = item.quantity + change;

            if (newQuantity <= 0) {
                handleRemoveItem(itemId);
                return;
            }

            setProcessingItemId(itemId);
            updateQuantity(itemId, newQuantity);
            setTimeout(() => setProcessingItemId(null), 300);
        },
        [cartItems, updateQuantity]
    );

    const handleRemoveItem = useCallback(
        (itemId: number) => {
            const item = cartItems.find((i) => i.id === itemId);

            Alert.alert(
                'Remove Item',
                `Are you sure you want to remove ${item?.name} from your cart?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Remove',
                        style: 'destructive',
                        onPress: () => removeFromCart(itemId),
                    },
                ]
            );
        },
        [cartItems, removeFromCart]
    );

    const handleClearCart = useCallback(() => {
        Alert.alert(
            'Clear Cart',
            'Are you sure you want to remove all items from your cart?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear All',
                    style: 'destructive',
                    onPress: clearCart,
                },
            ]
        );
    }, [clearCart]);

    const handleCheckout = useCallback(() => {
        if (!hasItems) {
            Alert.alert('Empty Cart', 'Please add items to your cart before checkout');
            return;
        }

        navigation.navigate(constant.routeName.checkout);
    }, [hasItems, navigation]);

    const handleShopNow = useCallback(() => {
        navigation.navigate(constant.routeName.mainTabs, {
            screen: constant.routeName.home,
        });
    }, [navigation]);

    const handleImageError = useCallback((itemId: number) => {
        setImageErrors((prev) => new Set(prev).add(itemId));
    }, []);

    // ============================================================================
    // RENDER - EMPTY STATE
    // ============================================================================
    if (!hasItems) {
        return (
            <MainContainer
                statusBarColor={colors.themePrimary}
                statusBarStyle="light-content"
                isInternetRequired={false}
            >
                <View style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}>
                    <EmptyCartView onShopNow={handleShopNow} />
                </View>
            </MainContainer>
        );
    }

    // ============================================================================
    // RENDER - CART WITH ITEMS
    // ============================================================================
    return (
        <MainContainer
            statusBarColor={colors.themePrimary}
            statusBarStyle="light-content"
            isInternetRequired={false}
        >
            <View style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}>
                {/* Header */}
                <CartHeader
                    cartCount={cartCount}
                    hasItems={hasItems}
                    onClearCart={handleClearCart}
                />

                {/* Cart Content */}
                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Cart Items List */}
                    <CartItemsList
                        cartItems={cartItems}
                        processingItemId={processingItemId}
                        imageErrors={imageErrors}
                        onQuantityChange={handleQuantityChange}
                        onRemoveItem={handleRemoveItem}
                        onImageError={handleImageError}
                    />

                    {/* Bill Details */}
                    <BillDetails
                        cartCount={cartCount}
                        cartTotal={cartTotal}
                        deliveryCharge={deliveryCharge}
                        total={total}
                        savings={CURRENT_SAVINGS}
                    />

                    {/* Delivery Info */}
                    <DeliveryInfo />
                </ScrollView>

                {/* Checkout Footer */}
                <CheckoutFooter total={total} onCheckout={handleCheckout} />
            </View>
        </MainContainer>
    );
};

export default memo(CartScreen);

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
        paddingBottom: 24,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: fonts.size.font24,
        fontFamily: fonts.family.primaryBold,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.secondaryRegular,
        opacity: 0.9,
    },
    clearButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        gap: 6,
    },
    clearButtonText: {
        fontSize: fonts.size.font13,
        fontFamily: fonts.family.primaryBold,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
        paddingBottom: 120,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    shopNowButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 12,
        gap: 10,
        marginTop: 24,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    shopNowText: {
        fontSize: fonts.size.font16,
        fontFamily: fonts.family.primaryBold,
    },
    itemsSection: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: fonts.size.font16,
        fontFamily: fonts.family.primaryBold,
        marginBottom: 12,
    },
    cartItem: {
        flexDirection: 'row',
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    itemImageContainer: {
        width: 60,
        height: 60,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    itemImage: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
    },
    itemDetails: {
        flex: 1,
    },
    itemName: {
        fontSize: fonts.size.font15,
        fontFamily: fonts.family.primaryBold,
        marginBottom: 2,
    },
    itemUnit: {
        fontSize: fonts.size.font12,
        fontFamily: fonts.family.secondaryRegular,
        marginBottom: 8,
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    quantityButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    quantityText: {
        fontSize: fonts.size.font15,
        fontFamily: fonts.family.primaryBold,
        minWidth: 20,
        textAlign: 'center',
    },
    itemRight: {
        alignItems: 'flex-end',
        justifyContent: 'space-between',
    },
    itemTotal: {
        fontSize: fonts.size.font16,
        fontFamily: fonts.family.primaryBold,
    },
    removeButton: {
        padding: 4,
    },
    billCard: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    billHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    billTitle: {
        fontSize: fonts.size.font16,
        fontFamily: fonts.family.primaryBold,
    },
    billRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
        alignItems: 'flex-start',
    },
    billLabelContainer: {
        flex: 1,
    },
    billLabel: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.secondaryRegular,
    },
    deliveryNote: {
        fontSize: fonts.size.font11,
        fontFamily: fonts.family.secondaryRegular,
        marginTop: 2,
    },
    billValue: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.primaryMedium,
    },
    divider: {
        height: 1,
        marginVertical: 12,
    },
    totalLabel: {
        fontSize: fonts.size.font16,
        fontFamily: fonts.family.primaryBold,
    },
    totalValue: {
        fontSize: fonts.size.font18,
        fontFamily: fonts.family.primaryBold,
    },
    savingsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 8,
        marginTop: 12,
        gap: 8,
    },
    savingsText: {
        fontSize: fonts.size.font12,
        fontFamily: fonts.family.primaryMedium,
        color: '#4CAF50',
    },
    infoCard: {
        flexDirection: 'row',
        borderRadius: 12,
        padding: 16,
        gap: 12,
    },
    infoContent: {
        flex: 1,
    },
    infoTitle: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.primaryBold,
        marginBottom: 4,
    },
    infoText: {
        fontSize: fonts.size.font12,
        fontFamily: fonts.family.secondaryRegular,
        lineHeight: 18,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderTopWidth: 1,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    footerLabel: {
        fontSize: fonts.size.font12,
        fontFamily: fonts.family.secondaryRegular,
        marginBottom: 2,
    },
    footerTotal: {
        fontSize: fonts.size.font20,
        fontFamily: fonts.family.primaryBold,
    },
    footerSubtext: {
        fontSize: fonts.size.font10,
        fontFamily: fonts.family.secondaryRegular,
        marginTop: 2,
    },
    checkoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    checkoutText: {
        fontSize: fonts.size.font15,
        fontFamily: fonts.family.primaryBold,
    },
});