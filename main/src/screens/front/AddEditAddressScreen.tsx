import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import MainContainer from '../../container/MainContainer';
import AppTextInput from '../../components/AppTextInput';
import AppTouchableRipple from '../../components/AppTouchableRipple';
import { useTheme } from '../../contexts/ThemeProvider';
import { useAddress, Address } from '../../contexts/AddressContext';
import fonts from '../../styles/fonts';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface AddEditAddressScreenProps {
    navigation: NativeStackNavigationProp<any>;
    route: RouteProp<{ params: { mode: 'add' | 'edit'; address?: Address } }, 'params'>;
}

interface FormData {
    name: string;
    mobile: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    pincode: string;
    landmark: string;
    addressType: 'home' | 'work' | 'other';
    isDefault: boolean;
}

interface AddressTypeOption {
    value: 'home' | 'work' | 'other';
    label: string;
    icon: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ADDRESS_TYPES: readonly AddressTypeOption[] = [
    { value: 'home', label: 'Home', icon: 'home' },
    { value: 'work', label: 'Work', icon: 'briefcase' },
    { value: 'other', label: 'Other', icon: 'map-marker' },
];

const MOBILE_REGEX = /^[6-9]\d{9}$/;
const PINCODE_REGEX = /^\d{6}$/;

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

const useAddressForm = (mode: 'add' | 'edit', address?: Address) => {
    const [formData, setFormData] = useState<FormData>({
        name: '',
        mobile: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        pincode: '',
        landmark: '',
        addressType: 'home',
        isDefault: false,
    });

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

    const updateField = useCallback((field: keyof FormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    }, [errors]);

    const validateForm = useCallback((): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (!formData.mobile.trim()) {
            newErrors.mobile = 'Mobile number is required';
        } else if (!MOBILE_REGEX.test(formData.mobile)) {
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
        } else if (!PINCODE_REGEX.test(formData.pincode)) {
            newErrors.pincode = 'Please enter a valid 6-digit pincode';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData]);

    return {
        formData,
        errors,
        updateField,
        validateForm,
    };
};

// ============================================================================
// ADDRESS TYPE SELECTOR COMPONENT
// ============================================================================

interface AddressTypeSelectorProps {
    selectedType: 'home' | 'work' | 'other';
    onSelect: (type: 'home' | 'work' | 'other') => void;
}

const AddressTypeSelector: React.FC<AddressTypeSelectorProps> = React.memo(({
    selectedType,
    onSelect,
}) => {
    const colors = useTheme();
    const styles = useMemo(() => createAddressTypeStyles(colors), [colors]);

    return (
        <View style={styles.container}>
            {ADDRESS_TYPES.map((type) => {
                const isSelected = selectedType === type.value;

                return (
                    <AppTouchableRipple
                        key={type.value}
                        style={[
                            styles.button,
                            isSelected && styles.buttonActive,
                        ] as any}
                        onPress={() => onSelect(type.value)}
                    >
                        <View style={[
                            styles.iconContainer,
                            {
                                backgroundColor: isSelected
                                    ? 'rgba(255, 255, 255, 0.2)'
                                    : colors.backgroundSecondary,
                            }
                        ]}>
                            <Icon
                                name={type.icon}
                                size={22}
                                color={isSelected ? colors.white : colors.textLabel}
                            />
                        </View>
                        <Text style={[
                            styles.label,
                            { color: isSelected ? colors.white : colors.textPrimary }
                        ]}>
                            {type.label}
                        </Text>
                    </AppTouchableRipple>
                );
            })}
        </View>
    );
});

// ============================================================================
// FORM SECTION COMPONENT
// ============================================================================

interface FormSectionProps {
    formData: FormData;
    errors: Record<string, string>;
    onFieldChange: (field: keyof FormData, value: string) => void;
}

const FormSection: React.FC<FormSectionProps> = React.memo(({
    formData,
    errors,
    onFieldChange,
}) => {
    const colors = useTheme();
    const styles = useMemo(() => createFormStyles(colors), [colors]);

    return (
        <View style={styles.container}>
            <AppTextInput
                label="Full Name *"
                value={formData.name}
                onChangeText={(text) => onFieldChange('name', text)}
                errorText={errors.name}
                onlyAllowAlphabet
                backgroundColor={colors.backgroundPrimary}
                topLevelBackGroundColor={colors.backgroundSecondary}
            />

            <AppTextInput
                label="Mobile Number *"
                value={formData.mobile}
                onChangeText={(text) => onFieldChange('mobile', text)}
                keyboardType="number-pad"
                errorText={errors.mobile}
                specialCharactersNotAllowed
                backgroundColor={colors.backgroundPrimary}
                topLevelBackGroundColor={colors.backgroundSecondary}
            />

            <AppTextInput
                label="Address Line 1 *"
                value={formData.addressLine1}
                onChangeText={(text) => onFieldChange('addressLine1', text)}
                errorText={errors.addressLine1}
                backgroundColor={colors.backgroundPrimary}
                topLevelBackGroundColor={colors.backgroundSecondary}
            />

            <AppTextInput
                label="Address Line 2 (Optional)"
                value={formData.addressLine2}
                onChangeText={(text) => onFieldChange('addressLine2', text)}
                backgroundColor={colors.backgroundPrimary}
                topLevelBackGroundColor={colors.backgroundSecondary}
            />

            <View style={styles.row}>
                <View style={styles.halfWidth}>
                    <AppTextInput
                        label="City *"
                        value={formData.city}
                        onChangeText={(text) => onFieldChange('city', text)}
                        errorText={errors.city}
                        onlyAllowAlphabet
                        backgroundColor={colors.backgroundPrimary}
                        topLevelBackGroundColor={colors.backgroundSecondary}
                    />
                </View>
                <View style={styles.halfWidth}>
                    <AppTextInput
                        label="State *"
                        value={formData.state}
                        onChangeText={(text) => onFieldChange('state', text)}
                        errorText={errors.state}
                        onlyAllowAlphabet
                        backgroundColor={colors.backgroundPrimary}
                        topLevelBackGroundColor={colors.backgroundSecondary}
                    />
                </View>
            </View>

            <AppTextInput
                label="Pincode *"
                value={formData.pincode}
                onChangeText={(text) => onFieldChange('pincode', text)}
                keyboardType="number-pad"
                errorText={errors.pincode}
                specialCharactersNotAllowed
                backgroundColor={colors.backgroundPrimary}
                topLevelBackGroundColor={colors.backgroundSecondary}
            />

            <AppTextInput
                label="Landmark (Optional)"
                value={formData.landmark}
                onChangeText={(text) => onFieldChange('landmark', text)}
                backgroundColor={colors.backgroundPrimary}
                topLevelBackGroundColor={colors.backgroundSecondary}
            />
        </View>
    );
});

// ============================================================================
// DEFAULT ADDRESS CHECKBOX COMPONENT
// ============================================================================

interface DefaultAddressCheckboxProps {
    isDefault: boolean;
    onToggle: () => void;
}

const DefaultAddressCheckbox: React.FC<DefaultAddressCheckboxProps> = React.memo(({
    isDefault,
    onToggle,
}) => {
    const colors = useTheme();
    const styles = useMemo(() => createCheckboxStyles(colors), [colors]);

    return (
        <AppTouchableRipple style={styles.container} onPress={onToggle}>
            <View style={styles.content}>
                <View style={[
                    styles.checkbox,
                    {
                        backgroundColor: isDefault ? colors.themePrimary : 'transparent',
                        borderColor: isDefault ? colors.themePrimary : colors.border,
                    },
                ]}>
                    {isDefault && <Icon name="check" size={18} color={colors.white} />}
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.label}>Set as default address</Text>
                    <Text style={styles.subtext}>
                        This address will be used for future orders
                    </Text>
                </View>
                <Icon
                    name={isDefault ? "star" : "star-outline"}
                    size={24}
                    color={isDefault ? colors.themePrimary : colors.textLabel}
                />
            </View>
        </AppTouchableRipple>
    );
});

// ============================================================================
// SECTION CARD COMPONENT
// ============================================================================

interface SectionCardProps {
    icon: string;
    title: string;
    children: React.ReactNode;
}

const SectionCard: React.FC<SectionCardProps> = React.memo(({
    icon,
    title,
    children,
}) => {
    const colors = useTheme();
    const styles = useMemo(() => createSectionCardStyles(colors), [colors]);

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <View style={styles.iconContainer}>
                    <Icon name={icon} size={20} color={colors.themePrimary} />
                </View>
                <Text style={styles.title}>{title}</Text>
            </View>
            {children}
        </View>
    );
});

// ============================================================================
// SAVE BUTTON COMPONENT
// ============================================================================

interface SaveButtonProps {
    mode: 'add' | 'edit';
    loading: boolean;
    onPress: () => void;
}

const SaveButton: React.FC<SaveButtonProps> = React.memo(({
    mode,
    loading,
    onPress,
}) => {
    const colors = useTheme();
    const styles = useMemo(() => createSaveButtonStyles(colors), [colors]);

    return (
        <AppTouchableRipple
            style={[styles.button, { opacity: loading ? 0.7 : 1 }] as any}
            onPress={onPress}
            disabled={loading}
        >
            <View style={styles.content}>
                {loading ? (
                    <Text style={styles.text}>Saving...</Text>
                ) : (
                    <>
                        <Icon
                            name={mode === 'add' ? "content-save" : "content-save-edit"}
                            size={20}
                            color={colors.white}
                        />
                        <Text style={styles.text}>
                            {mode === 'add' ? 'Save Address' : 'Update Address'}
                        </Text>
                    </>
                )}
            </View>
        </AppTouchableRipple>
    );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const AddEditAddressScreen: React.FC<AddEditAddressScreenProps> = ({ navigation, route }) => {
    const colors = useTheme();
    const insets = useSafeAreaInsets();
    const { addAddress, updateAddress } = useAddress();

    const { mode, address } = route.params || { mode: 'add' };
    const [loading, setLoading] = useState(false);

    const { formData, errors, updateField, validateForm } = useAddressForm(mode, address);

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

    const styles = useMemo(() => createMainStyles(colors), [colors]);
    const scrollContentStyle = useMemo(() => ({
        ...styles.scrollContent,
        paddingBottom: 32 + insets.bottom,
    }), [styles.scrollContent, insets.bottom]);

    return (
        <MainContainer
            statusBarColor={colors.themePrimary}
            statusBarStyle="light-content"
            isInternetRequired={false}
            showLoader={loading}
        >
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <AppTouchableRipple
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Icon name="arrow-left" size={24} color={colors.white} />
                        </AppTouchableRipple>
                        <Text style={styles.headerTitle}>
                            {mode === 'add' ? 'Add New Address' : 'Edit Address'}
                        </Text>
                        <View style={styles.backButton} />
                    </View>
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={scrollContentStyle}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Address Type Selection */}
                    <SectionCard icon="tag-outline" title="Address Type">
                        <AddressTypeSelector
                            selectedType={formData.addressType}
                            onSelect={(type) => updateField('addressType', type)}
                        />
                    </SectionCard>

                    {/* Form Fields */}
                    <SectionCard icon="map-marker-outline" title="Address Details">
                        <FormSection
                            formData={formData}
                            errors={errors}
                            onFieldChange={updateField}
                        />
                    </SectionCard>

                    {/* Set as Default */}
                    <SectionCard icon="" title="">
                        <DefaultAddressCheckbox
                            isDefault={formData.isDefault}
                            onToggle={() => updateField('isDefault', !formData.isDefault)}
                        />
                    </SectionCard>

                    {/* Save Button */}
                    <SaveButton
                        mode={mode}
                        loading={loading}
                        onPress={handleSave}
                    />
                </ScrollView>
            </View>
        </MainContainer>
    );
};

export default AddEditAddressScreen;

// ============================================================================
// STYLES
// ============================================================================

const createMainStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.backgroundPrimary,
    },
    header: {
        backgroundColor: colors.themePrimary,
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
        color: colors.white,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
});

const createSectionCardStyles = (colors: any) => StyleSheet.create({
    card: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        backgroundColor: colors.backgroundSecondary,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.themePrimary + '15',
    },
    title: {
        fontSize: fonts.size.font18,
        fontFamily: fonts.family.primaryBold,
        color: colors.textPrimary,
    },
});

const createAddressTypeStyles = (colors: any) => StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        paddingHorizontal: 12,
        borderRadius: 16,
        gap: 10,
        borderWidth: 2,
        borderColor: 'transparent',
        backgroundColor: colors.backgroundPrimary,
    },
    buttonActive: {
        backgroundColor: colors.themePrimary,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    label: {
        fontSize: fonts.size.font13,
        fontFamily: fonts.family.primaryMedium,
        textAlign: 'center',
    },
});

const createFormStyles = (colors: any) => StyleSheet.create({
    container: {
        gap: 16,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    halfWidth: {
        flex: 1,
    },
});

const createCheckboxStyles = (colors: any) => StyleSheet.create({
    container: {
        padding: 4,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    checkbox: {
        width: 28,
        height: 28,
        borderRadius: 8,
        borderWidth: 2.5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        flex: 1,
    },
    label: {
        fontSize: fonts.size.font15,
        fontFamily: fonts.family.primaryMedium,
        color: colors.textPrimary,
        marginBottom: 2,
    },
    subtext: {
        fontSize: fonts.size.font12,
        fontFamily: fonts.family.secondaryRegular,
        color: colors.textLabel,
    },
});

const createSaveButtonStyles = (colors: any) => StyleSheet.create({
    button: {
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 8,
        backgroundColor: colors.themePrimary,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    text: {
        fontSize: fonts.size.font17,
        fontFamily: fonts.family.primaryBold,
        color: colors.white,
    },
});