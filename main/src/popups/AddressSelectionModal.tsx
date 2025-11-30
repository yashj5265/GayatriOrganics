import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AppTouchableRipple from '../components/AppTouchableRipple';
import { AppColors } from '../styles/colors';
import { Address } from '../contexts/AddressContext';
import fonts from '../styles/fonts';

export interface AddressSelectionModalProps {
    visible: boolean;
    addresses: Address[];
    selectedAddress: Address | null;
    colors: AppColors;
    onSelectAddress: (address: Address) => void;
    onManageAddresses: () => void;
    onClose: () => void;
}

const getAddressTypeIcon = (type: string): string => {
    switch (type) {
        case 'home':
            return 'home';
        case 'work':
            return 'briefcase';
        default:
            return 'map-marker';
    }
};

const AddressSelectionModal: React.FC<AddressSelectionModalProps> = ({
    visible,
    addresses,
    selectedAddress,
    colors,
    onSelectAddress,
    onManageAddresses,
    onClose,
}) => {
    const insets = useSafeAreaInsets();

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={[styles.modalOverlay, { paddingTop: insets.top }]}>
                <View style={[styles.modalContent, { backgroundColor: colors.backgroundPrimary }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                            Select Address
                        </Text>
                        <AppTouchableRipple onPress={onClose}>
                            <Icon name="close" size={24} color={colors.textPrimary} />
                        </AppTouchableRipple>
                    </View>

                    <ScrollView
                        style={styles.modalScrollView}
                        showsVerticalScrollIndicator={false}
                    >
                        {addresses.map((address) => (
                            <AppTouchableRipple
                                key={address.id}
                                style={{
                                    ...styles.addressOption,
                                    backgroundColor:
                                        selectedAddress?.id === address.id
                                            ? colors.themePrimaryLight
                                            : colors.backgroundSecondary,
                                    borderColor:
                                        selectedAddress?.id === address.id
                                            ? colors.themePrimary
                                            : colors.border,
                                }}
                                onPress={() => onSelectAddress(address)}
                            >
                                <View style={styles.addressOptionHeader}>
                                    <View style={styles.addressOptionLeft}>
                                        <Icon
                                            name={getAddressTypeIcon(address.addressType)}
                                            size={20}
                                            color={
                                                selectedAddress?.id === address.id
                                                    ? colors.themePrimary
                                                    : colors.textLabel
                                            }
                                        />
                                        <View style={styles.addressOptionInfo}>
                                            <Text
                                                style={[
                                                    styles.addressOptionType,
                                                    {
                                                        color:
                                                            selectedAddress?.id === address.id
                                                                ? colors.themePrimary
                                                                : colors.textPrimary,
                                                    },
                                                ]}
                                            >
                                                {address.addressType === 'home'
                                                    ? 'Home'
                                                    : address.addressType === 'work'
                                                        ? 'Work'
                                                        : 'Other'}
                                                {address.isDefault && ' • Default'}
                                            </Text>
                                            <Text
                                                style={[
                                                    styles.addressOptionText,
                                                    {
                                                        color:
                                                            selectedAddress?.id === address.id
                                                                ? colors.textPrimary
                                                                : colors.textDescription,
                                                    },
                                                ]}
                                                numberOfLines={2}
                                            >
                                                {address.addressLine1}, {address.city}
                                            </Text>
                                        </View>
                                    </View>
                                    {selectedAddress?.id === address.id && (
                                        <Icon
                                            name="check-circle"
                                            size={24}
                                            color={colors.themePrimary}
                                        />
                                    )}
                                </View>
                            </AppTouchableRipple>
                        ))}
                    </ScrollView>

                    <View style={styles.modalActions}>
                        <AppTouchableRipple
                            style={{ ...styles.modalButton, backgroundColor: colors.backgroundSecondary }}
                            onPress={onManageAddresses}
                        >
                            <Icon name="map-marker-plus" size={20} color={colors.themePrimary} />
                            <Text style={[styles.modalButtonText, { color: colors.themePrimary }]}>
                                Manage Addresses
                            </Text>
                        </AppTouchableRipple>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default AddressSelectionModal;

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
        paddingBottom: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    modalTitle: {
        fontSize: fonts.size.font20,
        fontFamily: fonts.family.primaryBold,
    },
    modalScrollView: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    addressOption: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
    },
    addressOptionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    addressOptionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    addressOptionInfo: {
        marginLeft: 12,
        flex: 1,
    },
    addressOptionType: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.primaryMedium,
        marginBottom: 4,
    },
    addressOptionText: {
        fontSize: fonts.size.font13,
        fontFamily: fonts.family.secondaryRegular,
    },
    modalActions: {
        paddingHorizontal: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.1)',
    },
    modalButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    modalButtonText: {
        fontSize: fonts.size.font15,
        fontFamily: fonts.family.primaryMedium,
    },
});

