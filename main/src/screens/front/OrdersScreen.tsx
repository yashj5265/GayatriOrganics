import React, { useState, useCallback, memo } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import MainContainer from '../../container/MainContainer';
import { useTheme } from '../../contexts/ThemeProvider';
import AppTouchableRipple from '../../components/AppTouchableRipple';
import EmptyData from '../../components/EmptyData';
import { OrderCard, Order, StatusInfo } from '../../listItems';
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

// Order and StatusInfo types are imported from listItems

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

            console.log('fetchOrders response', response);
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
});