import React, { useState, useEffect, useCallback, memo } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AppTouchableRipple from '../components/AppTouchableRipple';
import { AppColors } from '../styles/colors';
import { UpdateProfileModel, UpdateProfileResponseModel } from '../dataModels/models';
import ApiManager from '../managers/ApiManager';
import StorageManager from '../managers/StorageManager';
import constant from '../utilities/constant';
import fonts from '../styles/fonts';

// ============================================================================
// TYPES
// ============================================================================

export interface EditProfileModalProps {
    visible: boolean;
    colors: AppColors;
    userId: number;
    currentName: string;
    onClose: () => void;
    onSuccess: (updatedName: string) => void;
}

interface ValidationResult {
    isValid: boolean;
    error: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const VALIDATION_RULES = {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
} as const;

const ERROR_MESSAGES = {
    EMPTY: 'Name cannot be empty',
    TOO_SHORT: `Name must be at least ${VALIDATION_RULES.MIN_LENGTH} characters`,
    TOO_LONG: `Name must be less than ${VALIDATION_RULES.MAX_LENGTH} characters`,
    NO_CHANGES: 'You haven\'t made any changes to save.',
    AUTH_REQUIRED: 'Authentication required. Please login again.',
    UPDATE_FAILED: 'Failed to update profile. Please try again.',
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validates name input
 */
const validateNameInput = (value: string): ValidationResult => {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
        return { isValid: false, error: ERROR_MESSAGES.EMPTY };
    }

    if (trimmed.length < VALIDATION_RULES.MIN_LENGTH) {
        return { isValid: false, error: ERROR_MESSAGES.TOO_SHORT };
    }

    if (trimmed.length > VALIDATION_RULES.MAX_LENGTH) {
        return { isValid: false, error: ERROR_MESSAGES.TOO_LONG };
    }

    return { isValid: true, error: '' };
};

/**
 * Parses API response to extract user data and message
 */
const parseApiResponse = (response: any) => {
    const responseData = response?.data || response;
    const updatedUser = responseData?.user || response?.user;
    const message = responseData?.message || response?.message;

    return { updatedUser, message };
};

/**
 * Updates user data in storage
 */
const updateStoredUserData = async (updatedUser: any, fallbackName: string) => {
    if (updatedUser) {
        await StorageManager.setItem(constant.shareInstanceKey.userData, {
            id: updatedUser.id,
            name: updatedUser.name,
            mobile: updatedUser.mobile,
        });
        return updatedUser.name;
    }

    // Fallback: update with trimmed name if user object not available
    const userData = await StorageManager.getItem(constant.shareInstanceKey.userData);
    if (userData) {
        await StorageManager.setItem(constant.shareInstanceKey.userData, {
            ...userData,
            name: fallbackName,
        });
    }
    return fallbackName;
};

// ============================================================================
// COMPONENT
// ============================================================================

const EditProfileModal: React.FC<EditProfileModalProps> = ({
    visible,
    colors,
    userId,
    currentName,
    onClose,
    onSuccess,
}) => {
    const insets = useSafeAreaInsets();

    // ========================================================================
    // STATE
    // ========================================================================

    const [name, setName] = useState<string>(currentName);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [keyboardHeight, setKeyboardHeight] = useState<number>(0);

    // ========================================================================
    // EFFECTS
    // ========================================================================

    useEffect(() => {
        if (visible) {
            setName(currentName);
            setError('');
        }
    }, [visible, currentName]);

    // Keyboard listeners
    useEffect(() => {
        if (!visible) return;

        const keyboardWillShow = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            (e) => {
                setKeyboardHeight(e.endCoordinates.height);
            }
        );

        const keyboardWillHide = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => {
                setKeyboardHeight(0);
            }
        );

        return () => {
            keyboardWillShow.remove();
            keyboardWillHide.remove();
        };
    }, [visible]);

    // ========================================================================
    // VALIDATION
    // ========================================================================

    const validateName = useCallback((value: string): boolean => {
        const result = validateNameInput(value);
        setError(result.error);
        return result.isValid;
    }, []);

    // ========================================================================
    // HANDLERS
    // ========================================================================

    const handleNameChange = useCallback((value: string) => {
        setName(value);
        if (error) {
            validateName(value);
        }
    }, [error, validateName]);

    const handleSave = useCallback(async () => {
        const trimmedName = name.trim();

        // Validate input
        if (!validateName(trimmedName)) {
            return;
        }

        // Check for changes
        if (trimmedName === currentName.trim()) {
            Alert.alert('No Changes', ERROR_MESSAGES.NO_CHANGES);
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Get auth token
            const token = await StorageManager.getItem(constant.shareInstanceKey.authToken);

            if (!token) {
                setError(ERROR_MESSAGES.AUTH_REQUIRED);
                setLoading(false);
                return;
            }

            // Prepare payload
            const payload: UpdateProfileModel = {
                id: userId,
                name: trimmedName,
            };

            // Make API call
            const response = await ApiManager.put<UpdateProfileResponseModel>({
                endpoint: constant.apiEndPoints.updateProfile,
                params: payload,
                token,
                showError: true,
            });

            console.log('response update profile', response);

            // Parse response
            const { updatedUser, message } = parseApiResponse(response);

            if (updatedUser || message) {
                // Update storage
                const finalName = await updateStoredUserData(updatedUser, trimmedName);

                // Success callback
                onSuccess(finalName);

                // Show success message
                Alert.alert('Success', message || 'Profile updated successfully!', [
                    { text: 'OK', onPress: () => { } },
                ]);
            } else {
                setError(ERROR_MESSAGES.UPDATE_FAILED);
            }
        } catch (error: any) {
            console.error('❌ Update Profile Error:', error);
            setError(error?.message || ERROR_MESSAGES.UPDATE_FAILED);
        } finally {
            setLoading(false);
        }
    }, [name, currentName, userId, validateName, onSuccess]);

    const handleClose = useCallback(() => {
        if (loading) return;
        setName(currentName);
        setError('');
        onClose();
    }, [loading, currentName, onClose]);

    // ========================================================================
    // COMPUTED VALUES
    // ========================================================================

    const trimmedName = name.trim();
    const hasChanges = trimmedName !== currentName.trim();
    const isNameValid = trimmedName.length > 0;
    const isSaveDisabled = loading || !hasChanges;

    const inputBorderColor = error
        ? '#FF5252'
        : isNameValid
            ? colors.themePrimary
            : colors.border;

    // ========================================================================
    // RENDER
    // ========================================================================

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
                style={styles.keyboardView}
            >
                <View style={[styles.modalOverlay, { paddingTop: insets.top }]}>
                    <View style={[styles.modalContent, { backgroundColor: colors.backgroundPrimary }]}>
                        {/* Header */}
                        <View style={styles.modalHeader}>
                            <View style={styles.headerLeft}>
                                <View style={[styles.iconContainer, { backgroundColor: colors.themePrimaryLight }]}>
                                    <Icon name="account-edit" size={24} color={colors.themePrimary} />
                                </View>
                                <View style={styles.headerText}>
                                    <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                                        Edit Profile
                                    </Text>
                                    <Text style={[styles.modalSubtitle, { color: colors.textDescription }]}>
                                        Update your name
                                    </Text>
                                </View>
                            </View>
                            <AppTouchableRipple
                                onPress={handleClose}
                                disabled={loading}
                                style={styles.closeButton}
                            >
                                <Icon name="close" size={24} color={colors.textPrimary} />
                            </AppTouchableRipple>
                        </View>

                        {/* Scrollable Form */}
                        <ScrollView
                            style={styles.scrollView}
                            contentContainerStyle={styles.scrollContent}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                        >
                            <View style={styles.formContainer}>
                                <View style={styles.inputContainer}>
                                    <Text style={[styles.label, { color: colors.textLabel }]}>
                                        Full Name
                                    </Text>
                                    <View
                                        style={[
                                            styles.inputWrapper,
                                            {
                                                backgroundColor: colors.backgroundSecondary,
                                                borderColor: inputBorderColor,
                                            },
                                        ]}
                                    >
                                        <Icon
                                            name="account"
                                            size={20}
                                            color={error ? '#FF5252' : colors.textLabel}
                                            style={styles.inputIcon}
                                        />
                                        <TextInput
                                            style={[styles.input, { color: colors.textPrimary }]}
                                            placeholder="Enter your name"
                                            placeholderTextColor={colors.textDescription}
                                            value={name}
                                            onChangeText={handleNameChange}
                                            editable={!loading}
                                            autoCapitalize="words"
                                            autoCorrect={false}
                                            maxLength={VALIDATION_RULES.MAX_LENGTH}
                                        />
                                        {isNameValid && (
                                            <AppTouchableRipple
                                                onPress={() => setName('')}
                                                disabled={loading}
                                            >
                                                <Icon name="close-circle" size={20} color={colors.textDescription} />
                                            </AppTouchableRipple>
                                        )}
                                    </View>
                                    {error ? (
                                        <View style={styles.errorContainer}>
                                            <Icon name="alert-circle" size={14} color="#FF5252" />
                                            <Text style={styles.errorText}>{error}</Text>
                                        </View>
                                    ) : (
                                        <Text style={[styles.hint, { color: colors.textDescription }]}>
                                            {trimmedName.length}/{VALIDATION_RULES.MAX_LENGTH} characters
                                        </Text>
                                    )}
                                </View>

                                {/* Info Card */}
                                <View style={[styles.infoCard, { backgroundColor: colors.themePrimaryLight }]}>
                                    <Icon name="information" size={20} color={colors.themePrimary} />
                                    <Text style={[styles.infoText, { color: colors.themePrimary }]}>
                                        Your name will be visible to others and used for order confirmations.
                                    </Text>
                                </View>
                            </View>
                        </ScrollView>

                        {/* Actions - Fixed above keyboard */}
                        <View style={[
                            styles.modalActions,
                            {
                                paddingBottom: keyboardHeight > 0 ? 16 : insets.bottom + 16,
                            }
                        ]}>
                            <AppTouchableRipple
                                style={[
                                    styles.cancelButton,
                                    {
                                        backgroundColor: colors.backgroundSecondary,
                                        opacity: loading ? 0.5 : 1,
                                    },
                                ]}
                                onPress={handleClose}
                                disabled={loading}
                            >
                                <Text style={[styles.cancelButtonText, { color: colors.textPrimary }]}>
                                    Cancel
                                </Text>
                            </AppTouchableRipple>

                            <AppTouchableRipple
                                style={[
                                    styles.saveButton,
                                    {
                                        backgroundColor: isSaveDisabled
                                            ? colors.buttonDisabled
                                            : colors.themePrimary,
                                        opacity: isSaveDisabled ? 0.6 : 1,
                                    },
                                ]}
                                onPress={handleSave}
                                disabled={isSaveDisabled}
                            >
                                {loading ? (
                                    <ActivityIndicator size="small" color={colors.white} />
                                ) : (
                                    <>
                                        <Icon name="check" size={20} color={colors.white} />
                                        <Text style={[styles.saveButtonText, { color: colors.white }]}>
                                            Save Changes
                                        </Text>
                                    </>
                                )}
                            </AppTouchableRipple>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

export default memo(EditProfileModal);

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
    keyboardView: {
        flex: 1,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 0,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.08)',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    headerText: {
        flex: 1,
    },
    modalTitle: {
        fontSize: fonts.size.font20,
        fontFamily: fonts.family.primaryBold,
        marginBottom: 2,
    },
    modalSubtitle: {
        fontSize: fonts.size.font13,
        fontFamily: fonts.family.secondaryRegular,
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    formContainer: {
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 16,
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.primaryMedium,
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1.5,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: fonts.size.font16,
        fontFamily: fonts.family.primaryRegular,
        padding: 0,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 6,
    },
    errorText: {
        fontSize: fonts.size.font12,
        fontFamily: fonts.family.secondaryRegular,
        color: '#FF5252',
    },
    hint: {
        fontSize: fonts.size.font12,
        fontFamily: fonts.family.secondaryRegular,
        marginTop: 8,
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
        borderRadius: 12,
        gap: 12,
        marginBottom: 0,
    },
    infoText: {
        flex: 1,
        fontSize: fonts.size.font13,
        fontFamily: fonts.family.secondaryRegular,
        lineHeight: 18,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.08)',
        backgroundColor: 'transparent',
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        fontSize: fonts.size.font15,
        fontFamily: fonts.family.primaryMedium,
    },
    saveButton: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    saveButtonText: {
        fontSize: fonts.size.font15,
        fontFamily: fonts.family.primaryBold,
    },
});