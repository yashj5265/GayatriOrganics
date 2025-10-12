import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Alert,
    Platform,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import AppTextInput from '../../components/AppTextInput';
import { useTheme } from '../../contexts/ThemeProvider';
import fonts from '../../styles/fonts';
import ApiManager from '../../managers/ApiManager';
import constant from '../../utilities/constant';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import AppTouchableRipple from '../../components/AppTouchableRipple';
import MainContainer from '../../container/MainContainer';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
    navigation: NativeStackNavigationProp<any>;
    route: RouteProp<{ params: { mobile: string; token: string } }, 'params'>;
}

interface RegisterResponse {
    success: boolean;
    message?: string;
    token?: string;
    user?: {
        id: number;
        name: string;
        mobile: string;
    };
}

const RegisterScreen: React.FC<Props> = ({ navigation, route }) => {
    const { mobile, token } = route.params;
    const [name, setName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const colors = useTheme();
    const { login } = useAuth();

    const validateEmail = (email: string): boolean => {
        if (!email) return true; // Email is optional
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleRegister = async () => {
        if (!name.trim()) {
            Alert.alert('Validation Error', 'Please enter your name');
            return;
        }

        if (name.trim().length < 3) {
            Alert.alert('Validation Error', 'Name must be at least 3 characters');
            return;
        }

        if (email && !validateEmail(email)) {
            Alert.alert('Validation Error', 'Please enter a valid email address');
            return;
        }

        setLoading(true);

        try {
            console.log('📝 Registering user:', name);

            const response: RegisterResponse = await ApiManager.post({
                endpoint: constant.apiEndPoints.register,
                params: {
                    name: name.trim(),
                    mobile: mobile,
                    email: email.trim() || null,
                },
                token: token,
            });

            console.log('✅ Register Response:', response);

            if (response?.success || response?.token) {
                const newToken = response?.token || token;
                const userData = response?.user || {
                    name: name.trim(),
                    mobile: mobile,
                };

                // Use AuthContext login function
                await login(newToken, userData);

                console.log('✅ Registration successful! Navigation will happen automatically.');

                Alert.alert('Success', response?.message || 'Registration successful!');

            } else {
                console.error('❌ Registration failed:', response?.message);
                Alert.alert(
                    'Registration Failed',
                    response?.message || 'Failed to register. Please try again.'
                );
                setLoading(false);
            }
        } catch (error: any) {
            console.error('❌ Registration error:', error);

            let errorMessage = 'Something went wrong. Please try again.';

            if (error.message === 'No internet connection') {
                errorMessage = 'No internet connection. Please check your network and try again.';
            } else if (error.message) {
                errorMessage = error.message;
            }

            Alert.alert('Error', errorMessage);
            setLoading(false);
        }
    };

    return (
        <MainContainer
            isInternetRequired={true}
            statusBarColor={colors.backgroundPrimary}
            statusBarStyle="dark-content"
            style={{ backgroundColor: colors.backgroundPrimary }}
            showLoader={loading}
        >
            <KeyboardAwareScrollView
                contentContainerStyle={styles.scrollContainer}
                enableOnAndroid
                extraScrollHeight={Platform.OS === 'ios' ? 80 : 100}
                keyboardShouldPersistTaps="handled"
            >
                <View style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}>
                    {/* Header Section */}
                    <View style={styles.headerSection}>
                        <Text style={[styles.title, { color: colors.themePrimary }]}>
                            Complete Your Profile
                        </Text>
                        <Text style={[styles.subtitle, { color: colors.textDescription }]}>
                            Help us serve you better
                        </Text>
                    </View>

                    {/* Mobile Display */}
                    <View
                        style={[
                            styles.mobileCard,
                            { backgroundColor: colors.themePrimaryLight },
                        ]}
                    >
                        <Text style={[styles.mobileLabel, { color: colors.textLabel }]}>
                            Mobile Number
                        </Text>
                        <Text style={[styles.mobileNumber, { color: colors.themePrimary }]}>
                            +91 {mobile}
                        </Text>
                    </View>

                    {/* Input Section */}
                    <View style={styles.inputSection}>
                        <AppTextInput
                            label="Full Name *"
                            placeholder="Enter your full name"
                            onChangeText={setName}
                            value={name}
                            autoCapitalize="words"
                            editable={!loading}
                        />

                        <AppTextInput
                            label="Email (Optional)"
                            placeholder="Enter your email"
                            onChangeText={setEmail}
                            value={email}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            editable={!loading}
                        />
                    </View>

                    {/* Register Button */}
                    <AppTouchableRipple
                        style={[
                            styles.button,
                            {
                                backgroundColor: loading
                                    ? colors.buttonDisabled
                                    : colors.themePrimary,
                            },
                        ]}
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        <Text style={[styles.buttonText, { color: colors.white }]}>
                            {loading ? 'Creating Account...' : 'Complete Registration'}
                        </Text>
                    </AppTouchableRipple>

                    {/* Info Text */}
                    <Text style={[styles.infoText, { color: colors.textLabel }]}>
                        By continuing, you agree to our Terms & Privacy Policy
                    </Text>
                </View>
            </KeyboardAwareScrollView>
        </MainContainer>
    );
};

export default RegisterScreen;

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    headerSection: {
        alignItems: 'center',
        marginBottom: 30,
    },
    title: {
        fontSize: fonts.size.font24,
        fontFamily: fonts.family.primaryBold,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.secondaryRegular,
        textAlign: 'center',
    },
    mobileCard: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        alignItems: 'center',
    },
    mobileLabel: {
        fontSize: fonts.size.font12,
        fontFamily: fonts.family.secondaryRegular,
        marginBottom: 4,
    },
    mobileNumber: {
        fontSize: fonts.size.font18,
        fontFamily: fonts.family.primaryBold,
    },
    inputSection: {
        marginBottom: 24,
        gap: 16,
    },
    button: {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 20,
    },
    buttonText: {
        fontSize: fonts.size.font16,
        fontFamily: fonts.family.primaryBold,
    },
    infoText: {
        fontSize: fonts.size.font12,
        fontFamily: fonts.family.secondaryRegular,
        textAlign: 'center',
        lineHeight: 18,
    },
});