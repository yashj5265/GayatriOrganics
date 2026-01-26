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
import AppTouchableRipple from '../../components/AppTouchableRipple';
import MainContainer from '../../container/MainContainer';

interface Props {
    navigation: NativeStackNavigationProp<any>;
}

interface SendOTPResponse {
    success: boolean;
    message?: string;
    mobile?: string;
    otp?: number;
    expires_in?: string;
}

const SendOTPScreen: React.FC<Props> = ({ navigation }) => {
    const [mobile, setMobile] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const colors = useTheme();

    const validateMobile = (mobile: string): boolean => {
        // Indian mobile number validation (10 digits)
        const mobileRegex = /^[6-9]\d{9}$/;
        return mobileRegex.test(mobile);
    };

    const handleSendOTP = async () => {
        if (!mobile) {
            Alert.alert('Validation Error', 'Please enter your mobile number');
            return;
        }

        if (!validateMobile(mobile)) {
            Alert.alert('Validation Error', 'Please enter a valid 10-digit mobile number');
            return;
        }

        setLoading(true);

        try {
            const response: SendOTPResponse = await ApiManager.post({
                endpoint: constant.apiEndPoints.sendOTP,
                params: {
                    mobile: mobile.trim(),
                },
            });

            // Check if response has message (indicating success)
            if (response?.message) {
                Alert.alert(
                    'Success',
                    `${response.message}${response.otp ? `\n\nDemo OTP: ${response.otp}` : ''}`,
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                navigation.navigate(constant.routeName.verifyOTPScreen, {
                                    mobile: mobile,
                                    demoOTP: response.otp || null,
                                });
                            }
                        }
                    ]
                );
                setLoading(false);
            } else {
                console.error('❌ Send OTP failed: No message in response');
                Alert.alert(
                    'Error',
                    'Failed to send OTP. Please try again.'
                );
                setLoading(false);
            }
        } catch (error: any) {
            console.error('❌ Send OTP error:', error);

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

    // const handleSendOTP = () => {
    //     if (!mobile) {
    //         Alert.alert('Validation Error', 'Please enter your mobile number');
    //         return;
    //     }

    //     if (!validateMobile(mobile)) {
    //         Alert.alert('Validation Error', 'Please enter a valid 10-digit mobile number');
    //         return;
    //     }

    //     setLoading(true);

    //     ApiManager.post({
    //         endpoint: constant.apiEndPoints.sendOTP,
    //         params: {
    //             mobile: mobile.trim(),
    //         }
    //     })
    //         .then((response: SendOTPResponse) => {
    //             if (response?.success) {
    //                 Alert.alert(
    //                     'Success',
    //                     `OTP sent successfully to ${mobile}${response.otp ? `\n\nDemo OTP: ${response.otp}` : ''}`,
    //                     [
    //                         {
    //                             text: 'OK',
    //                             onPress: () => {
    //                                 navigation.navigate(constant.routeName.verifyOTPScreen, {
    //                                     mobile: mobile,
    //                                     demoOTP: response.otp || null,
    //                                 });
    //                             }
    //                         }
    //                     ]
    //                 );
    //             } else {
    //                 console.error('❌ Send OTP failed:', response?.message);
    //                 Alert.alert(
    //                     'Error',
    //                     response?.message || 'Failed to send OTP. Please try again.'
    //                 );
    //             }
    //         })
    //         .catch((error: any) => {
    //             console.error('❌ Send OTP error:', error);

    //             let errorMessage = 'Something went wrong. Please try again.';

    //             if (error.message === 'No internet connection') {
    //                 errorMessage = 'No internet connection. Please check your network and try again.';
    //             } else if (error.message) {
    //                 errorMessage = error.message;
    //             }

    //             Alert.alert('Error', errorMessage);
    //         })
    //         .finally(() => {
    //             setLoading(false);
    //         });
    // };

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
                    {/* Logo/Header Section */}
                    <View style={styles.headerSection}>
                        <Text style={[styles.title, { color: colors.themePrimary }]}>
                            Welcome to
                        </Text>
                        <Text style={[styles.appName, { color: colors.themePrimary, textAlign: 'center' }]}>
                            Gayatri Organic Farm 🌿
                        </Text>
                        <Text style={[styles.subtitle, { color: colors.textDescription }]}>
                            Enter your mobile number to continue
                        </Text>
                    </View>

                    {/* Input Section */}
                    <View style={styles.inputSection}>
                        <AppTextInput
                            label="Mobile Number"
                            placeholder="Enter 10-digit mobile number"
                            onChangeText={(text) => {
                                // Only allow numbers and limit to 10 digits
                                const cleaned = text.replace(/[^0-9]/g, '');
                                setMobile(cleaned.slice(0, 10));
                            }}
                            value={mobile}
                            keyboardType="phone-pad"
                            maxLength={10}
                            editable={!loading}
                        />
                    </View>

                    {/* Button */}
                    <AppTouchableRipple
                        style={[
                            styles.button,
                            {
                                backgroundColor: loading
                                    ? colors.buttonDisabled
                                    : colors.themePrimary,
                            },
                        ]}
                        onPress={handleSendOTP}
                        disabled={loading}
                    >
                        <Text style={[styles.buttonText, { color: colors.white }]}>
                            {loading ? 'Sending OTP...' : 'Send OTP'}
                        </Text>
                    </AppTouchableRipple>

                    {/* Info Text */}
                    <Text style={[styles.infoText, { color: colors.textLabel }]}>
                        You will receive a One-Time Password (OTP) on your mobile number
                    </Text>
                </View>
            </KeyboardAwareScrollView>
        </MainContainer>
    );
};

export default SendOTPScreen;

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
        fontSize: fonts.size.font18,
        fontFamily: fonts.family.secondaryRegular,
        marginBottom: 8,
    },
    appName: {
        fontSize: fonts.size.font28,
        fontFamily: fonts.family.primaryBold,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: fonts.size.font14,
        fontFamily: fonts.family.secondaryRegular,
        textAlign: 'center',
    },
    inputSection: {
        marginBottom: 24,
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