import React, { useState, useCallback, useEffect, memo } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import MainContainer from '../../container/MainContainer';
import { useTheme } from '../../contexts/ThemeProvider';
import AppTouchableRipple from '../../components/AppTouchableRipple';
import ApiManager from '../../managers/ApiManager';
import StorageManager from '../../managers/StorageManager';
import fonts from '../../styles/fonts';
import constant from '../../utilities/constant';
import { OrderModel } from '../../dataModels/models';

// ============================================================================
// CONSTANTS
// ============================================================================
const ORDER_STATUS = {
    PENDING: ['pending', 'new'],
    CONFIRMED: ['confirmed', 'accepted'],
    PACKED: ['packed', 'ready'],
    ASSIGNED: ['assigned'],
    PICKED: ['picked', 'picked_up'],
    DELIVERING: ['delivering', 'out_for_delivery'],
    DELIVERED: ['delivered', 'completed'],
    CANCELLED: ['cancelled', 'rejected'],
} as const;

const STATUS_CONFIG = {
    pending: { label: 'Pending', color: '#ff9800', icon: 'clock-outline' },
    confirmed: { label: 'Confirmed', color: '#2196f3', icon: 'check-circle-outline' },
    packed: { label: 'Packed', color: '#9c27b0', icon: 'package-variant' },
    assigned: { label: 'Assigned', color: '#ff5722', icon: 'account-check' },
    picked: { label: 'Picked Up', color: '#00bcd4', icon: 'truck-delivery' },
    delivering: { label: 'Out for Delivery', color: '#673ab7', icon: 'truck' },
    delivered: { label: 'Delivered', color: '#4caf50', icon: 'check-circle' },
    cancelled: { label: 'Cancelled', color: '#f44336', icon: 'close-circle' },
} as const;

// ============================================================================
// TYPES
// ============================================================================
interface OrderDetailScreenProps {
    navigation: NativeStackNavigationProp<any>;
    route: RouteProp<any, any>;
}

interface OrderItem {
    product?: {
        name?: string;
        image1?: string;
    };
    name?: string;
    quantity?: number;
    price?: number | string;
    unit_type?: string;
}

interface Order {
    id: number;
    order_code?: string;
    order_number?: string;
    status: string;
    total_amount?: number | string;
    amount?: number | string;
    subtotal?: number | string;
    delivery_charge?: number | string;
    items?: OrderItem[];
    items_count?: number;
    created_at?: string;
    delivery_date?: string;
    confirmation_code?: string;
    eta?: string;
    delivery_person_name?: string;
    delivery_person_phone?: string;
    address?: any;
    full_address?: string;
    payment_mode?: string;
    customer_name?: string;
    customer_phone?: string;
}

interface StatusInfo {
    label: string;
    color: string;
    icon: string;
}

interface InfoCardProps {
    icon: string;
    title: string;
    children: React.ReactNode;
}

interface InfoRowProps {
    label: string;
    value: string | number;
    isAmount?: boolean;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
const getStatusInfo = (status: string, fallbackColor: string): StatusInfo => {
    const statusLower = status?.toLowerCase() || '';

    // Check each status category
    for (const [key, statusList] of Object.entries(ORDER_STATUS)) {
        if (statusList.includes(statusLower as any)) {
            const configKey = key.toLowerCase() as keyof typeof STATUS_CONFIG;
            return STATUS_CONFIG[configKey] || { label: status, color: fallbackColor, icon: 'help-circle' };
        }
    }

    return { label: status || 'Unknown', color: fallbackColor, icon: 'help-circle' };
};

const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';

    try {
        const date = new Date(dateString);
        return date.toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return dateString;
    }
};

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

const getOrderNumber = (order: Order): string => {
    return order.order_code || order.order_number || `ORD${order.id}`;
};

const getOrderAmount = (order: Order): number | undefined => {
    if (order.total_amount !== undefined && order.total_amount !== null) {
        const amount = typeof order.total_amount === 'string' 
            ? parseFloat(order.total_amount) 
            : order.total_amount;
        return isNaN(amount) ? undefined : amount;
    }
    if (order.amount !== undefined && order.amount !== null) {
        const amount = typeof order.amount === 'string' 
            ? parseFloat(order.amount) 
            : order.amount;
        return isNaN(amount) ? undefined : amount;
    }
    return undefined;
};

const calculateItemTotal = (item: OrderItem): number => {
    const quantity = item.quantity || 1;
    const price = typeof item.price === 'string' ? parseFloat(item.price) : (item.price || 0);
    return quantity * price;
};

const getItemName = (item: OrderItem): string => {
    return item.product?.name || item.name || 'Item';
};

/**
 * Formats address object to string
 */
const formatAddressString = (address: any): string => {
    if (!address) return '';
    if (typeof address === 'string') return address;
    
    const parts: string[] = [];
    if (address.address) parts.push(address.address);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.pincode) parts.push(address.pincode);
    
    return parts.join(', ');
};

/**
 * Maps OrderModel to Order interface for UI components
 */
const mapOrderModelToOrder = (orderModel: OrderModel): Order => ({
    id: orderModel.id,
    order_code: orderModel.order_code,
    status: orderModel.status,
    total_amount: orderModel.total_amount,
    subtotal: orderModel.subtotal,
    delivery_charge: orderModel.delivery_charge,
    created_at: orderModel.created_at,
    delivery_date: orderModel.delivery_date,
    items_count: orderModel.items?.length || 0,
    items: orderModel.items?.map(item => ({
        product: {
            name: item.product?.name,
            image1: item.product?.image1,
        },
        name: item.product?.name,
        quantity: item.quantity,
        price: item.price,
        unit_type: item.unit_type,
    })),
    address: orderModel.address,
    customer_name: orderModel.address?.full_name,
    customer_phone: orderModel.address?.phone,
});

/**
 * Extracts and transforms order data from API response
 */
const extractOrderData = (response: any): Order | null => {
    // Handle wrapped response from ApiManager
    const orderModel: OrderModel | undefined = response?.data && response.data.id
        ? (response.data as OrderModel)
        : (response?.id ? response as OrderModel : undefined);

    if (orderModel) {
        return mapOrderModelToOrder(orderModel);
    }

    // Fallback for other response formats
    if (response?.order && response.order.id) {
        return mapOrderModelToOrder(response.order as OrderModel);
    }
    if (response && typeof response === 'object' && 'id' in response && 'order_code' in response) {
        return mapOrderModelToOrder(response as OrderModel);
    }
    return null;
};

// ============================================================================
// SUB COMPONENTS
// ============================================================================
const OrderDetailHeader = memo(({ onBack }: { onBack: () => void }) => {
    const colors = useTheme();

    return (
        <View style={[styles.header, { backgroundColor: colors.themePrimary }]}>
            <AppTouchableRipple style={styles.backButton} onPress={onBack}>
                <Icon name="arrow-left" size={24} color={colors.white} />
            </AppTouchableRipple>
            <Text style={[styles.headerTitle, { color: colors.white }]}>
                Order Details
            </Text>
            <View style={styles.headerRight} />
        </View>
    );
});

const CardDivider = memo(() => {
    const colors = useTheme();
    return <View style={[styles.divider, { backgroundColor: colors.border }]} />;
});

const InfoCard = memo(({ icon, title, children }: InfoCardProps) => {
    const colors = useTheme();

    return (
        <View style={[styles.card, { backgroundColor: colors.backgroundSecondary }]}>
            <View style={styles.cardHeader}>
                <Icon name={icon} size={20} color={colors.themePrimary} />
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                    {title}
                </Text>
            </View>
            <CardDivider />
            {children}
        </View>
    );
});

const InfoRow = memo(({ label, value, isAmount = false }: InfoRowProps) => {
    const colors = useTheme();

    return (
        <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textLabel }]}>
                {label}
            </Text>
            <Text
                style={[
                    isAmount ? styles.amountValue : styles.infoValue,
                    { color: isAmount ? colors.themePrimary : colors.textPrimary },
                ]}
            >
                {value}
            </Text>
        </View>
    );
});

const StatusBadge = memo(({ statusInfo }: { statusInfo: StatusInfo }) => {
    return (
        <View
            style={[
                styles.statusBadge,
                { backgroundColor: statusInfo.color + '20' },
            ]}
        >
            <Icon
                name={statusInfo.icon}
                size={18}
                color={statusInfo.color}
                style={styles.statusIcon}
            />
            <Text
                style={[
                    styles.statusText,
                    { color: statusInfo.color },
                ]}
            >
                {statusInfo.label}
            </Text>
        </View>
    );
});

const OrderInfoCard = memo(({ order, statusInfo }: { order: Order; statusInfo: StatusInfo }) => {
    const colors = useTheme();
    const orderNumber = getOrderNumber(order);
    const amount = getOrderAmount(order);

    return (
        <View style={[styles.card, { backgroundColor: colors.backgroundSecondary }]}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={[styles.orderNumber, { color: colors.textPrimary }]}>
                        {orderNumber}
                    </Text>
                    <Text style={[styles.orderDate, { color: colors.textLabel }]}>
                        {formatDate(order.created_at)}
                    </Text>
                </View>
                <StatusBadge statusInfo={statusInfo} />
            </View>

            <CardDivider />

            <View style={styles.infoSection}>
                <InfoRow
                    label="Items:"
                    value={order.items_count || order.items?.length || 0}
                />
                <InfoRow
                    label="Total Amount:"
                    value={formatCurrency(amount)}
                    isAmount
                />
                {order.payment_mode && (
                    <InfoRow
                        label="Payment:"
                        value={order.payment_mode}
                    />
                )}
            </View>
        </View>
    );
});

const ConfirmationCodeCard = memo(({ code }: { code: string }) => {
    const colors = useTheme();

    return (
        <InfoCard icon="key" title="Confirmation Code">
            <View style={styles.confirmationCodeContainer}>
                <Text style={[styles.confirmationCode, { color: colors.themePrimary }]}>
                    {code}
                </Text>
                <Text style={[styles.confirmationCodeHint, { color: colors.textDescription }]}>
                    Share this code with the delivery person to confirm delivery
                </Text>
            </View>
        </InfoCard>
    );
});

const ETACard = memo(({ eta }: { eta: string }) => {
    const colors = useTheme();

    return (
        <InfoCard icon="clock-fast" title="Estimated Delivery Time">
            <Text style={[styles.etaValue, { color: colors.themePrimary }]}>
                {eta}
            </Text>
        </InfoCard>
    );
});

const DeliveryPersonCard = memo(({ name, phone }: { name: string; phone?: string }) => {
    const colors = useTheme();

    return (
        <InfoCard icon="account-circle" title="Delivery Person">
            <View style={styles.infoSection}>
                <Text style={[styles.infoValue, { color: colors.textPrimary, marginBottom: 4 }]}>
                    {name}
                </Text>
                {phone && (
                    <Text style={[styles.infoLabel, { color: colors.textLabel }]}>
                        {phone}
                    </Text>
                )}
            </View>
        </InfoCard>
    );
});

const AddressCard = memo(({ address }: { address: string }) => {
    const colors = useTheme();

    return (
        <InfoCard icon="map-marker" title="Delivery Address">
            <Text style={[styles.addressText, { color: colors.textDescription }]}>
                {address}
            </Text>
        </InfoCard>
    );
});

const OrderItemRow = memo(({ item, index }: { item: OrderItem; index: number }) => {
    const colors = useTheme();

    return (
        <View key={index} style={styles.itemRow}>
            <View style={styles.itemInfo}>
                <Text style={[styles.itemName, { color: colors.textPrimary }]}>
                    {getItemName(item)}
                </Text>
                <Text style={[styles.itemDetails, { color: colors.textLabel }]}>
                    Qty: {item.quantity || 1} × ₹{item.price || 0}
                </Text>
            </View>
            <Text style={[styles.itemTotal, { color: colors.textPrimary }]}>
                {formatCurrency(calculateItemTotal(item))}
            </Text>
        </View>
    );
});

const OrderItemsCard = memo(({ items }: { items: OrderItem[] }) => {
    return (
        <InfoCard icon="format-list-bulleted" title="Order Items">
            {items.map((item, index) => (
                <OrderItemRow key={index} item={item} index={index} />
            ))}
        </InfoCard>
    );
});

const LoadingState = memo(() => {
    const colors = useTheme();

    return (
        <MainContainer
            statusBarColor={colors.themePrimary}
            statusBarStyle="light-content"
            showLoader={true}
        >
            <View />
        </MainContainer>
    );
});

const ErrorState = memo(({ message }: { message: string }) => {
    const colors = useTheme();

    return (
        <MainContainer
            statusBarColor={colors.themePrimary}
            statusBarStyle="light-content"
        >
            <View style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}>
                <Text style={[styles.errorText, { color: colors.textPrimary }]}>
                    {message}
                </Text>
            </View>
        </MainContainer>
    );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const OrderDetailScreen: React.FC<OrderDetailScreenProps> = ({ navigation, route }) => {
    const colors = useTheme();
    const { orderId } = route.params || {};

    // ============================================================================
    // STATE
    // ============================================================================
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    // ============================================================================
    // API HANDLERS
    // ============================================================================
    const fetchOrderDetails = useCallback(async () => {
        if (!orderId) {
            Alert.alert('Error', 'Order ID is missing');
            navigation.goBack();
            return;
        }

        setLoading(true);
        try {
            const token = await StorageManager.getItem(constant.shareInstanceKey.authToken);

            const response = await ApiManager.get<OrderModel>({
                endpoint: `${constant.apiEndPoints.getOrder}${orderId}`,
                token: token || undefined,
                showError: true,
            });

            const orderData = extractOrderData(response);

            if (orderData) {
                setOrder(orderData);
            } else {
                Alert.alert('Error', 'Order not found');
                navigation.goBack();
            }
        } catch (error: any) {
            console.error('❌ Fetch Order Detail Error:', error);
            Alert.alert('Error', 'Failed to load order details');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    }, [orderId, navigation]);

    // ============================================================================
    // EFFECTS
    // ============================================================================
    useEffect(() => {
        fetchOrderDetails();
    }, [fetchOrderDetails]);

    // ============================================================================
    // COMPUTED VALUES
    // ============================================================================
    const statusInfo = order ? getStatusInfo(order.status, colors.textLabel) : null;

    // ============================================================================
    // HANDLERS
    // ============================================================================
    const handleGoBack = useCallback(() => {
        navigation.goBack();
    }, [navigation]);

    // ============================================================================
    // RENDER - LOADING STATE
    // ============================================================================
    if (loading) {
        return <LoadingState />;
    }

    // ============================================================================
    // RENDER - ERROR STATE
    // ============================================================================
    if (!order) {
        return <ErrorState message="Order not found" />;
    }

    // ============================================================================
    // RENDER - ORDER DETAILS
    // ============================================================================
    return (
        <MainContainer
            statusBarColor={colors.themePrimary}
            statusBarStyle="light-content"
            isInternetRequired={true}
        >
            <View style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}>
                {/* Header */}
                <OrderDetailHeader onBack={handleGoBack} />

                {/* Content */}
                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Order Info Card */}
                    {statusInfo && (
                        <OrderInfoCard order={order} statusInfo={statusInfo} />
                    )}

                    {/* Confirmation Code Card */}
                    {order.confirmation_code && (
                        <ConfirmationCodeCard code={order.confirmation_code} />
                    )}

                    {/* ETA Card */}
                    {order.eta && <ETACard eta={order.eta} />}

                    {/* Delivery Person Card */}
                    {order.delivery_person_name && (
                        <DeliveryPersonCard
                            name={order.delivery_person_name}
                            phone={order.delivery_person_phone}
                        />
                    )}

                    {/* Address Card */}
                    {(order.address || order.full_address) && (
                        <AddressCard address={
                            order.full_address || formatAddressString(order.address)
                        } />
                    )}

                    {/* Order Items Card */}
                    {order.items && order.items.length > 0 && (
                        <OrderItemsCard items={order.items} />
                    )}
                </ScrollView>
            </View>
        </MainContainer>
    );
};

export default memo(OrderDetailScreen);

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
        paddingBottom: 40,
    },
    card: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: fonts.size.font16,
        fontFamily: fonts.family.primaryBold,
    },
    divider: {
        height: 1,
        marginBottom: 12,
    },
    orderNumber: {
        fontSize: fonts.size.font18,
        fontFamily: fonts.family.primaryBold,
        marginBottom: 4,
    },
    orderDate: {
        fontSize: fonts.size.font12,
        fontFamily: fonts.family.secondaryRegular,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    statusIcon: {
        marginRight: 2,
    },
    statusText: {
        fontSize: fonts.size.font12,
        fontFamily: fonts.family.primaryBold,
    },
    infoSection: {
        gap: 12,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    infoLabel: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.secondaryRegular,
    },
    infoValue: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.primaryMedium,
    },
    amountValue: {
        fontSize: fonts.size.font18,
        fontFamily: fonts.family.primaryBold,
    },
    confirmationCodeContainer: {
        alignItems: 'center',
        paddingVertical: 8,
    },
    confirmationCode: {
        fontSize: fonts.size.font32,
        fontFamily: fonts.family.primaryBold,
        letterSpacing: 8,
        marginBottom: 8,
    },
    confirmationCodeHint: {
        fontSize: fonts.size.font12,
        fontFamily: fonts.family.secondaryRegular,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    etaValue: {
        fontSize: fonts.size.font18,
        fontFamily: fonts.family.primaryBold,
        textAlign: 'center',
        paddingVertical: 8,
    },
    addressText: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.secondaryRegular,
        lineHeight: 20,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.primaryMedium,
        marginBottom: 4,
    },
    itemDetails: {
        fontSize: fonts.size.font12,
        fontFamily: fonts.family.secondaryRegular,
    },
    itemTotal: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.primaryBold,
    },
    errorText: {
        fontSize: fonts.size.font16,
        fontFamily: fonts.family.primaryMedium,
        textAlign: 'center',
        marginTop: 50,
    },
});