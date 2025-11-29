import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MainContainer from '../../container/MainContainer';
import { useTheme } from '../../contexts/ThemeProvider';
import fonts from '../../styles/fonts';
import AppTouchableRipple from '../../components/AppTouchableRipple';
import { useCart } from '../../contexts/CardContext';
import EmptyData, { EmptyDataType } from '../../components/EmptyData';
import constant from '../../utilities/constant';

interface CartScreenProps {
    navigation: NativeStackNavigationProp<any>;
}

const DELIVERY_CHARGE = 30;

const CartScreen: React.FC<CartScreenProps> = ({ navigation }) => {
    const colors = useTheme();
    const { cartItems, cartCount, cartTotal, updateQuantity, removeFromCart, clearCart } = useCart();
    const [processingItemId, setProcessingItemId] = useState<number | null>(null);

    const deliveryCharge = cartItems.length > 0 ? DELIVERY_CHARGE : 0;
    const total = cartTotal + deliveryCharge;

    const handleQuantityChange = useCallback((itemId: number, currentQuantity: number, change: number) => {
        const newQuantity = currentQuantity + change;

        if (newQuantity <= 0) {
            handleRemoveItem(itemId);
            return;
        }

        setProcessingItemId(itemId);
        updateQuantity(itemId, newQuantity);
        setTimeout(() => setProcessingItemId(null), 300);
    }, [updateQuantity]);

    const handleRemoveItem = useCallback((itemId: number) => {
        const item = cartItems.find(i => i.id === itemId);

        Alert.alert(
            'Remove Item',
            `Are you sure you want to remove ${item?.name} from your cart?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => removeFromCart(itemId)
                }
            ]
        );
    }, [cartItems, removeFromCart]);

    const handleClearCart = useCallback(() => {
        Alert.alert(
            'Clear Cart',
            'Are you sure you want to remove all items from your cart?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear All',
                    style: 'destructive',
                    onPress: clearCart
                }
            ]
        );
    }, [clearCart]);

    const handleCheckout = useCallback(() => {
        if (cartItems.length === 0) {
            Alert.alert('Empty Cart', 'Please add items to your cart before checkout');
            return;
        }

        // TODO: Navigate to checkout screen when implemented
        Alert.alert(
            'Checkout',
            'Checkout functionality will be implemented soon',
            [{ text: 'OK' }]
        );
    }, [cartItems.length]);

    // Empty Cart State
    if (cartItems.length === 0) {
        return (
            <MainContainer
                statusBarColor={colors.themePrimary}
                statusBarStyle="light-content"
                isInternetRequired={false}
            >
                <View style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}>
                    {/* Header */}
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
                            onPress={() => navigation.navigate(constant.routeName.mainTabs, { screen: constant.routeName.home })}
                        >
                            <Icon name="shopping" size={20} color={colors.white} />
                            <Text style={[styles.shopNowText, { color: colors.white }]}>
                                Start Shopping
                            </Text>
                        </AppTouchableRipple>
                    </View>
                </View>
            </MainContainer>
        );
    }

    return (
        <MainContainer
            statusBarColor={colors.themePrimary}
            statusBarStyle="light-content"
            isInternetRequired={false}
        >
            <View style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: colors.themePrimary }]}>
                    <View style={styles.headerContent}>
                        <View>
                            <Text style={[styles.headerTitle, { color: colors.white }]}>
                                My Cart
                            </Text>
                            <Text style={[styles.headerSubtitle, { color: colors.white }]}>
                                {cartCount} {cartCount === 1 ? 'item' : 'items'}
                            </Text>
                        </View>

                        {cartItems.length > 0 && (
                            <AppTouchableRipple
                                style={[styles.clearButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
                                onPress={handleClearCart}
                            >
                                <Icon name="delete-outline" size={20} color={colors.white} />
                                <Text style={[styles.clearButtonText, { color: colors.white }]}>
                                    Clear
                                </Text>
                            </AppTouchableRipple>
                        )}
                    </View>
                </View>

                {/* Cart Items */}
                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Cart Items List */}
                    <View style={styles.itemsSection}>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                            Cart Items ({cartItems.length})
                        </Text>

                        {cartItems.map((item) => {
                            const itemTotal = item.price * item.quantity;
                            const isProcessing = processingItemId === item.id;

                            return (
                                <View
                                    key={item.id}
                                    style={[
                                        styles.cartItem,
                                        {
                                            backgroundColor: colors.backgroundSecondary,
                                            opacity: isProcessing ? 0.7 : 1
                                        },
                                    ]}
                                >
                                    {/* Item Image/Icon */}
                                    <View style={[styles.itemImageContainer, { backgroundColor: colors.themePrimaryLight }]}>
                                        <Text style={styles.itemImage}>{item.image}</Text>
                                    </View>

                                    {/* Item Details */}
                                    <View style={styles.itemDetails}>
                                        <Text style={[styles.itemName, { color: colors.textPrimary }]}>
                                            {item.name}
                                        </Text>
                                        <Text style={[styles.itemUnit, { color: colors.textLabel }]}>
                                            ₹{item.price} per {item.unit}
                                        </Text>

                                        {/* Quantity Controls */}
                                        <View style={styles.quantityContainer}>
                                            <AppTouchableRipple
                                                style={[
                                                    styles.quantityButton,
                                                    {
                                                        backgroundColor: colors.themePrimaryLight,
                                                        opacity: isProcessing ? 0.5 : 1
                                                    },
                                                ]}
                                                onPress={() => handleQuantityChange(item.id, item.quantity, -1)}
                                                disabled={isProcessing}
                                            >
                                                <Icon
                                                    name="minus"
                                                    size={16}
                                                    color={colors.themePrimary}
                                                />
                                            </AppTouchableRipple>

                                            <Text
                                                style={[styles.quantityText, { color: colors.textPrimary }]}
                                            >
                                                {item.quantity}
                                            </Text>

                                            <AppTouchableRipple
                                                style={[
                                                    styles.quantityButton,
                                                    {
                                                        backgroundColor: colors.themePrimaryLight,
                                                        opacity: isProcessing ? 0.5 : 1
                                                    },
                                                ]}
                                                onPress={() => handleQuantityChange(item.id, item.quantity, 1)}
                                                disabled={isProcessing}
                                            >
                                                <Icon
                                                    name="plus"
                                                    size={16}
                                                    color={colors.themePrimary}
                                                />
                                            </AppTouchableRipple>
                                        </View>
                                    </View>

                                    {/* Item Right - Price & Remove */}
                                    <View style={styles.itemRight}>
                                        <Text style={[styles.itemTotal, { color: colors.themePrimary }]}>
                                            ₹{itemTotal}
                                        </Text>
                                        <AppTouchableRipple
                                            onPress={() => handleRemoveItem(item.id)}
                                            style={styles.removeButton}
                                        >
                                            <Icon name="delete-outline" size={22} color="#FF5252" />
                                        </AppTouchableRipple>
                                    </View>
                                </View>
                            );
                        })}
                    </View>

                    {/* Bill Details */}
                    <View
                        style={[
                            styles.billCard,
                            { backgroundColor: colors.backgroundSecondary },
                        ]}
                    >
                        <View style={styles.billHeader}>
                            <Icon name="receipt" size={20} color={colors.themePrimary} />
                            <Text style={[styles.billTitle, { color: colors.textPrimary }]}>
                                Bill Details
                            </Text>
                        </View>

                        <View style={styles.billRow}>
                            <Text style={[styles.billLabel, { color: colors.textDescription }]}>
                                Item Total ({cartCount} {cartCount === 1 ? 'item' : 'items'})
                            </Text>
                            <Text style={[styles.billValue, { color: colors.textPrimary }]}>
                                ₹{cartTotal.toFixed(2)}
                            </Text>
                        </View>

                        <View style={styles.billRow}>
                            <View style={styles.billLabelContainer}>
                                <Text style={[styles.billLabel, { color: colors.textDescription }]}>
                                    Delivery Charge
                                </Text>
                                {deliveryCharge > 0 && (
                                    <Text style={[styles.deliveryNote, { color: colors.textLabel }]}>
                                        Standard delivery
                                    </Text>
                                )}
                            </View>
                            <Text style={[styles.billValue, { color: colors.textPrimary }]}>
                                {deliveryCharge > 0 ? `₹${deliveryCharge}` : 'FREE'}
                            </Text>
                        </View>

                        <View style={[styles.divider, { backgroundColor: colors.border }]} />

                        <View style={styles.billRow}>
                            <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>
                                To Pay
                            </Text>
                            <Text style={[styles.totalValue, { color: colors.themePrimary }]}>
                                ₹{total.toFixed(2)}
                            </Text>
                        </View>

                        {/* Savings Badge */}
                        <View style={[styles.savingsBadge, { backgroundColor: '#E8F5E9' }]}>
                            <Icon name="tag" size={16} color="#4CAF50" />
                            <Text style={styles.savingsText}>
                                You're saving ₹0 on this order
                            </Text>
                        </View>
                    </View>

                    {/* Delivery Info */}
                    <View style={[styles.infoCard, { backgroundColor: colors.backgroundSecondary }]}>
                        <Icon name="information" size={20} color={colors.themePrimary} />
                        <View style={styles.infoContent}>
                            <Text style={[styles.infoTitle, { color: colors.textPrimary }]}>
                                Delivery Information
                            </Text>
                            <Text style={[styles.infoText, { color: colors.textDescription }]}>
                                Your order will be delivered within 24-48 hours. Free delivery on orders above ₹500.
                            </Text>
                        </View>
                    </View>
                </ScrollView>

                {/* Checkout Button */}
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
                            ₹{total.toFixed(2)}
                        </Text>
                        <Text style={[styles.footerSubtext, { color: colors.textLabel }]}>
                            Including all taxes
                        </Text>
                    </View>
                    <AppTouchableRipple
                        style={[styles.checkoutButton, { backgroundColor: colors.themePrimary }]}
                        onPress={handleCheckout}
                    >
                        <Text style={[styles.checkoutText, { color: colors.white }]}>
                            Proceed to Checkout
                        </Text>
                        <Icon name="arrow-right" size={20} color={colors.white} />
                    </AppTouchableRipple>
                </View>
            </View>
        </MainContainer>
    );
};

export default CartScreen;

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
        fontSize: 32,
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