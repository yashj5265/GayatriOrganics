import React, { useState, useCallback, useMemo, memo, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import MainContainer from '../../container/MainContainer';
import { useTheme } from '../../contexts/ThemeProvider';
import { useAddress, Address } from '../../contexts/AddressContext';
import AppTouchableRipple from '../../components/AppTouchableRipple';
import EmptyData, { EmptyDataType } from '../../components/EmptyData';
import { AddressCard } from '../../listItems';
import fonts from '../../styles/fonts';
import constant from '../../utilities/constant';

// ============================================================================
// CONSTANTS
// ============================================================================
const ADDRESS_TYPES = [
    { key: 'all', label: 'All', icon: 'view-grid' },
    { key: 'Home', label: 'Home', icon: 'home' },
    { key: 'Work', label: 'Work', icon: 'briefcase' },
    { key: 'Other', label: 'Other', icon: 'map-marker' },
] as const;

type AddressTypeFilter = typeof ADDRESS_TYPES[number]['key'];

// ============================================================================
// TYPES
// ============================================================================
interface AddressListScreenProps {
    navigation: NativeStackNavigationProp<any>;
}

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

const FilterChip = memo(({
    filter,
    isSelected,
    onPress,
}: {
    filter: typeof ADDRESS_TYPES[number];
    isSelected: boolean;
    onPress: () => void;
}) => {
    const colors = useTheme();

    return (
        <AppTouchableRipple
            style={[
                styles.filterChip,
                {
                    backgroundColor: isSelected
                        ? colors.themePrimary
                        : colors.backgroundSecondary,
                    borderColor: isSelected ? colors.themePrimary : colors.border,
                },
            ]}
            onPress={onPress}
        >
            <Icon
                name={filter.icon}
                size={16}
                color={isSelected ? colors.white : colors.textLabel}
            />
            <Text
                style={[
                    styles.filterChipText,
                    {
                        color: isSelected ? colors.white : colors.textPrimary,
                    },
                ]}
            >
                {filter.label}
            </Text>
        </AppTouchableRipple>
    );
});

const FilterBar = memo(({
    selectedFilter,
    onFilterChange,
}: {
    selectedFilter: AddressTypeFilter;
    onFilterChange: (filter: AddressTypeFilter) => void;
}) => {
    const colors = useTheme();

    return (
        <View style={[styles.filterContainer, { backgroundColor: colors.backgroundPrimary }]}>
            <View style={styles.filterHeader}>
                <Icon name="filter-variant" size={18} color={colors.textLabel} />
                <Text style={[styles.filterLabel, { color: colors.textLabel }]}>
                    Filter by Type
                </Text>
            </View>
            <View style={styles.filterChipsContainer}>
                {ADDRESS_TYPES.map((filter) => (
                    <FilterChip
                        key={filter.key}
                        filter={filter}
                        isSelected={selectedFilter === filter.key}
                        onPress={() => onFilterChange(filter.key)}
                    />
                ))}
            </View>
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
    const { addresses, selectedAddress, deleteAddress, selectAddress, setDefaultAddress, searchAddressesByType } = useAddress();
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [selectedFilter, setSelectedFilter] = useState<AddressTypeFilter>('all');
    const [filteredAddresses, setFilteredAddresses] = useState<Address[]>(addresses);
    const [isFiltering, setIsFiltering] = useState<boolean>(false);

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

    const handleFilterChange = useCallback(async (filter: AddressTypeFilter) => {
        setSelectedFilter(filter);
        
        if (filter === 'all') {
            setFilteredAddresses(addresses);
            return;
        }

        setIsFiltering(true);
        try {
            const filtered = await searchAddressesByType(filter as 'Home' | 'Work' | 'Other');
            setFilteredAddresses(filtered);
        } catch (error) {
            console.error('Error filtering addresses:', error);
            // Fallback to local filtering
            const localFiltered = addresses.filter(addr => {
                const addrType = addr.addressType.charAt(0).toUpperCase() + addr.addressType.slice(1);
                return addrType === filter;
            });
            setFilteredAddresses(localFiltered);
        } finally {
            setIsFiltering(false);
        }
    }, [addresses, searchAddressesByType]);

    // Update filtered addresses when addresses change
    useEffect(() => {
        if (selectedFilter === 'all') {
            setFilteredAddresses(addresses);
        } else {
            // Re-filter when addresses are updated
            handleFilterChange(selectedFilter);
        }
    }, [addresses, selectedFilter, handleFilterChange]);

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

    const hasNoAddresses = filteredAddresses.length === 0 && !isFiltering;
    const showEmptyState = hasNoAddresses && addresses.length === 0;
    const showFilteredEmpty = hasNoAddresses && addresses.length > 0;

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

                {/* Filter Bar */}
                {addresses.length > 0 && (
                    <FilterBar
                        selectedFilter={selectedFilter}
                        onFilterChange={handleFilterChange}
                    />
                )}

                {/* Loading State */}
                {isFiltering ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.themePrimary} />
                        <Text style={[styles.loadingText, { color: colors.textDescription }]}>
                            Filtering addresses...
                        </Text>
                    </View>
                ) : showEmptyState ? (
                    <EmptyData
                        type={EmptyDataType.NO_RECORDS}
                        title="No Addresses Saved"
                        description="Add your first address to get started with deliveries"
                    />
                ) : showFilteredEmpty ? (
                    <EmptyData
                        type={EmptyDataType.NO_RECORDS}
                        title={`No ${selectedFilter === 'all' ? '' : selectedFilter} Addresses`}
                        description={`You don't have any ${selectedFilter === 'all' ? '' : selectedFilter.toLowerCase()} addresses saved`}
                    />
                ) : (
                    <FlatList
                        data={filteredAddresses}
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
    filterContainer: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.08)',
    },
    filterHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    filterLabel: {
        fontSize: fonts.size.font13,
        fontFamily: fonts.family.primaryMedium,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    filterChipsContainer: {
        flexDirection: 'row',
        gap: 10,
        flexWrap: 'wrap',
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        gap: 6,
    },
    filterChipText: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.primaryMedium,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        marginTop: 12,
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.secondaryRegular,
    },
});