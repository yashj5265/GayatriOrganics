import React, { useState, useCallback, useMemo, memo } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import MainContainer from '../../container/MainContainer';
import { useTheme } from '../../contexts/ThemeProvider';
import { useAddress, Address } from '../../contexts/AddressContext';
import AppTouchableRipple from '../../components/AppTouchableRipple';
import EmptyData, { EmptyDataType } from '../../components/EmptyData';
import fonts from '../../styles/fonts';
import constant from '../../utilities/constant';

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
// TYPES
// ============================================================================
interface AddressListScreenProps {
    navigation: NativeStackNavigationProp<any>;
}

interface AddressCardProps {
    address: Address;
    isSelected: boolean;
    isDeleting: boolean;
    onEdit: (address: Address) => void;
    onDelete: (address: Address) => void;
    onSelect: (address: Address) => void;
    onSetDefault: (address: Address) => void;
}

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
const AddressHeader = memo(({ navigation }: { navigation: NativeStackNavigationProp<any> }) => {
    const colors = useTheme();

    return (
        <View style={[styles.header, { backgroundColor: colors.themePrimary }]}>
            <View style={styles.headerTop}>
                <AppTouchableRipple
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="arrow-left" size={24} color={colors.white} />
                </AppTouchableRipple>
                <Text style={[styles.headerTitle, { color: colors.white }]}>
                    Saved Addresses
                </Text>
                <View style={styles.backButton} />
            </View>
        </View>
    );
});

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

const AddressCard = memo(({
    address,
    isSelected,
    isDeleting,
    onEdit,
    onDelete,
    onSelect,
    onSetDefault,
}: AddressCardProps) => {
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

const AddNewAddressButton = memo(({ onPress }: { onPress: () => void }) => {
    const colors = useTheme();

    return (
        <View style={styles.addButtonContainer}>
            <AppTouchableRipple
                style={[styles.addButton, { backgroundColor: colors.themePrimary }]}
                onPress={onPress}
            >
                <Icon name="plus" size={20} color={colors.white} />
                <Text style={[styles.addButtonText, { color: colors.white }]}>
                    Add New Address
                </Text>
            </AppTouchableRipple>
        </View>
    );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const AddressListScreen: React.FC<AddressListScreenProps> = ({ navigation }) => {
    const colors = useTheme();
    const insets = useSafeAreaInsets();
    const { addresses, selectedAddress, deleteAddress, selectAddress, setDefaultAddress } = useAddress();
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // ============================================================================
    // HANDLERS
    // ============================================================================
    const handleAddAddress = useCallback(() => {
        navigation.navigate(constant.routeName.addEditAddress, { mode: 'add' });
    }, [navigation]);

    const handleEditAddress = useCallback((address: Address) => {
        navigation.navigate(constant.routeName.addEditAddress, { mode: 'edit', address });
    }, [navigation]);

    const handleDeleteAddress = useCallback((address: Address) => {
        Alert.alert(
            'Delete Address',
            `Are you sure you want to delete this address?\n\n${address.addressLine1}, ${address.city}`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setDeletingId(address.id);
                        try {
                            await deleteAddress(address.id);
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete address. Please try again.');
                        } finally {
                            setDeletingId(null);
                        }
                    },
                },
            ]
        );
    }, [deleteAddress]);

    const handleSelectAddress = useCallback(async (address: Address) => {
        try {
            await selectAddress(address.id);
            navigation.goBack();
        } catch (error) {
            Alert.alert('Error', 'Failed to select address. Please try again.');
        }
    }, [selectAddress, navigation]);

    const handleSetDefault = useCallback(async (address: Address) => {
        try {
            await setDefaultAddress(address.id);
        } catch (error) {
            Alert.alert('Error', 'Failed to set default address. Please try again.');
        }
    }, [setDefaultAddress]);

    // ============================================================================
    // RENDER FUNCTIONS
    // ============================================================================
    const renderAddressItem = useCallback(({ item }: { item: Address }) => {
        const isSelected = selectedAddress?.id === item.id;
        const isDeleting = deletingId === item.id;

        return (
            <AddressCard
                address={item}
                isSelected={isSelected}
                isDeleting={isDeleting}
                onEdit={handleEditAddress}
                onDelete={handleDeleteAddress}
                onSelect={handleSelectAddress}
                onSetDefault={handleSetDefault}
            />
        );
    }, [selectedAddress, deletingId, handleEditAddress, handleDeleteAddress, handleSelectAddress, handleSetDefault]);

    const keyExtractor = useCallback((item: Address) => item.id, []);

    const listContentStyle = useMemo(() => ({
        paddingBottom: 100 + insets.bottom,
    }), [insets.bottom]);

    const hasNoAddresses = addresses.length === 0;

    // ============================================================================
    // RENDER
    // ============================================================================
    return (
        <MainContainer
            statusBarColor={colors.themePrimary}
            statusBarStyle="light-content"
            isInternetRequired={false}
        >
            <View style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}>
                <AddressHeader navigation={navigation} />

                {hasNoAddresses ? (
                    <EmptyData
                        type={EmptyDataType.NO_RECORDS}
                        title="No Addresses Saved"
                        description="Add your first address to get started with deliveries"
                    />
                ) : (
                    <FlatList
                        data={addresses}
                        renderItem={renderAddressItem}
                        keyExtractor={keyExtractor}
                        contentContainerStyle={[styles.listContainer, listContentStyle]}
                        showsVerticalScrollIndicator={false}
                    />
                )}

                <AddNewAddressButton onPress={handleAddAddress} />
            </View>
        </MainContainer>
    );
};

export default memo(AddressListScreen);

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        padding: 4,
        width: 32,
    },
    headerTitle: {
        fontSize: fonts.size.font22,
        fontFamily: fonts.family.primaryBold,
    },
    listContainer: {
        paddingHorizontal: 20,
        paddingTop: 8,
    },
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
    addButtonContainer: {
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    addButtonText: {
        fontSize: fonts.size.font16,
        fontFamily: fonts.family.primaryBold,
    },
});