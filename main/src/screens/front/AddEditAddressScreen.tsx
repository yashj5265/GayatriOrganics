import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MainContainer from '../../container/MainContainer';
import { useTheme } from '../../contexts/ThemeProvider';
import { useAddress, Address } from '../../contexts/AddressContext';
import fonts from '../../styles/fonts';
import AppTextInput from '../../components/AppTextInput';
import AppTouchableRipple from '../../components/AppTouchableRipple';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AddEditAddressScreenProps {
    navigation: NativeStackNavigationProp<any>;
    route: RouteProp<{ params: { mode: 'add' | 'edit'; address?: Address } }, 'params'>;
}

const AddEditAddressScreen: React.FC<AddEditAddressScreenProps> = ({ navigation, route }) => {
    const colors = useTheme();
    const insets = useSafeAreaInsets();
    const { addAddress, updateAddress } = useAddress();
    const { mode, address } = route.params || { mode: 'add' };

    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        pincode: '',
        landmark: '',
        addressType: 'home' as 'home' | 'work' | 'other',
        isDefault: false,
    });

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (mode === 'edit' && address) {
            setFormData({
                name: address.name,
                mobile: address.mobile,
                addressLine1: address.addressLine1,
                addressLine2: address.addressLine2 || '',
                city: address.city,
                state: address.state,
                pincode: address.pincode,
                landmark: address.landmark || '',
                addressType: address.addressType,
                isDefault: address.isDefault,
            });
        }
    }, [mode, address]);

    const validateForm = useCallback(() => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (!formData.mobile.trim()) {
            newErrors.mobile = 'Mobile number is required';
        } else if (!/^[6-9]\d{9}$/.test(formData.mobile)) {
            newErrors.mobile = 'Please enter a valid 10-digit mobile number';
        }

        if (!formData.addressLine1.trim()) {
            newErrors.addressLine1 = 'Address line 1 is required';
        }

        if (!formData.city.trim()) {
            newErrors.city = 'City is required';
        }

        if (!formData.state.trim()) {
            newErrors.state = 'State is required';
        }

        if (!formData.pincode.trim()) {
            newErrors.pincode = 'Pincode is required';
        } else if (!/^\d{6}$/.test(formData.pincode)) {
            newErrors.pincode = 'Please enter a valid 6-digit pincode';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData]);

    const handleSave = useCallback(async () => {
        if (!validateForm()) {
            Alert.alert('Validation Error', 'Please fill all required fields correctly');
            return;
        }

        setLoading(true);
        try {
            if (mode === 'add') {
                await addAddress(formData);
                Alert.alert('Success', 'Address added successfully', [
                    { text: 'OK', onPress: () => navigation.goBack() },
                ]);
            } else if (mode === 'edit' && address) {
                await updateAddress(address.id, formData);
                Alert.alert('Success', 'Address updated successfully', [
                    { text: 'OK', onPress: () => navigation.goBack() },
                ]);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to save address. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [formData, mode, address, addAddress, updateAddress, navigation, validateForm]);

    const addressTypes = [
        { value: 'home', label: 'Home', icon: 'home' },
        { value: 'work', label: 'Work', icon: 'briefcase' },
        { value: 'other', label: 'Other', icon: 'map-marker' },
    ] as const;

    const scrollContentStyle = useMemo(() => ({
        paddingBottom: 32 + insets.bottom,
    }), [insets.bottom]);

    return (
        <MainContainer
            statusBarColor={colors.themePrimary}
            statusBarStyle="light-content"
            isInternetRequired={false}
            showLoader={loading}
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
                            {mode === 'add' ? 'Add New Address' : 'Edit Address'}
                        </Text>
                        <View style={styles.backButton} />
                    </View>
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={[styles.scrollContent, scrollContentStyle]}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Address Type Selection */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                            Address Type
                        </Text>
                        <View style={styles.addressTypeContainer}>
                            {addressTypes.map((type) => (
                                <AppTouchableRipple
                                    key={type.value}
                                    style={[
                                        styles.addressTypeButton,
                                        {
                                            backgroundColor:
                                                formData.addressType === type.value
                                                    ? colors.themePrimary
                                                    : colors.backgroundSecondary,
                                        },
                                    ]}
                                    onPress={() => setFormData({ ...formData, addressType: type.value })}
                                >
                                    <Icon
                                        name={type.icon}
                                        size={24}
                                        color={
                                            formData.addressType === type.value
                                                ? colors.white
                                                : colors.textLabel
                                        }
                                    />
                                    <Text
                                        style={[
                                            styles.addressTypeLabel,
                                            {
                                                color:
                                                    formData.addressType === type.value
                                                        ? colors.white
                                                        : colors.textPrimary,
                                            },
                                        ]}
                                    >
                                        {type.label}
                                    </Text>
                                </AppTouchableRipple>
                            ))}
                        </View>
                    </View>

                    {/* Form Fields */}
                    <View style={styles.section}>
                        <AppTextInput
                            label="Full Name *"
                            value={formData.name}
                            onChangeText={(text) => setFormData({ ...formData, name: text })}
                            errorText={errors.name}
                            onlyAllowAlphabet={true}
                            backgroundColor={colors.backgroundSecondary}
                            topLevelBackGroundColor={colors.backgroundPrimary}
                        />

                        <AppTextInput
                            label="Mobile Number *"
                            value={formData.mobile}
                            onChangeText={(text) => setFormData({ ...formData, mobile: text })}
                            keyboardType="number-pad"
                            errorText={errors.mobile}
                            specialCharactersNotAllowed={true}
                            backgroundColor={colors.backgroundSecondary}
                            topLevelBackGroundColor={colors.backgroundPrimary}
                        />

                        <AppTextInput
                            label="Address Line 1 *"
                            value={formData.addressLine1}
                            onChangeText={(text) => setFormData({ ...formData, addressLine1: text })}
                            errorText={errors.addressLine1}
                            backgroundColor={colors.backgroundSecondary}
                            topLevelBackGroundColor={colors.backgroundPrimary}
                        />

                        <AppTextInput
                            label="Address Line 2 (Optional)"
                            value={formData.addressLine2}
                            onChangeText={(text) => setFormData({ ...formData, addressLine2: text })}
                            backgroundColor={colors.backgroundSecondary}
                            topLevelBackGroundColor={colors.backgroundPrimary}
                        />

                        <View style={styles.row}>
                            <View style={styles.halfWidth}>
                                <AppTextInput
                                    label="City *"
                                    value={formData.city}
                                    onChangeText={(text) => setFormData({ ...formData, city: text })}
                                    errorText={errors.city}
                                    onlyAllowAlphabet={true}
                                    backgroundColor={colors.backgroundSecondary}
                                    topLevelBackGroundColor={colors.backgroundPrimary}
                                />
                            </View>
                            <View style={styles.halfWidth}>
                                <AppTextInput
                                    label="State *"
                                    value={formData.state}
                                    onChangeText={(text) => setFormData({ ...formData, state: text })}
                                    errorText={errors.state}
                                    onlyAllowAlphabet={true}
                                    backgroundColor={colors.backgroundSecondary}
                                    topLevelBackGroundColor={colors.backgroundPrimary}
                                />
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={styles.halfWidth}>
                                <AppTextInput
                                    label="Pincode *"
                                    value={formData.pincode}
                                    onChangeText={(text) => setFormData({ ...formData, pincode: text })}
                                    keyboardType="number-pad"
                                    errorText={errors.pincode}
                                    specialCharactersNotAllowed={true}
                                    backgroundColor={colors.backgroundSecondary}
                                    topLevelBackGroundColor={colors.backgroundPrimary}
                                />
                            </View>
                            <View style={styles.halfWidth}>
                                <AppTextInput
                                    label="Landmark (Optional)"
                                    value={formData.landmark}
                                    onChangeText={(text) => setFormData({ ...formData, landmark: text })}
                                    backgroundColor={colors.backgroundSecondary}
                                    topLevelBackGroundColor={colors.backgroundPrimary}
                                />
                            </View>
                        </View>

                        {/* Set as Default */}
                        <AppTouchableRipple
                            style={[
                                styles.defaultCheckbox,
                                { backgroundColor: colors.backgroundSecondary },
                            ]}
                            onPress={() => setFormData({ ...formData, isDefault: !formData.isDefault })}
                        >
                            <View
                                style={[
                                    styles.checkbox,
                                    {
                                        backgroundColor: formData.isDefault
                                            ? colors.themePrimary
                                            : 'transparent',
                                        borderColor: formData.isDefault
                                            ? colors.themePrimary
                                            : colors.border,
                                    },
                                ]}
                            >
                                {formData.isDefault && (
                                    <Icon name="check" size={16} color={colors.white} />
                                )}
                            </View>
                            <Text style={[styles.checkboxLabel, { color: colors.textPrimary }]}>
                                Set as default address
                            </Text>
                        </AppTouchableRipple>
                    </View>

                    {/* Save Button */}
                    <AppTouchableRipple
                        style={[styles.saveButton, { backgroundColor: colors.themePrimary }]}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        <Text style={[styles.saveButtonText, { color: colors.white }]}>
                            {loading ? 'Saving...' : mode === 'add' ? 'Save Address' : 'Update Address'}
                        </Text>
                    </AppTouchableRipple>
                </ScrollView>
            </View>
        </MainContainer>
    );
};

export default AddEditAddressScreen;

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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: fonts.size.font16,
        fontFamily: fonts.family.primaryBold,
        marginBottom: 12,
    },
    addressTypeContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    addressTypeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    addressTypeLabel: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.primaryMedium,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    halfWidth: {
        flex: 1,
    },
    defaultCheckbox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 12,
        marginTop: 8,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxLabel: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.primaryMedium,
    },
    saveButton: {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    saveButtonText: {
        fontSize: fonts.size.font16,
        fontFamily: fonts.family.primaryBold,
    },
});

