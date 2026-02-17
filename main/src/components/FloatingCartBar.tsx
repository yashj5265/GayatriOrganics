// ============================================================================
// FloatingCartBar.tsx – Cart summary bar above tab bar (modern UX)
// ============================================================================
import React, { useMemo, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Platform,
    Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeProvider';
import fonts from '../styles/fonts';

const BASE_IMAGE_URL = 'https://gayatriorganicfarm.com/storage/';

/** Approximate height of the floating bar (padding + content) */
const FLOATING_BAR_HEIGHT = 64;
/** Gap between bar and tab bar (visible space in px) */
const BAR_TO_TAB_GAP = 10;
/** Subtract from tab bar height when positioning (fixes extra gap on some devices) */
const TAB_BAR_POSITION_OFFSET = 65;
/** Extra gap so scroll content doesn't sit flush under the bar */
const CONTENT_TO_BAR_GAP = 16;

function getTabBarHeight(insets: { bottom: number }): number {
    return Platform.OS === 'ios' ? 85 + insets.bottom : 65 + insets.bottom;
}

/**
 * Returns the bottom padding to use for scroll content when the floating cart bar is visible,
 * so content scrolls above the bar and is not overlapped.
 */
export function getFloatingCartBarReservedPadding(insets: { bottom: number }): number {
    const tabBarHeight = getTabBarHeight(insets);
    return tabBarHeight + BAR_TO_TAB_GAP + FLOATING_BAR_HEIGHT + CONTENT_TO_BAR_GAP;
}

export interface FloatingCartBarProps {
    itemCount: number;
    total: number;
    firstItemImage?: string | null;
    firstItemName?: string;
    onCheckout: () => void;
    onViewCart: () => void;
    onClearCart: () => void;
}

const FloatingCartBar: React.FC<FloatingCartBarProps> = ({
    itemCount,
    total,
    firstItemImage,
    firstItemName,
    onCheckout,
    onViewCart,
    onClearCart,
}) => {
    const colors = useTheme();
    const insets = useSafeAreaInsets();

    const thumbnailUri = useMemo(() => {
        if (!firstItemImage || String(firstItemImage).trim() === '') return null;
        const path = String(firstItemImage).trim();
        if (path.startsWith('http')) return path;
        return `${BASE_IMAGE_URL}${path}`;
    }, [firstItemImage]);

    const barBottomOffset = useMemo(
        () => Math.max(0, getTabBarHeight(insets) - TAB_BAR_POSITION_OFFSET) + BAR_TO_TAB_GAP,
        [insets]
    );

    const handleClearPress = useCallback(() => {
        Alert.alert(
            'Clear cart?',
            'Remove all items from your cart?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Clear', style: 'destructive', onPress: onClearCart },
            ]
        );
    }, [onClearCart]);

    if (itemCount <= 0) return null;

    const displayName = firstItemName
        ? firstItemName.length > 18
            ? `${firstItemName.slice(0, 16)}…`
            : firstItemName
        : 'Cart';

    return (
        <View
            style={[
                styles.wrapper,
                {
                    bottom: barBottomOffset,
                    backgroundColor: colors.backgroundPrimary,
                    borderColor: colors.border,
                    shadowColor: '#000',
                },
            ]}
        >
            <TouchableOpacity
                style={styles.leftSection}
                onPress={onViewCart}
                activeOpacity={0.7}
            >
                {thumbnailUri ? (
                    <Image
                        source={{ uri: thumbnailUri }}
                        style={styles.thumbnail}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={[styles.thumbnailPlaceholder, { backgroundColor: colors.themePrimaryLight }]}>
                        <Icon name="cart-outline" size={20} color={colors.themePrimary} />
                    </View>
                )}
                <View style={styles.leftText}>
                    <Text style={[styles.cartLabel, { color: colors.textPrimary }]} numberOfLines={1}>
                        {displayName}
                    </Text>
                    <Text style={[styles.viewCartLink, { color: colors.themePrimary }]}>
                        View Cart
                    </Text>
                </View>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.checkoutButton, { backgroundColor: colors.themePrimary }]}
                onPress={onCheckout}
                activeOpacity={0.85}
            >
                <Text style={[styles.checkoutText, { color: colors.white }]}>
                    {itemCount} {itemCount === 1 ? 'item' : 'items'} · ₹{total.toFixed(0)} Checkout
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.clearBtn}
                onPress={handleClearPress}
                activeOpacity={0.7}
            >
                <Icon name="delete-outline" size={22} color={colors.textDescription} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        left: 12,
        right: 12,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 16,
        borderWidth: 1,
        elevation: 6,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 10,
        flex: 0,
        maxWidth: 120,
    },
    thumbnail: {
        width: 44,
        height: 44,
        borderRadius: 10,
    },
    thumbnailPlaceholder: {
        width: 44,
        height: 44,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    leftText: {
        marginLeft: 8,
        flex: 1,
    },
    cartLabel: {
        fontSize: fonts.size.font12,
        fontFamily: fonts.family.primaryBold,
    },
    viewCartLink: {
        fontSize: fonts.size.font11,
        fontFamily: fonts.family.secondaryRegular,
        marginTop: 2,
    },
    checkoutButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 0,
    },
    checkoutText: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.primaryBold,
    },
    clearBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 6,
    },
});

export default FloatingCartBar;
