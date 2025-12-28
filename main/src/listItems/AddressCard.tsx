import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AppTouchableRipple from '../components/AppTouchableRipple';
import { useTheme } from '../contexts/ThemeProvider';
import { Address } from '../contexts/AddressContext';
import fonts from '../styles/fonts';

// ============================================================================
// TYPES
// ============================================================================
export interface AddressCardProps {
    address: Address;
    isSelected: boolean;
    isDeleting: boolean;
    onEdit: (address: Address) => void;
    onDelete: (address: Address) => void;
    onSelect: (address: Address) => void;
    onSetDefault: (address: Address) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================
const ADDRESS_TYPE = {
    HOME: 'home',
    WORK: 'work',
    OTHER: 'other',
} as const;

const ICON_NAMES = {
    [ADDRESS_TYPE.HOME]: 'home',
    [ADDRESS_TYPE.WORK]: 'briefcase',
    [ADDRESS_TYPE.OTHER]: 'map-marker',
} as const;

const TYPE_LABELS = {
    [ADDRESS_TYPE.HOME]: 'Home',
    [ADDRESS_TYPE.WORK]: 'Work',
    [ADDRESS_TYPE.OTHER]: 'Other',
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
const getAddressTypeIcon = (type: string): string => {
    return ICON_NAMES[type as keyof typeof ICON_NAMES] || ICON_NAMES[ADDRESS_TYPE.OTHER];
};

const getAddressTypeLabel = (type: string): string => {
    return TYPE_LABELS[type as keyof typeof TYPE_LABELS] || TYPE_LABELS[ADDRESS_TYPE.OTHER];
};

// ============================================================================
// SUB COMPONENTS
// ============================================================================
const AddressTypeTag = memo(({ type, isDefault }: { type: string; isDefault: boolean }) => {
    const colors = useTheme();

    return (
        <View style={styles.addressTypeContainer}>
            <View style={[styles.addressTypeIcon, { backgroundColor: colors.themePrimaryLight }]}>
                <Icon
                    name={getAddressTypeIcon(type)}
                    size={20}
                    color={colors.themePrimary}
                />
            </View>
            <View style={styles.addressTypeInfo}>
                <Text style={[styles.addressTypeLabel, { color: colors.textPrimary }]}>
                    {getAddressTypeLabel(type)}
                </Text>
                {isDefault && (
                    <View style={[styles.defaultBadge, { backgroundColor: colors.themePrimary }]}>
                        <Text style={[styles.defaultBadgeText, { color: colors.white }]}>
                            Default
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
});

const AddressDetails = memo(({ address }: { address: Address }) => {
    const colors = useTheme();

    return (
        <View style={styles.addressContent}>
            <Text style={[styles.addressName, { color: colors.textPrimary }]}>
                {address.name}
            </Text>
            <Text style={[styles.addressMobile, { color: colors.textLabel }]}>
                {address.mobile}
            </Text>
            <Text style={[styles.addressText, { color: colors.textDescription }]}>
                {address.addressLine1}
            </Text>
            {address.addressLine2 && (
                <Text style={[styles.addressText, { color: colors.textDescription }]}>
                    {address.addressLine2}
                </Text>
            )}
            <Text style={[styles.addressText, { color: colors.textDescription }]}>
                {address.city}, {address.state} - {address.pincode}
            </Text>
            {address.landmark && (
                <Text style={[styles.landmarkText, { color: colors.textLabel }]}>
                    Landmark: {address.landmark}
                </Text>
            )}
        </View>
    );
});

const ActionButton = memo(({
    icon,
    label,
    color,
    onPress,
    disabled = false,
}: {
    icon: string;
    label: string;
    color: string;
    onPress: () => void;
    disabled?: boolean;
}) => {
    const colors = useTheme();

    return (
        <AppTouchableRipple
            style={[styles.actionButton, { backgroundColor: colors.backgroundPrimary }]}
            onPress={onPress}
            disabled={disabled}
        >
            <Icon name={icon} size={18} color={color} />
            <Text style={[styles.actionButtonText, { color }]}>
                {label}
            </Text>
        </AppTouchableRipple>
    );
});

const AddressActions = memo(({
    address,
    isSelected,
    isDeleting,
    onEdit,
    onDelete,
    onSelect,
    onSetDefault,
}: {
    address: Address;
    isSelected: boolean;
    isDeleting: boolean;
    onEdit: () => void;
    onDelete: () => void;
    onSelect: () => void;
    onSetDefault: () => void;
}) => {
    const colors = useTheme();

    return (
        <View style={styles.addressActions}>
            {!address.isDefault && (
                <ActionButton
                    icon="star-outline"
                    label="Set Default"
                    color={colors.themePrimary}
                    onPress={onSetDefault}
                />
            )}

            <ActionButton
                icon="pencil"
                label="Edit"
                color={colors.themePrimary}
                onPress={onEdit}
            />

            <ActionButton
                icon="delete-outline"
                label="Delete"
                color="#FF5252"
                onPress={onDelete}
                disabled={isDeleting}
            />

            {!isSelected && (
                <AppTouchableRipple
                    style={[styles.selectButton, { backgroundColor: colors.themePrimary }]}
                    onPress={onSelect}
                >
                    <Text style={[styles.selectButtonText, { color: colors.white }]}>
                        Select
                    </Text>
                </AppTouchableRipple>
            )}
        </View>
    );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const AddressCard: React.FC<AddressCardProps> = memo(({
    address,
    isSelected,
    isDeleting,
    onEdit,
    onDelete,
    onSelect,
    onSetDefault,
}) => {
    const colors = useTheme();

    return (
        <View style={[styles.addressCard, { backgroundColor: colors.backgroundSecondary }]}>
            {/* Header with type and selection badge */}
            <View style={styles.addressHeader}>
                <AddressTypeTag type={address.addressType} isDefault={address.isDefault} />
                {isSelected && (
                    <View style={[styles.selectedBadge, { backgroundColor: colors.themePrimary }]}>
                        <Icon name="check-circle" size={20} color={colors.white} />
                    </View>
                )}
            </View>

            {/* Address details */}
            <AddressDetails address={address} />

            {/* Action buttons */}
            <AddressActions
                address={address}
                isSelected={isSelected}
                isDeleting={isDeleting}
                onEdit={() => onEdit(address)}
                onDelete={() => onDelete(address)}
                onSelect={() => onSelect(address)}
                onSetDefault={() => onSetDefault(address)}
            />
        </View>
    );
});

AddressCard.displayName = 'AddressCard';

export default AddressCard;

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
    addressCard: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    addressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    addressTypeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    addressTypeIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addressTypeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    addressTypeLabel: {
        fontSize: fonts.size.font16,
        fontFamily: fonts.family.primaryBold,
    },
    defaultBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    defaultBadgeText: {
        fontSize: fonts.size.font10,
        fontFamily: fonts.family.primaryBold,
    },
    selectedBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addressContent: {
        marginBottom: 16,
    },
    addressName: {
        fontSize: fonts.size.font16,
        fontFamily: fonts.family.primaryBold,
        marginBottom: 4,
    },
    addressMobile: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.secondaryRegular,
        marginBottom: 8,
    },
    addressText: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.secondaryRegular,
        lineHeight: 20,
        marginBottom: 4,
    },
    landmarkText: {
        fontSize: fonts.size.font12,
        fontFamily: fonts.family.secondaryRegular,
        marginTop: 4,
        fontStyle: 'italic',
    },
    addressActions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
    },
    actionButtonText: {
        fontSize: fonts.size.font12,
        fontFamily: fonts.family.primaryMedium,
    },
    selectButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        marginLeft: 'auto',
    },
    selectButtonText: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.primaryBold,
    },
});

