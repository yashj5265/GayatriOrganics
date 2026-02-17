// ============================================================================
// CartQuickAdjust.tsx – Sleek quantity adjust (− qty +) when item in cart
// ============================================================================
import React, { useCallback, memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppColors } from '../styles/colors';
import fonts from '../styles/fonts';

export interface CartQuickAdjustProps {
    quantity: number;
    onIncrease: () => void;
    onDecrease: () => void;
    onRemove: () => void;
    maxQuantity?: number;
    disabled?: boolean;
    colors: AppColors;
    variant?: 'grid' | 'list' | 'bar';
}

const CartQuickAdjust: React.FC<CartQuickAdjustProps> = memo(({
    quantity,
    onIncrease,
    onDecrease,
    onRemove,
    maxQuantity = 999,
    disabled = false,
    colors,
    variant = 'grid',
}) => {
    const canIncrease = quantity < maxQuantity && !disabled;
    const canDecrease = quantity > 1;

    const handleDecrease = useCallback(() => {
        if (quantity > 1) onDecrease();
        else onRemove();
    }, [quantity, onDecrease, onRemove]);

    const isBar = variant === 'bar';
    const isList = variant === 'list';

    const size = isBar ? 36 : isList ? 32 : 26;
    const iconSize = isBar ? 18 : isList ? 16 : 12;
    const fontSize = isBar ? 15 : isList ? 13 : 11;

    return (
        <View style={[styles.root, isBar && styles.rootBar]}>
            <View style={[
                styles.pill,
                {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: colors.border,
                },
            ]}>
                <TouchableOpacity
                    style={[styles.btn, { width: size, height: size, borderRadius: size / 2 }]}
                    onPress={handleDecrease}
                    disabled={disabled}
                    activeOpacity={0.6}
                >
                    <Icon
                        name={quantity <= 1 ? 'delete-outline' : 'minus'}
                        size={iconSize}
                        color={canDecrease ? colors.textPrimary : colors.textLabel}
                    />
                </TouchableOpacity>
                <Text
                    style={[
                        styles.qtyText,
                        { color: colors.textPrimary, fontSize },
                        isBar && styles.qtyTextBar,
                    ]}
                    numberOfLines={1}
                >
                    {quantity}
                </Text>
                <TouchableOpacity
                    style={[
                        styles.btn,
                        { width: size, height: size, borderRadius: size / 2 },
                        !canIncrease && styles.btnDisabled,
                    ]}
                    onPress={onIncrease}
                    disabled={!canIncrease}
                    activeOpacity={0.6}
                >
                    <Icon
                        name="plus"
                        size={iconSize}
                        color={canIncrease ? colors.themePrimary : colors.textLabel}
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
});

CartQuickAdjust.displayName = 'CartQuickAdjust';

const styles = StyleSheet.create({
    root: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rootBar: {},
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 999,
        borderWidth: 1,
        paddingHorizontal: 2,
        paddingVertical: 2,
        minWidth: 72,
    },
    btn: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    btnDisabled: {
        opacity: 0.5,
    },
    qtyText: {
        fontFamily: fonts.family.primaryBold,
        minWidth: 20,
        textAlign: 'center',
    },
    qtyTextBar: {
        minWidth: 28,
    },
});

export default CartQuickAdjust;
