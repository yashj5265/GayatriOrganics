import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AppTouchableRipple from '../components/AppTouchableRipple';
import { useTheme } from '../contexts/ThemeProvider';
import fonts from '../styles/fonts';

// ============================================================================
// TYPES
// ============================================================================
export interface Order {
    id: number;
    order_code?: string;
    order_number?: string;
    status: string;
    total_amount?: number | string;
    amount?: number | string;
    items_count?: number;
    created_at?: string;
    confirmation_code?: string;
    eta?: string;
    delivery_person_name?: string;
    delivery_date?: string;
    subtotal?: number | string;
    delivery_charge?: number | string;
    items?: any[];
    address?: any;
}

export interface StatusInfo {
    label: string;
    color: string;
    icon: string;
}

export interface OrderCardProps {
    order: Order;
    statusInfo: StatusInfo;
    onPress: (order: Order) => void;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
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

// ============================================================================
// SUB COMPONENTS
// ============================================================================
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
    amount: number | undefined;
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

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const OrderCard: React.FC<OrderCardProps> = memo(({ order, statusInfo, onPress }) => {
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

OrderCard.displayName = 'OrderCard';

export default OrderCard;

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
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

