import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import MainContainer from '../../container/MainContainer';
import { useTheme } from '../../contexts/ThemeProvider';
import fonts from '../../styles/fonts';
import AppTouchableRipple from '../../components/AppTouchableRipple';
import ApiManager from '../../managers/ApiManager';
import StorageManager from '../../managers/StorageManager';
import constant from '../../utilities/constant';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface OrderDetailScreenProps {
    navigation: NativeStackNavigationProp<any>;
    route: RouteProp<any, any>;
}

interface Order {
    id: number;
    order_number?: string;
    status: string;
    total_amount?: number;
    amount?: number;
    items?: any[];
    items_count?: number;
    created_at?: string;
    confirmation_code?: string;
    eta?: string;
    delivery_person_name?: string;
    delivery_person_phone?: string;
    address?: string;
    full_address?: string;
    payment_mode?: string;
    customer_name?: string;
    customer_phone?: string;
}

const OrderDetailScreen: React.FC<OrderDetailScreenProps> = ({ navigation, route }) => {
    const colors = useTheme();
    const { orderId } = route.params || {};
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const fetchOrderDetails = useCallback(async () => {
        if (!orderId) {
            Alert.alert('Error', 'Order ID is missing');
            navigation.goBack();
            return;
        }

        setLoading(true);
        try {
            const token = await StorageManager.getItem(constant.shareInstanceKey.authToken);
            
            const response = await ApiManager.get({
                endpoint: `${constant.apiEndPoints.getOrder}${orderId}`,
                token: token || undefined,
                showError: true,
            });

            if (__DEV__) {
                console.log('✅ Order Detail Response:', response);
            }

            // Handle different response structures
            let orderData: Order | null = null;
            if (response?.data) {
                orderData = response.data;
            } else if (response?.order) {
                orderData = response.order;
            } else if (response && typeof response === 'object' && 'id' in response) {
                orderData = response as Order;
            }

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

    useEffect(() => {
        fetchOrderDetails();
    }, [fetchOrderDetails]);

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

    if (loading) {
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

    if (!order) {
        return (
            <MainContainer
                statusBarColor={colors.themePrimary}
                statusBarStyle="light-content"
            >
                <View style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}>
                    <Text style={[styles.errorText, { color: colors.textPrimary }]}>
                        Order not found
                    </Text>
                </View>
            </MainContainer>
        );
    }

    const statusInfo = getStatusInfo(order.status);
    const orderNumber = order.order_number || `ORD${order.id}`;
    const amount = order.total_amount || order.amount || 0;

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
                        Order Details
                    </Text>
                    <View style={styles.headerRight} />
                </View>

                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Order Info Card */}
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
                        </View>

                        <View style={[styles.divider, { backgroundColor: colors.border }]} />

                        <View style={styles.infoSection}>
                            <View style={styles.infoRow}>
                                <Text style={[styles.infoLabel, { color: colors.textLabel }]}>
                                    Items:
                                </Text>
                                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                                    {order.items_count || order.items?.length || 0}
                                </Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={[styles.infoLabel, { color: colors.textLabel }]}>
                                    Total Amount:
                                </Text>
                                <Text style={[styles.amountValue, { color: colors.themePrimary }]}>
                                    ₹{amount.toFixed(2)}
                                </Text>
                            </View>
                            {order.payment_mode && (
                                <View style={styles.infoRow}>
                                    <Text style={[styles.infoLabel, { color: colors.textLabel }]}>
                                        Payment:
                                    </Text>
                                    <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                                        {order.payment_mode}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Confirmation Code Card */}
                    {order.confirmation_code && (
                        <View style={[styles.card, { backgroundColor: colors.backgroundSecondary }]}>
                            <View style={styles.cardHeader}>
                                <Icon name="key" size={20} color={colors.themePrimary} />
                                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                                    Confirmation Code
                                </Text>
                            </View>
                            <View style={[styles.divider, { backgroundColor: colors.border }]} />
                            <View style={styles.confirmationCodeContainer}>
                                <Text style={[styles.confirmationCode, { color: colors.themePrimary }]}>
                                    {order.confirmation_code}
                                </Text>
                                <Text style={[styles.confirmationCodeHint, { color: colors.textDescription }]}>
                                    Share this code with the delivery person to confirm delivery
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* ETA Card */}
                    {order.eta && (
                        <View style={[styles.card, { backgroundColor: colors.backgroundSecondary }]}>
                            <View style={styles.cardHeader}>
                                <Icon name="clock-fast" size={20} color={colors.themePrimary} />
                                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                                    Estimated Delivery Time
                                </Text>
                            </View>
                            <View style={[styles.divider, { backgroundColor: colors.border }]} />
                            <Text style={[styles.etaValue, { color: colors.themePrimary }]}>
                                {order.eta}
                            </Text>
                        </View>
                    )}

                    {/* Delivery Person Card */}
                    {order.delivery_person_name && (
                        <View style={[styles.card, { backgroundColor: colors.backgroundSecondary }]}>
                            <View style={styles.cardHeader}>
                                <Icon name="account-circle" size={20} color={colors.themePrimary} />
                                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                                    Delivery Person
                                </Text>
                            </View>
                            <View style={[styles.divider, { backgroundColor: colors.border }]} />
                            <View style={styles.infoSection}>
                                <Text style={[styles.infoValue, { color: colors.textPrimary, marginBottom: 4 }]}>
                                    {order.delivery_person_name}
                                </Text>
                                {order.delivery_person_phone && (
                                    <Text style={[styles.infoLabel, { color: colors.textLabel }]}>
                                        {order.delivery_person_phone}
                                    </Text>
                                )}
                            </View>
                        </View>
                    )}

                    {/* Address Card */}
                    {(order.address || order.full_address) && (
                        <View style={[styles.card, { backgroundColor: colors.backgroundSecondary }]}>
                            <View style={styles.cardHeader}>
                                <Icon name="map-marker" size={20} color={colors.themePrimary} />
                                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                                    Delivery Address
                                </Text>
                            </View>
                            <View style={[styles.divider, { backgroundColor: colors.border }]} />
                            <Text style={[styles.addressText, { color: colors.textDescription }]}>
                                {order.full_address || order.address}
                            </Text>
                        </View>
                    )}

                    {/* Items Card */}
                    {order.items && order.items.length > 0 && (
                        <View style={[styles.card, { backgroundColor: colors.backgroundSecondary }]}>
                            <View style={styles.cardHeader}>
                                <Icon name="format-list-bulleted" size={20} color={colors.themePrimary} />
                                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                                    Order Items
                                </Text>
                            </View>
                            <View style={[styles.divider, { backgroundColor: colors.border }]} />
                            {order.items.map((item: any, index: number) => (
                                <View key={index} style={styles.itemRow}>
                                    <View style={styles.itemInfo}>
                                        <Text style={[styles.itemName, { color: colors.textPrimary }]}>
                                            {item.product?.name || item.name || 'Item'}
                                        </Text>
                                        <Text style={[styles.itemDetails, { color: colors.textLabel }]}>
                                            Qty: {item.quantity || 1} × ₹{item.price || 0}
                                        </Text>
                                    </View>
                                    <Text style={[styles.itemTotal, { color: colors.textPrimary }]}>
                                        ₹{((item.quantity || 1) * (item.price || 0)).toFixed(2)}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    )}
                </ScrollView>
            </View>
        </MainContainer>
    );
};

export default OrderDetailScreen;

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

