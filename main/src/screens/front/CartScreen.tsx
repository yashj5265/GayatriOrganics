import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MainContainer from '../../container/MainContainer';
import { useTheme } from '../../contexts/ThemeProvider';
import fonts from '../../styles/fonts';
import AppTouchableRipple from '../../components/AppTouchableRipple';

interface Props {
    navigation: NativeStackNavigationProp<any>;
}

const CartScreen: React.FC<Props> = ({ navigation }) => {
    const colors = useTheme();

    // Dummy cart items - Replace with context/state
    const [cartItems] = useState([
        { id: 1, name: 'Fresh Spinach', price: 40, quantity: 2, image: '🥬', unit: 'bunch' },
        { id: 2, name: 'Organic Tomatoes', price: 60, quantity: 1, image: '🍅', unit: 'kg' },
        { id: 3, name: 'Farm Fresh Milk', price: 50, quantity: 3, image: '🥛', unit: 'liter' },
    ]);

    const calculateTotal = () => {
        return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    };

    const subtotal = calculateTotal();
    const deliveryCharge = 30;
    const total = subtotal + deliveryCharge;

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
                        {cartItems.length} items
                    </Text>
                </View>

                {/* Cart Items */}
                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator={false}
                >
                    {cartItems.map((item) => (
                        <View
                            key={item.id}
                            style={[
                                styles.cartItem,
                                { backgroundColor: colors.backgroundSecondary },
                            ]}
                        >
                            <Text style={styles.itemImage}>{item.image}</Text>
                            <View style={styles.itemDetails}>
                                <Text style={[styles.itemName, { color: colors.textPrimary }]}>
                                    {item.name}
                                </Text>
                                <Text style={[styles.itemUnit, { color: colors.textLabel }]}>
                                    ₹{item.price} per {item.unit}
                                </Text>
                                <View style={styles.quantityContainer}>
                                    <AppTouchableRipple
                                        style={[
                                            styles.quantityButton,
                                            { backgroundColor: colors.themePrimaryLight },
                                        ]}
                                        onPress={() => console.log('Decrease quantity')}
                                    >
                                        <Text
                                            style={[
                                                styles.quantityButtonText,
                                                { color: colors.themePrimary },
                                            ]}
                                        >
                                            -
                                        </Text>
                                    </AppTouchableRipple>
                                    <Text
                                        style={[styles.quantityText, { color: colors.textPrimary }]}
                                    >
                                        {item.quantity}
                                    </Text>
                                    <AppTouchableRipple
                                        style={[
                                            styles.quantityButton,
                                            { backgroundColor: colors.themePrimaryLight },
                                        ]}
                                        onPress={() => console.log('Increase quantity')}
                                    >
                                        <Text
                                            style={[
                                                styles.quantityButtonText,
                                                { color: colors.themePrimary },
                                            ]}
                                        >
                                            +
                                        </Text>
                                    </AppTouchableRipple>
                                </View>
                            </View>
                            <View style={styles.itemRight}>
                                <Text style={[styles.itemTotal, { color: colors.themePrimary }]}>
                                    ₹{item.price * item.quantity}
                                </Text>
                                <AppTouchableRipple
                                    onPress={() => console.log('Remove item')}
                                    style={styles.removeButton}
                                >
                                    <Text style={styles.removeIcon}>🗑️</Text>
                                </AppTouchableRipple>
                            </View>
                        </View>
                    ))}

                    {/* Bill Details */}
                    <View
                        style={[
                            styles.billCard,
                            { backgroundColor: colors.backgroundSecondary },
                        ]}
                    >
                        <Text style={[styles.billTitle, { color: colors.textPrimary }]}>
                            Bill Details
                        </Text>

                        <View style={styles.billRow}>
                            <Text style={[styles.billLabel, { color: colors.textDescription }]}>
                                Subtotal
                            </Text>
                            <Text style={[styles.billValue, { color: colors.textPrimary }]}>
                                ₹{subtotal}
                            </Text>
                        </View>

                        <View style={styles.billRow}>
                            <Text style={[styles.billLabel, { color: colors.textDescription }]}>
                                Delivery Charge
                            </Text>
                            <Text style={[styles.billValue, { color: colors.textPrimary }]}>
                                ₹{deliveryCharge}
                            </Text>
                        </View>

                        <View style={[styles.divider, { backgroundColor: colors.border }]} />

                        <View style={styles.billRow}>
                            <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>
                                Total
                            </Text>
                            <Text style={[styles.totalValue, { color: colors.themePrimary }]}>
                                ₹{total}
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
                            ₹{total}
                        </Text>
                    </View>
                    <AppTouchableRipple
                        style={[styles.checkoutButton, { backgroundColor: colors.themePrimary }]}
                        onPress={() => console.log('Proceed to checkout')}
                    >
                        <Text style={[styles.checkoutText, { color: colors.white }]}>
                            Checkout
                        </Text>
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
        paddingBottom: 30,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
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
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
        paddingBottom: 100,
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
    itemImage: {
        fontSize: 50,
        marginRight: 12,
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
    quantityButtonText: {
        fontSize: fonts.size.font16,
        fontFamily: fonts.family.primaryBold,
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
    removeIcon: {
        fontSize: 20,
    },
    billCard: {
        borderRadius: 12,
        padding: 16,
        marginTop: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    billTitle: {
        fontSize: fonts.size.font16,
        fontFamily: fonts.family.primaryBold,
        marginBottom: 12,
    },
    billRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    billLabel: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.secondaryRegular,
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
    checkoutButton: {
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 12,
    },
    checkoutText: {
        fontSize: fonts.size.font16,
        fontFamily: fonts.family.primaryBold,
    },
});