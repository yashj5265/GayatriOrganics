import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import MainContainer from '../../container/MainContainer';
import { useTheme } from '../../contexts/ThemeProvider';
import { useCart } from '../../contexts/CardContext';
import { useAddress, Address } from '../../contexts/AddressContext';
import AppTouchableRipple from '../../components/AppTouchableRipple';
import ApiManager from '../../managers/ApiManager';
import StorageManager from '../../managers/StorageManager';
import fonts from '../../styles/fonts';
import constant from '../../utilities/constant';
import { CreateOrderResponseModel, OrdersListResponseModel, OrderModel } from '../../dataModels/models';

// ============================================================================
// CONSTANTS
// ============================================================================
const DELIVERY_CHARGE = 10;

const ADDRESS_TYPES = {
    HOME: 'Home',
    WORK: 'Work',
    OTHER: 'Other',
} as const;

const ADDRESS_ICONS = {
    [ADDRESS_TYPES.HOME]: 'home',
    [ADDRESS_TYPES.WORK]: 'briefcase',
    [ADDRESS_TYPES.OTHER]: 'map-marker',
} as const;

const PAYMENT_METHODS = {
    COD: {
        id: 'cod',
        name: 'Cash on Delivery',
        description: 'Pay when you receive your order',
        icon: 'cash-multiple',
    },
} as const;

// ============================================================================
// TYPES
// ============================================================================
interface CheckoutScreenProps {
    navigation: NativeStackNavigationProp<any>;
}

interface AddressCardProps {
    address: Address;
    isSelected: boolean;
    onSelect: (address: Address) => void;
}

interface OrderSummaryProps {
    itemCount: number;
    cartTotal: number;
    deliveryCharge: number;
    total: number;
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

const formatAddress = (address: Address): string => {
    return `${address.addressLine1}, ${address.city}, ${address.state} - ${address.pincode}`;
};

const getAddressTypeIcon = (type: string): string => {
    return ADDRESS_ICONS[type as keyof typeof ADDRESS_ICONS] || ADDRESS_ICONS[ADDRESS_TYPES.OTHER];
};

const getDefaultAddress = (addresses: Address[]): Address | null => {
    return addresses.find((addr) => addr.isDefault) || addresses[0] || null;
};

// ============================================================================
// SUB COMPONENTS
// ============================================================================
const CheckoutHeader = memo(({ onBack }: { onBack: () => void }) => {
    const colors = useTheme();

    return (
        <View style={[styles.header, { backgroundColor: colors.themePrimary }]}>
            <AppTouchableRipple style={styles.backButton} onPress={onBack}>
                <Icon name="arrow-left" size={24} color={colors.white} />
            </AppTouchableRipple>
            <Text style={[styles.headerTitle, { color: colors.white }]}>
                Checkout
            </Text>
            <View style={styles.headerRight} />
        </View>
    );
});

const SectionHeader = memo(({ icon, title }: { icon: string; title: string }) => {
    const colors = useTheme();

    return (
        <View style={styles.sectionHeader}>
            <Icon name={icon} size={20} color={colors.themePrimary} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                {title}
            </Text>
        </View>
    );
});

const EmptyAddressCard = memo(({ onAddAddress }: { onAddAddress: () => void }) => {
    const colors = useTheme();

    return (
        <View style={[styles.emptyAddressCard, { backgroundColor: colors.backgroundSecondary }]}>
            <Icon name="map-marker-off" size={32} color={colors.textLabel} />
            <Text style={[styles.emptyAddressText, { color: colors.textDescription }]}>
                No address found
            </Text>
            <AppTouchableRipple
                style={[styles.addAddressButton, { backgroundColor: colors.themePrimary }]}
                onPress={onAddAddress}
            >
                <Icon name="plus" size={18} color={colors.white} />
                <Text style={[styles.addAddressButtonText, { color: colors.white }]}>
                    Add Address
                </Text>
            </AppTouchableRipple>
        </View>
    );
});

const AddressCard = memo(({ address, isSelected, onSelect }: AddressCardProps) => {
    const colors = useTheme();

    return (
        <AppTouchableRipple
            style={[
                styles.addressCard,
                {
                    backgroundColor: isSelected ? colors.themePrimaryLight : colors.backgroundSecondary,
                    borderColor: isSelected ? colors.themePrimary : colors.border,
                    borderWidth: isSelected ? 2 : 1,
                },
            ]}
            onPress={() => onSelect(address)}
        >
            {/* Header with type and selection badge */}
            <View style={styles.addressCardHeader}>
                <View style={styles.addressTypeContainer}>
                    <Icon
                        name={getAddressTypeIcon(address.addressType)}
                        size={16}
                        color={isSelected ? colors.themePrimary : colors.textLabel}
                    />
                    <Text
                        style={[
                            styles.addressType,
                            { color: isSelected ? colors.themePrimary : colors.textLabel },
                        ]}
                    >
                        {address.addressType}
                    </Text>
                    {address.isDefault && (
                        <View style={[styles.defaultBadge, { backgroundColor: colors.themePrimary }]}>
                            <Text style={[styles.defaultBadgeText, { color: colors.white }]}>
                                Default
                            </Text>
                        </View>
                    )}
                </View>
                {isSelected && (
                    <View style={[styles.selectedBadge, { backgroundColor: colors.themePrimary }]}>
                        <Icon name="check" size={14} color={colors.white} />
                    </View>
                )}
            </View>

            {/* Address text */}
            <Text
                style={[
                    styles.addressText,
                    { color: isSelected ? colors.textPrimary : colors.textDescription },
                ]}
                numberOfLines={3}
            >
                {formatAddress(address)}
            </Text>

            {/* Contact info */}
            <Text
                style={[
                    styles.addressName,
                    { color: isSelected ? colors.textPrimary : colors.textLabel },
                ]}
            >
                {address.fullName} • {address.phone}
            </Text>
        </AppTouchableRipple>
    );
});

const AddressSection = memo(({
    addresses,
    selectedAddressId,
    onSelectAddress,
    onAddAddress,
    onManageAddresses,
}: {
    addresses: Address[];
    selectedAddressId: number | null;
    onSelectAddress: (address: Address) => void;
    onAddAddress: () => void;
    onManageAddresses: () => void;
}) => {
    const colors = useTheme();
    const hasNoAddresses = addresses.length === 0;

    return (
        <View style={styles.section}>
            <SectionHeader icon="map-marker" title="Delivery Address" />

            {hasNoAddresses ? (
                <EmptyAddressCard onAddAddress={onAddAddress} />
            ) : (
                <>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.addressScrollContainer}
                    >
                        {addresses.map((address) => (
                            <AddressCard
                                key={address.id}
                                address={address}
                                isSelected={selectedAddressId === address.id}
                                onSelect={onSelectAddress}
                            />
                        ))}
                    </ScrollView>

                    <AppTouchableRipple
                        style={[styles.manageAddressButton, { backgroundColor: colors.backgroundSecondary }]}
                        onPress={onManageAddresses}
                    >
                        <Icon name="pencil" size={18} color={colors.themePrimary} />
                        <Text style={[styles.manageAddressText, { color: colors.themePrimary }]}>
                            Manage Addresses
                        </Text>
                    </AppTouchableRipple>
                </>
            )}
        </View>
    );
});

const SummaryRow = memo(({
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
        <View style={styles.summaryRow}>
            <View>
                <Text
                    style={[
                        isTotal ? styles.totalLabel : styles.summaryLabel,
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
                    isTotal ? styles.totalValue : styles.summaryValue,
                    { color: isTotal ? colors.themePrimary : colors.textPrimary },
                ]}
            >
                {value}
            </Text>
        </View>
    );
});

const OrderSummary = memo(({ itemCount, cartTotal, deliveryCharge, total }: OrderSummaryProps) => {
    const colors = useTheme();

    return (
        <View style={styles.section}>
            <SectionHeader icon="receipt" title="Order Summary" />

            <View style={[styles.summaryCard, { backgroundColor: colors.backgroundSecondary }]}>
                <SummaryRow
                    label={`Items (${itemCount})`}
                    value={formatCurrency(cartTotal)}
                />

                <SummaryRow
                    label="Delivery Charge"
                    value={deliveryCharge > 0 ? formatCurrency(deliveryCharge) : 'FREE'}
                    subtitle={deliveryCharge > 0 ? 'Standard delivery' : undefined}
                />

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <SummaryRow
                    label="Total Amount"
                    value={formatCurrency(total)}
                    isTotal
                />
            </View>
        </View>
    );
});

const PaymentMethod = memo(() => {
    const colors = useTheme();
    const method = PAYMENT_METHODS.COD;

    return (
        <View style={styles.section}>
            <SectionHeader icon="cash" title="Payment Method" />

            <View style={[styles.paymentCard, { backgroundColor: colors.backgroundSecondary }]}>
                <View style={styles.paymentMethod}>
                    <Icon name={method.icon} size={24} color={colors.themePrimary} />
                    <View style={styles.paymentInfo}>
                        <Text style={[styles.paymentMethodName, { color: colors.textPrimary }]}>
                            {method.name}
                        </Text>
                        <Text style={[styles.paymentMethodDesc, { color: colors.textDescription }]}>
                            {method.description}
                        </Text>
                    </View>
                    <View style={[styles.selectedPaymentBadge, { backgroundColor: colors.themePrimary }]}>
                        <Icon name="check" size={16} color={colors.white} />
                    </View>
                </View>
            </View>
        </View>
    );
});

const CheckoutFooter = memo(({
    total,
    loading,
    disabled,
    onPlaceOrder,
}: {
    total: number;
    loading: boolean;
    disabled: boolean;
    onPlaceOrder: () => void;
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
            </View>

            <AppTouchableRipple
                style={[
                    styles.placeOrderButton,
                    {
                        backgroundColor: disabled ? colors.buttonDisabled : colors.themePrimary,
                    },
                ]}
                onPress={onPlaceOrder}
                disabled={disabled}
            >
                {loading ? (
                    <ActivityIndicator color={colors.white} />
                ) : (
                    <>
                        <Text style={[styles.placeOrderText, { color: colors.white }]}>
                            Place Order
                        </Text>
                        <Icon name="arrow-right" size={20} color={colors.white} />
                    </>
                )}
            </AppTouchableRipple>
        </View>
    );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const CheckoutScreen: React.FC<CheckoutScreenProps> = ({ navigation }) => {
    const colors = useTheme();
    const { cartItems, cartTotal, clearCart } = useCart();
    const { addresses, selectedAddress, selectAddress } = useAddress();

    // ============================================================================
    // STATE
    // ============================================================================
    const [loading, setLoading] = useState<boolean>(false);
    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);

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

    const isPlaceOrderDisabled = useMemo(
        () => loading || !selectedAddressId,
        [loading, selectedAddressId]
    );

    const selectedAddressData = useMemo(
        () => addresses.find((a) => a.id === selectedAddressId),
        [addresses, selectedAddressId]
    );

    // ============================================================================
    // EFFECTS
    // ============================================================================
    useEffect(() => {
        if (selectedAddress) {
            setSelectedAddressId(selectedAddress.id);
        } else if (addresses.length > 0) {
            const defaultAddress = getDefaultAddress(addresses);
            if (defaultAddress) {
                setSelectedAddressId(defaultAddress.id);
            }
        }
    }, [selectedAddress, addresses]);

    // ============================================================================
    // HANDLERS
    // ============================================================================
    const handleSelectAddress = useCallback(
        (address: Address) => {
            setSelectedAddressId(address.id);
            selectAddress(address.id);
        },
        [selectAddress]
    );

    const handleAddAddress = useCallback(() => {
        navigation.navigate(constant.routeName.addEditAddress, { mode: 'add' });
    }, [navigation]);

    const handleManageAddresses = useCallback(() => {
        navigation.navigate(constant.routeName.addressList);
    }, [navigation]);

    const handlePlaceOrder = useCallback(async () => {
        // Validation
        if (!selectedAddressId) {
            Alert.alert('Address Required', 'Please select a delivery address to continue.');
            return;
        }

        if (cartItems.length === 0) {
            Alert.alert('Empty Cart', 'Your cart is empty. Please add items before placing an order.');
            return;
        }

        // Confirmation dialog
        Alert.alert(
            'Confirm Order',
            `Place order for ${formatCurrency(total)}?\n\nDelivery Address:\n${selectedAddressData?.addressLine1 || ''
            }`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Place Order',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            const token = await StorageManager.getItem(constant.shareInstanceKey.authToken);

                            const response = await ApiManager.post<CreateOrderResponseModel>({
                                endpoint: constant.apiEndPoints.createOrder,
                                params: {
                                    address_id: selectedAddressId,
                                },
                                token: token || undefined,
                                showError: true,
                                showSuccess: true,
                            });

                            console.log('handlePlaceOrder response', response);

                            // ApiManager returns the raw JSON response cast as ApiResponse<T>
                            // The actual API response structure matches CreateOrderResponseModel
                            // So response itself has success, message, and data properties
                            const orderResponse = response as any as CreateOrderResponseModel;

                            if (orderResponse?.success && orderResponse?.data) {
                                // Clear cart after successful order
                                await clearCart();

                                // Get order ID if available in response
                                let orderId = orderResponse.data.id;
                                const orderCode = orderResponse.data.order_code;

                                // If order ID is not in response, fetch orders list to find it
                                if (!orderId) {
                                    try {
                                        const ordersResponse = await ApiManager.get<OrdersListResponseModel>({
                                            endpoint: constant.apiEndPoints.myOrders,
                                            token: token || undefined,
                                            showError: false,
                                        });

                                        // Find the order by order_code
                                        const orders = ordersResponse?.data || (ordersResponse as any)?.data?.data || [];
                                        const foundOrder = Array.isArray(orders)
                                            ? orders.find((order: OrderModel) => order.order_code === orderCode)
                                            : null;

                                        if (foundOrder) {
                                            orderId = foundOrder.id;
                                        }
                                    } catch (error) {
                                        console.error('❌ Error fetching orders:', error);
                                        // Continue without orderId, will navigate to orders list
                                    }
                                }

                                Alert.alert(
                                    'Order Placed Successfully!',
                                    `Your order ${orderCode} has been placed and will be delivered on ${orderResponse.data.delivery_date}.`,
                                    [
                                        {
                                            text: 'OK',
                                            onPress: () => {
                                                if (orderId) {
                                                    // Navigate directly to the order detail screen
                                                    navigation.navigate(constant.routeName.orderDetail, {
                                                        orderId: orderId,
                                                    });
                                                } else {
                                                    // Fallback: navigate to orders list
                                                    navigation.navigate(constant.routeName.mainTabs, {
                                                        screen: constant.routeName.orders,
                                                    });
                                                }
                                            },
                                        },
                                    ]
                                );
                            } else {
                                console.error('❌ Invalid order response structure:', orderResponse);
                                Alert.alert('Error', 'Failed to place order. Please try again.');
                            }
                        } catch (error: any) {
                            console.error('❌ Place Order Error:', error);
                            Alert.alert(
                                'Error',
                                error?.message || 'Failed to place order. Please try again.'
                            );
                        } finally {
                            setLoading(false);
                        }
                    },
                },
            ]
        );
    }, [selectedAddressId, cartItems.length, total, selectedAddressData, clearCart, navigation]);

    // ============================================================================
    // RENDER
    // ============================================================================
    return (
        <MainContainer
            statusBarColor={colors.themePrimary}
            statusBarStyle="light-content"
            isInternetRequired={true}
            showLoader={loading}
        >
            <View style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}>
                {/* Header */}
                <CheckoutHeader onBack={() => navigation.goBack()} />

                {/* Content */}
                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Delivery Address */}
                    <AddressSection
                        addresses={addresses}
                        selectedAddressId={selectedAddressId}
                        onSelectAddress={handleSelectAddress}
                        onAddAddress={handleAddAddress}
                        onManageAddresses={handleManageAddresses}
                    />

                    {/* Order Summary */}
                    <OrderSummary
                        itemCount={cartItems.length}
                        cartTotal={cartTotal}
                        deliveryCharge={deliveryCharge}
                        total={total}
                    />

                    {/* Payment Method */}
                    <PaymentMethod />
                </ScrollView>

                {/* Footer with Place Order Button */}
                <CheckoutFooter
                    total={total}
                    loading={loading}
                    disabled={isPlaceOrderDisabled}
                    onPlaceOrder={handlePlaceOrder}
                />
            </View>
        </MainContainer>
    );
};

export default memo(CheckoutScreen);

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    backButton: {
        padding: 8,
        marginRight: 12,
    },
    headerTitle: {
        fontSize: fonts.size.font20,
        fontFamily: fonts.family.primaryBold,
        flex: 1,
    },
    headerRight: {
        width: 40,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
        paddingBottom: 100,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: fonts.size.font16,
        fontFamily: fonts.family.primaryBold,
    },
    emptyAddressCard: {
        padding: 24,
        borderRadius: 12,
        alignItems: 'center',
    },
    emptyAddressText: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.secondaryRegular,
        marginTop: 12,
        marginBottom: 16,
    },
    addAddressButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        gap: 6,
    },
    addAddressButtonText: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.primaryBold,
    },
    addressScrollContainer: {
        paddingRight: 20,
    },
    addressCard: {
        width: 280,
        padding: 16,
        borderRadius: 12,
        marginRight: 12,
    },
    addressCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    addressTypeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    addressType: {
        fontSize: fonts.size.font12,
        fontFamily: fonts.family.primaryBold,
    },
    defaultBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginLeft: 6,
    },
    defaultBadgeText: {
        fontSize: fonts.size.font9,
        fontFamily: fonts.family.primaryBold,
    },
    selectedBadge: {
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addressText: {
        fontSize: fonts.size.font13,
        fontFamily: fonts.family.secondaryRegular,
        marginBottom: 4,
        lineHeight: 18,
    },
    addressName: {
        fontSize: fonts.size.font12,
        fontFamily: fonts.family.secondaryRegular,
        marginTop: 4,
    },
    manageAddressButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 12,
        gap: 8,
    },
    manageAddressText: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.primaryMedium,
    },
    summaryCard: {
        borderRadius: 12,
        padding: 16,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    summaryLabel: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.secondaryRegular,
    },
    deliveryNote: {
        fontSize: fonts.size.font11,
        fontFamily: fonts.family.secondaryRegular,
        marginTop: 2,
    },
    summaryValue: {
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
    paymentCard: {
        borderRadius: 12,
        padding: 16,
    },
    paymentMethod: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    paymentInfo: {
        flex: 1,
    },
    paymentMethodName: {
        fontSize: fonts.size.font15,
        fontFamily: fonts.family.primaryBold,
        marginBottom: 2,
    },
    paymentMethodDesc: {
        fontSize: fonts.size.font12,
        fontFamily: fonts.family.secondaryRegular,
    },
    selectedPaymentBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
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
    placeOrderButton: {
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
    placeOrderText: {
        fontSize: fonts.size.font15,
        fontFamily: fonts.family.primaryBold,
    },
});