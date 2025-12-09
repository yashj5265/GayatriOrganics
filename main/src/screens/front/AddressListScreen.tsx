import React, { useState, useCallback, useMemo, memo } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MainContainer from '../../container/MainContainer';
import { useTheme } from '../../contexts/ThemeProvider';
import { useAddress, Address } from '../../contexts/AddressContext';
import fonts from '../../styles/fonts';
import AppTouchableRipple from '../../components/AppTouchableRipple';
import EmptyData, { EmptyDataType } from '../../components/EmptyData';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import constant from '../../utilities/constant';

interface AddressListScreenProps {
    navigation: NativeStackNavigationProp<any>;
}

const AddressListScreen: React.FC<AddressListScreenProps> = ({ navigation }) => {
    const colors = useTheme();
    const insets = useSafeAreaInsets();
    const { addresses, selectedAddress, deleteAddress, selectAddress, setDefaultAddress } = useAddress();
    const [deletingId, setDeletingId] = useState<string | null>(null);

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

    const getAddressTypeIcon = useCallback((type: string) => {
        switch (type) {
            case 'home':
                return 'home';
            case 'work':
                return 'briefcase';
            default:
                return 'map-marker';
        }
    }, []);

    const getAddressTypeLabel = useCallback((type: string) => {
        switch (type) {
            case 'home':
                return 'Home';
            case 'work':
                return 'Work';
            default:
                return 'Other';
        }
    }, []);

    const renderAddressItem = useCallback(({ item }: { item: Address }) => {
        const isSelected = selectedAddress?.id === item.id;
        const isDeleting = deletingId === item.id;

        return (
            <View style={[styles.addressCard, { backgroundColor: colors.backgroundSecondary }]}>
                <View style={styles.addressHeader}>
                    <View style={styles.addressTypeContainer}>
                        <View style={[styles.addressTypeIcon, { backgroundColor: colors.themePrimaryLight }]}>
                            <Icon
                                name={getAddressTypeIcon(item.addressType)}
                                size={20}
                                color={colors.themePrimary}
                            />
                        </View>
                        <View style={styles.addressTypeInfo}>
                            <Text style={[styles.addressTypeLabel, { color: colors.textPrimary }]}>
                                {getAddressTypeLabel(item.addressType)}
                            </Text>
                            {item.isDefault && (
                                <View style={[styles.defaultBadge, { backgroundColor: colors.themePrimary }]}>
                                    <Text style={[styles.defaultBadgeText, { color: colors.white }]}>
                                        Default
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {isSelected && (
                        <View style={[styles.selectedBadge, { backgroundColor: colors.themePrimary }]}>
                            <Icon name="check-circle" size={20} color={colors.white} />
                        </View>
                    )}
                </View>

                <View style={styles.addressContent}>
                    <Text style={[styles.addressName, { color: colors.textPrimary }]}>
                        {item.name}
                    </Text>
                    <Text style={[styles.addressMobile, { color: colors.textLabel }]}>
                        {item.mobile}
                    </Text>
                    <Text style={[styles.addressText, { color: colors.textDescription }]}>
                        {item.addressLine1}
                    </Text>
                    {item.addressLine2 && (
                        <Text style={[styles.addressText, { color: colors.textDescription }]}>
                            {item.addressLine2}
                        </Text>
                    )}
                    <Text style={[styles.addressText, { color: colors.textDescription }]}>
                        {item.city}, {item.state} - {item.pincode}
                    </Text>
                    {item.landmark && (
                        <Text style={[styles.landmarkText, { color: colors.textLabel }]}>
                            Landmark: {item.landmark}
                        </Text>
                    )}
                </View>

                <View style={styles.addressActions}>
                    {!item.isDefault && (
                        <AppTouchableRipple
                            style={[styles.actionButton, { backgroundColor: colors.backgroundPrimary }]}
                            onPress={() => handleSetDefault(item)}
                        >
                            <Icon name="star-outline" size={18} color={colors.themePrimary} />
                            <Text style={[styles.actionButtonText, { color: colors.themePrimary }]}>
                                Set Default
                            </Text>
                        </AppTouchableRipple>
                    )}

                    <AppTouchableRipple
                        style={[styles.actionButton, { backgroundColor: colors.backgroundPrimary }]}
                        onPress={() => handleEditAddress(item)}
                    >
                        <Icon name="pencil" size={18} color={colors.themePrimary} />
                        <Text style={[styles.actionButtonText, { color: colors.themePrimary }]}>
                            Edit
                        </Text>
                    </AppTouchableRipple>

                    <AppTouchableRipple
                        style={[styles.actionButton, { backgroundColor: colors.backgroundPrimary }]}
                        onPress={() => handleDeleteAddress(item)}
                        disabled={isDeleting}
                    >
                        <Icon name="delete-outline" size={18} color="#FF5252" />
                        <Text style={[styles.actionButtonText, { color: '#FF5252' }]}>
                            Delete
                        </Text>
                    </AppTouchableRipple>

                    {!isSelected && (
                        <AppTouchableRipple
                            style={[styles.selectButton, { backgroundColor: colors.themePrimary }]}
                            onPress={() => handleSelectAddress(item)}
                        >
                            <Text style={[styles.selectButtonText, { color: colors.white }]}>
                                Select
                            </Text>
                        </AppTouchableRipple>
                    )}
                </View>
            </View>
        );
    }, [selectedAddress, deletingId, colors, getAddressTypeIcon, getAddressTypeLabel, handleEditAddress, handleDeleteAddress, handleSelectAddress, handleSetDefault]);

    const listContentStyle = useMemo(() => ({
        paddingBottom: 100 + insets.bottom,
    }), [insets.bottom]);

    return (
        <MainContainer
            statusBarColor={colors.themePrimary}
            statusBarStyle="light-content"
            isInternetRequired={false}
        >
            <View style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}>
                {/* Header */}
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



                {/* Address List */}
                {addresses.length === 0 ? (
                    <EmptyData
                        type={EmptyDataType.NO_RECORDS}
                        title="No Addresses Saved"
                        description="Add your first address to get started with deliveries"
                    />
                ) : (
                    <FlatList
                        data={addresses}
                        renderItem={renderAddressItem}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={[styles.listContainer, listContentStyle]}
                        showsVerticalScrollIndicator={false}
                    />
                )}

                {/* Add Address Button */}
                <View style={styles.addButtonContainer}>
                    <AppTouchableRipple
                        style={[styles.addButton, { backgroundColor: colors.themePrimary }]}
                        onPress={handleAddAddress}
                    >
                        <Icon name="plus" size={20} color={colors.white} />
                        <Text style={[styles.addButtonText, { color: colors.white }]}>
                            Add New Address
                        </Text>
                    </AppTouchableRipple>
                </View>
            </View>
        </MainContainer>
    );
};

export default memo(AddressListScreen);

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
});

