import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Alert,
    Platform,
    TouchableOpacity,
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
    route: RouteProp<{ params: { mobile: string; demoOTP?: number } }, 'params'>;
}

interface VerifyOTPResponse {
    success: boolean;
    message?: string;
    token?: string;
    user?: {
        id: number;
        name: string;
        mobile: string;
    };
}

const VerifyOTPScreen: React.FC<Props> = ({ navigation, route }) => {
    const { mobile, demoOTP } = route.params;
    const [otp, setOtp] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [timer, setTimer] = useState<number>(300); // 5 minutes in seconds
    const [canResend, setCanResend] = useState<boolean>(false);
    const colors = useTheme();
    const { login } = useAuth();

    useEffect(() => {
        const interval = setInterval(() => {
            setTimer((prev) => {
                if (prev <= 1) {
                    setCanResend(true);
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleVerifyOTP = async () => {
        if (!otp || otp.length !== 4) {
            Alert.alert('Validation Error', 'Please enter 4-digit OTP');
            return;
        }

        setLoading(true);

        try {
            console.log('🔐 Verifying OTP for:', mobile);

            const response: VerifyOTPResponse = await ApiManager.post({
                endpoint: constant.apiEndPoints.verifyOTP,
                params: {
                    mobile: mobile,
                    otp: parseInt(otp),
                },
            });

            console.log('✅ Verify OTP Response:', response);

            if (response?.success || response?.token) {
                const token = response?.token;

                if (!token) {
                    Alert.alert('Error', 'Login failed: No authentication token received');
                    setLoading(false);
                    return;
                }

                const userData = response?.user;

                // Use AuthContext login function
                await login(token, userData);

                console.log('✅ Login successful! Navigation will happen automatically.');

                Alert.alert('Success', response?.message || 'Login successful!');

            } else {
                console.error('❌ Verify OTP failed:', response?.message);
                Alert.alert(
                    'Verification Failed',
                    response?.message || 'Invalid OTP. Please check and try again.'
                );
                setLoading(false);
            }
        } catch (error: any) {
            console.error('❌ Verify OTP error:', error);

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

    const handleResendOTP = async () => {
        setLoading(true);
        setCanResend(false);
        setTimer(300);

        try {
            const response = await ApiManager.post({
                endpoint: constant.apiEndPoints.sendOTP,
                params: {
                    mobile: mobile,
                },
            });

            if (response?.success) {
                Alert.alert(
                    'Success',
                    `OTP resent successfully${response.otp ? `\n\nDemo OTP: ${response.otp}` : ''}`
                );
            }
            setLoading(false);
        } catch (error) {
            console.error('Resend OTP error:', error);
            Alert.alert('Error', 'Failed to resend OTP. Please try again.');
            setLoading(false);
            setCanResend(true);
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
                            Verify OTP
                        </Text>
                        <Text style={[styles.subtitle, { color: colors.textDescription }]}>
                            Enter the 4-digit code sent to
                        </Text>
                        <Text style={[styles.mobileNumber, { color: colors.textPrimary }]}>
                            +91 {mobile}
                        </Text>
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={styles.changeNumber}
                        >
                            <Text style={[styles.changeNumberText, { color: colors.themePrimary }]}>
                                Change Number
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* OTP Input Section */}
                    <View style={styles.inputSection}>
                        <AppTextInput
                            label="Enter OTP"
                            placeholder="Enter 4-digit OTP"
                            onChangeText={(text) => {
                                const cleaned = text.replace(/[^0-9]/g, '');
                                setOtp(cleaned.slice(0, 4));
                            }}
                            value={otp}
                            keyboardType="number-pad"
                            maxLength={4}
                            editable={!loading}
                        />

                        {/* Timer & Resend */}
                        <View style={styles.timerContainer}>
                            {!canResend ? (
                                <Text style={[styles.timerText, { color: colors.textLabel }]}>
                                    Resend OTP in {formatTime(timer)}
                                </Text>
                            ) : (
                                <TouchableOpacity
                                    onPress={handleResendOTP}
                                    disabled={loading}
                                >
                                    <Text style={[styles.resendText, { color: colors.themePrimary }]}>
                                        Resend OTP
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Demo OTP Display (for testing) */}
                    {demoOTP && (
                        <View style={[styles.demoOTPContainer, { backgroundColor: colors.themePrimaryLight }]}>
                            <Text style={[styles.demoOTPLabel, { color: colors.textLabel }]}>
                                Demo OTP (for testing):
                            </Text>
                            <Text style={[styles.demoOTPValue, { color: colors.themePrimary }]}>
                                {demoOTP}
                            </Text>
                        </View>
                    )}

                    {/* Verify Button */}
                    <AppTouchableRipple
                        style={[
                            styles.button,
                            {
                                backgroundColor: loading
                                    ? colors.buttonDisabled
                                    : colors.themePrimary,
                            },
                        ]}
                        onPress={handleVerifyOTP}
                        disabled={loading}
                    >
                        <Text style={[styles.buttonText, { color: colors.white }]}>
                            {loading ? 'Verifying...' : 'Verify & Continue'}
                        </Text>
                    </AppTouchableRipple>

                    {/* Info Text */}
                    <Text style={[styles.infoText, { color: colors.textLabel }]}>
                        Please enter the OTP sent to your mobile number
                    </Text>
                </View>
            </KeyboardAwareScrollView>
        </MainContainer>
    );
};

export default VerifyOTPScreen;

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
        marginBottom: 40,
    },
    title: {
        fontSize: fonts.size.font28,
        fontFamily: fonts.family.primaryBold,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.secondaryRegular,
        textAlign: 'center',
        marginBottom: 4,
    },
    mobileNumber: {
        fontSize: fonts.size.font18,
        fontFamily: fonts.family.primaryBold,
        marginBottom: 8,
    },
    changeNumber: {
        padding: 4,
    },
    changeNumberText: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.primaryMedium,
    },
    inputSection: {
        marginBottom: 24,
    },
    timerContainer: {
        alignItems: 'center',
        marginTop: 12,
    },
    timerText: {
        fontSize: fonts.size.font13,
        fontFamily: fonts.family.secondaryRegular,
    },
    resendText: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.primaryBold,
    },
    demoOTPContainer: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
        alignItems: 'center',
    },
    demoOTPLabel: {
        fontSize: fonts.size.font12,
        fontFamily: fonts.family.secondaryRegular,
        marginBottom: 4,
    },
    demoOTPValue: {
        fontSize: fonts.size.font24,
        fontFamily: fonts.family.primaryBold,
        letterSpacing: 4,
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