import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import MainContainer from '../../container/MainContainer';
import { useTheme } from '../../contexts/ThemeProvider';
import fonts from '../../styles/fonts';
import AppTouchableRipple from '../../components/AppTouchableRipple';
import ApiManager from '../../managers/ApiManager';
import StorageManager from '../../managers/StorageManager';
import constant from '../../utilities/constant';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import EmptyData from '../../components/EmptyData';

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

const OrdersScreen: React.FC<OrdersScreenProps> = ({ navigation }) => {
    const colors = useTheme();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);

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

            // Handle different response structures
            let ordersData: Order[] = [];
            if (response?.data && Array.isArray(response.data)) {
                ordersData = response.data;
            } else if (response?.orders && Array.isArray(response.orders)) {
                ordersData = response.orders;
            } else if (Array.isArray(response)) {
                ordersData = response;
            }

            setOrders(ordersData);
        } catch (error: any) {
            console.error('❌ Fetch Orders Error:', error);
            setOrders([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchOrders();
        }, [fetchOrders])
    );

    const onRefresh = () => {
        fetchOrders(true);
    };

    const getStatusInfo = (status: string) => {
        const statusLower = status?.toLowerCase() || '';
        switch (statusLower) {
            case 'pending':
            case 'new':
                return { label: 'Pending', color: '#ff9800', icon: 'clock-outline' };
            case 'confirmed':
            case 'accepted':
                return { label: 'Confirmed', color: '#2196f3', icon: 'check-circle-outline' };
            case 'packed':
            case 'ready':
                return { label: 'Packed', color: '#9c27b0', icon: 'package-variant' };
            case 'assigned':
                return { label: 'Assigned', color: '#ff5722', icon: 'account-check' };
            case 'picked':
            case 'picked_up':
                return { label: 'Picked Up', color: '#00bcd4', icon: 'truck-delivery' };
            case 'delivering':
            case 'out_for_delivery':
                return { label: 'Out for Delivery', color: '#673ab7', icon: 'truck' };
            case 'delivered':
            case 'completed':
                return { label: 'Delivered', color: '#4caf50', icon: 'check-circle' };
            case 'cancelled':
            case 'rejected':
                return { label: 'Cancelled', color: '#f44336', icon: 'close-circle' };
            default:
                return { label: status || 'Unknown', color: colors.textLabel, icon: 'help-circle' };
        }
    };

    const formatDate = (dateString?: string) => {
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

    const handleOrderPress = (order: Order) => {
        navigation.navigate(constant.routeName.orderDetail, { orderId: order.id });
    };

    if (loading && orders.length === 0) {
        return (
            <MainContainer
                statusBarColor={colors.themePrimary}
                statusBarStyle="light-content"
                showLoader={true}
            >
                <View />
            </MainContainer>
        );
    }

    return (
        <MainContainer
            statusBarColor={colors.themePrimary}
            statusBarStyle="light-content"
            isInternetRequired={true}
        >
            <View style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: colors.themePrimary }]}>
                    <AppTouchableRipple
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Icon name="arrow-left" size={24} color={colors.white} />
                    </AppTouchableRipple>
                    <Text style={[styles.headerTitle, { color: colors.white }]}>
                        My Orders
                    </Text>
                    <View style={styles.headerRight} />
                </View>

                {/* Orders List */}
                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[colors.themePrimary]}
                        />
                    }
                >
                    {orders.length === 0 ? (
                        <EmptyData type="NO_DATA" message="No orders found" />
                    ) : (
                        orders.map((order) => {
                            const statusInfo = getStatusInfo(order.status);
                            const orderNumber = order.order_number || `ORD${order.id}`;
                            const amount = order.total_amount || order.amount || 0;

                            return (
                                <AppTouchableRipple
                                    key={order.id}
                                    style={[
                                        styles.orderCard,
                                        { backgroundColor: colors.backgroundSecondary },
                                    ]}
                                    onPress={() => handleOrderPress(order)}
                                >
                                    <View style={styles.orderHeader}>
                                        <View style={styles.orderInfo}>
                                            <Text style={[styles.orderNumber, { color: colors.textPrimary }]}>
                                                {orderNumber}
                                            </Text>
                                            <Text style={[styles.orderDate, { color: colors.textLabel }]}>
                                                {formatDate(order.created_at)}
                                            </Text>
                                        </View>
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
                                            <Text
                                                style={[
                                                    styles.statusText,
                                                    { color: statusInfo.color },
                                                ]}
                                            >
                                                {statusInfo.label}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.orderDetails}>
                                        <View style={styles.detailRow}>
                                            <Text style={[styles.detailLabel, { color: colors.textLabel }]}>
                                                Items:
                                            </Text>
                                            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                                                {order.items_count || 0}
                                            </Text>
                                        </View>
                                        <View style={styles.detailRow}>
                                            <Text style={[styles.detailLabel, { color: colors.textLabel }]}>
                                                Amount:
                                            </Text>
                                            <Text style={[styles.amountValue, { color: colors.themePrimary }]}>
                                                ₹{amount.toFixed(2)}
                                            </Text>
                                        </View>
                                    </View>

                                    {order.eta && (
                                        <View style={styles.etaContainer}>
                                            <Icon name="clock-fast" size={16} color={colors.themePrimary} />
                                            <Text style={[styles.etaText, { color: colors.themePrimary }]}>
                                                ETA: {order.eta}
                                            </Text>
                                        </View>
                                    )}

                                    <View style={styles.viewDetails}>
                                        <Text style={[styles.viewDetailsText, { color: colors.themePrimary }]}>
                                            View Details
                                        </Text>
                                        <Icon name="chevron-right" size={20} color={colors.themePrimary} />
                                    </View>
                                </AppTouchableRipple>
                            );
                        })
                    )}
                </ScrollView>
            </View>
        </MainContainer>
    );
};

export default OrdersScreen;

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

