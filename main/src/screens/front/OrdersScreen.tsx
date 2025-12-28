import React, { useState, useCallback, memo } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import MainContainer from '../../container/MainContainer';
import { useTheme } from '../../contexts/ThemeProvider';
import AppTouchableRipple from '../../components/AppTouchableRipple';
import EmptyData from '../../components/EmptyData';
import ApiManager from '../../managers/ApiManager';
import StorageManager from '../../managers/StorageManager';
import fonts from '../../styles/fonts';
import constant from '../../utilities/constant';

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
interface OrdersScreenProps {
    navigation: NativeStackNavigationProp<any>;
}

interface Order {
    id: number;
    order_number?: string;
    status: string;
    total_amount?: number;
    amount?: number;
    items_count?: number;
    created_at?: string;
    confirmation_code?: string;
    eta?: string;
    delivery_person_name?: string;
}

interface StatusInfo {
    label: string;
    color: string;
    icon: string;
}

interface OrderCardProps {
    order: Order;
    statusInfo: StatusInfo;
    onPress: (order: Order) => void;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
const getStatusInfo = (status: string, fallbackColor: string): StatusInfo => {
    const statusLower = status?.toLowerCase() || '';

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
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    } catch {
        return dateString;
    }
};

const formatCurrency = (amount: number): string => {
    return `₹${amount.toFixed(2)}`;
};

const getOrderNumber = (order: Order): string => {
    return order.order_number || `ORD${order.id}`;
};

const getOrderAmount = (order: Order): number => {
    return order.total_amount || order.amount || 0;
};

const extractOrdersData = (response: any): Order[] => {
    if (response?.data && Array.isArray(response.data)) {
        return response.data;
    }
    if (response?.orders && Array.isArray(response.orders)) {
        return response.orders;
    }
    if (Array.isArray(response)) {
        return response;
    }
    return [];
};

// ============================================================================
// SUB COMPONENTS
// ============================================================================
const OrdersHeader = memo(({ onBack }: { onBack: () => void }) => {
    const colors = useTheme();

    return (
        <View style={[styles.header, { backgroundColor: colors.themePrimary }]}>
            <AppTouchableRipple style={styles.backButton} onPress={onBack}>
                <Icon name="arrow-left" size={24} color={colors.white} />
            </AppTouchableRipple>
            <Text style={[styles.headerTitle, { color: colors.white }]}>
                My Orders
            </Text>
            <View style={styles.headerRight} />
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
                size={16}
                color={statusInfo.color}
                style={styles.statusIcon}
            />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
                {statusInfo.label}
            </Text>
        </View>
    );
});

const OrderHeader = memo(({
    orderNumber,
    orderDate,
    statusInfo,
}: {
    orderNumber: string;
    orderDate: string;
    statusInfo: StatusInfo;
}) => {
    const colors = useTheme();

    return (
        <View style={styles.orderHeader}>
            <View style={styles.orderInfo}>
                <Text style={[styles.orderNumber, { color: colors.textPrimary }]}>
                    {orderNumber}
                </Text>
                <Text style={[styles.orderDate, { color: colors.textLabel }]}>
                    {orderDate}
                </Text>
            </View>
            <StatusBadge statusInfo={statusInfo} />
        </View>
    );
});

const DetailRow = memo(({
    label,
    value,
    isAmount = false,
}: {
    label: string;
    value: string | number;
    isAmount?: boolean;
}) => {
    const colors = useTheme();

    return (
        <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textLabel }]}>
                {label}
            </Text>
            <Text
                style={[
                    isAmount ? styles.amountValue : styles.detailValue,
                    { color: isAmount ? colors.themePrimary : colors.textPrimary },
                ]}
            >
                {value}
            </Text>
        </View>
    );
});

const OrderDetails = memo(({
    itemsCount,
    amount,
}: {
    itemsCount: number;
    amount: number;
}) => {
    return (
        <View style={styles.orderDetails}>
            <DetailRow label="Items:" value={itemsCount} />
            <DetailRow label="Amount:" value={formatCurrency(amount)} isAmount />
        </View>
    );
});

const ETAInfo = memo(({ eta }: { eta: string }) => {
    const colors = useTheme();

    return (
        <View style={styles.etaContainer}>
            <Icon name="clock-fast" size={16} color={colors.themePrimary} />
            <Text style={[styles.etaText, { color: colors.themePrimary }]}>
                ETA: {eta}
            </Text>
        </View>
    );
});

const ViewDetailsFooter = memo(() => {
    const colors = useTheme();

    return (
        <View style={styles.viewDetails}>
            <Text style={[styles.viewDetailsText, { color: colors.themePrimary }]}>
                View Details
            </Text>
            <Icon name="chevron-right" size={20} color={colors.themePrimary} />
        </View>
    );
});

const OrderCard = memo(({ order, statusInfo, onPress }: OrderCardProps) => {
    const colors = useTheme();
    const orderNumber = getOrderNumber(order);
    const amount = getOrderAmount(order);

    return (
        <AppTouchableRipple
            style={[styles.orderCard, { backgroundColor: colors.backgroundSecondary }]}
            onPress={() => onPress(order)}
        >
            {/* Header */}
            <OrderHeader
                orderNumber={orderNumber}
                orderDate={formatDate(order.created_at)}
                statusInfo={statusInfo}
            />

            {/* Details */}
            <OrderDetails
                itemsCount={order.items_count || 0}
                amount={amount}
            />

            {/* ETA */}
            {order.eta && <ETAInfo eta={order.eta} />}

            {/* Footer */}
            <ViewDetailsFooter />
        </AppTouchableRipple>
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

const EmptyState = memo(() => {
    return <EmptyData type="NO_DATA" message="No orders found" />;
});

const OrdersList = memo(({
    orders,
    fallbackColor,
    onOrderPress,
}: {
    orders: Order[];
    fallbackColor: string;
    onOrderPress: (order: Order) => void;
}) => {
    if (orders.length === 0) {
        return <EmptyState />;
    }

    return (
        <>
            {orders.map((order) => {
                const statusInfo = getStatusInfo(order.status, fallbackColor);
                return (
                    <OrderCard
                        key={order.id}
                        order={order}
                        statusInfo={statusInfo}
                        onPress={onOrderPress}
                    />
                );
            })}
        </>
    );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const OrdersScreen: React.FC<OrdersScreenProps> = ({ navigation }) => {
    const colors = useTheme();

    // ============================================================================
    // STATE
    // ============================================================================
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);

    // ============================================================================
    // API HANDLERS
    // ============================================================================
    const fetchOrders = useCallback(async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            const token = await StorageManager.getItem(constant.shareInstanceKey.authToken);

            const response = await ApiManager.get({
                endpoint: constant.apiEndPoints.myOrders,
                token: token || undefined,
                showError: true,
            });

            if (__DEV__) {
                console.log('✅ Orders Response:', response);
            }

            const ordersData = extractOrdersData(response);
            setOrders(ordersData);
        } catch (error: any) {
            console.error('❌ Fetch Orders Error:', error);
            setOrders([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // ============================================================================
    // EFFECTS
    // ============================================================================
    useFocusEffect(
        useCallback(() => {
            fetchOrders();
        }, [fetchOrders])
    );

    // ============================================================================
    // HANDLERS
    // ============================================================================
    const handleRefresh = useCallback(() => {
        fetchOrders(true);
    }, [fetchOrders]);

    const handleOrderPress = useCallback(
        (order: Order) => {
            navigation.navigate(constant.routeName.orderDetail, { orderId: order.id });
        },
        [navigation]
    );

    const handleGoBack = useCallback(() => {
        navigation.goBack();
    }, [navigation]);

    // ============================================================================
    // RENDER - LOADING STATE
    // ============================================================================
    if (loading && orders.length === 0) {
        return <LoadingState />;
    }

    // ============================================================================
    // RENDER - ORDERS LIST
    // ============================================================================
    return (
        <MainContainer
            statusBarColor={colors.themePrimary}
            statusBarStyle="light-content"
            isInternetRequired={true}
        >
            <View style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}>
                {/* Header */}
                <OrdersHeader onBack={handleGoBack} />

                {/* Orders List */}
                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            colors={[colors.themePrimary]}
                        />
                    }
                >
                    <OrdersList
                        orders={orders}
                        fallbackColor={colors.textLabel}
                        onOrderPress={handleOrderPress}
                    />
                </ScrollView>
            </View>
        </MainContainer>
    );
};

export default memo(OrdersScreen);

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
    orderCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    orderInfo: {
        flex: 1,
    },
    orderNumber: {
        fontSize: fonts.size.font16,
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
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 4,
    },
    statusIcon: {
        marginRight: 2,
    },
    statusText: {
        fontSize: fonts.size.font11,
        fontFamily: fonts.family.primaryBold,
    },
    orderDetails: {
        marginBottom: 12,
        gap: 8,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailLabel: {
        fontSize: fonts.size.font13,
        fontFamily: fonts.family.secondaryRegular,
    },
    detailValue: {
        fontSize: fonts.size.font13,
        fontFamily: fonts.family.primaryMedium,
    },
    amountValue: {
        fontSize: fonts.size.font16,
        fontFamily: fonts.family.primaryBold,
    },
    etaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    etaText: {
        fontSize: fonts.size.font13,
        fontFamily: fonts.family.primaryMedium,
    },
    viewDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    viewDetailsText: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.primaryBold,
        marginRight: 4,
    },
});