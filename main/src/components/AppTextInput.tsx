import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    TextInput,
    View,
    Animated,
    StyleSheet,
    TouchableWithoutFeedback,
    TouchableOpacity,
    TextStyle,
    Text,
    Image,
    Platform,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../contexts/ThemeProvider';
import { NumberUtils } from '../utilities/NumberUtils';
import fonts from '../styles/fonts';

interface AppTextInputProps extends React.ComponentProps<typeof TextInput> {
    label: string;
    formatting?: 'none' | 'number' | 'currency';
    errorText?: string;
    leftIconName?: 'driver' | 'party' | 'supplier';
    showCrossButton?: boolean;
    backgroundColor?: string;
    topLevelBackGroundColor?: string;
    specialCharactersNotAllowed?: boolean;
    showContactIcon?: boolean;
    onContact?: () => void;
    onlyAllowAlphabet?: boolean;
    isPancard?: boolean;
}

const AppTextInput: React.FC<AppTextInputProps> = ({
    formatting = 'none',
    keyboardType = 'default',
    label,
    value,
    secureTextEntry,
    onFocus,
    onBlur,
    onChangeText,
    onContact,
    errorText,
    leftIconName,
    showCrossButton = true,
    backgroundColor,
    topLevelBackGroundColor,
    specialCharactersNotAllowed = false,
    showContactIcon = false,
    onlyAllowAlphabet = false,
    isPancard = false,
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const colors = useTheme();
    const styles = useMemo(() => getStyles(colors), [colors]);
    const inputRef = useRef<TextInput>(null);

    // Initialize animation based on whether there's a value
    const animatedLabel = useRef(new Animated.Value(value ? 1 : 0)).current;

    const [rawValue, setRawValue] = useState(value || '');
    const [formattedDisplayValue, setFormattedDisplayValue] = useState(value || '');

    const imageSource = useMemo(
        () => ({
            driver: require('../../resources/Images/dropDown/driver.png'),
            party: require('../../resources/Images/dropDown/driver.png'),
            supplier: require('../../resources/Images/dropDown/driver.png'),
        }),
        []
    );

    // Animate label when focus changes or value changes
    useEffect(() => {
        Animated.timing(animatedLabel, {
            toValue: isFocused || (value && value.length > 0) ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, [isFocused, value, animatedLabel]);

    // Sync external value changes
    useEffect(() => {
        if (value !== undefined && value !== rawValue) {
            let formattedValue = value;
            if (formatting === 'currency') {
                formattedValue = NumberUtils.formatNumber(value);
            }
            setRawValue(value);
            setFormattedDisplayValue(formattedValue);
        }
    }, [value, rawValue, formatting]);

    const inputStyle: TextStyle = {
        height: 50,
        borderWidth: 1.5,
        borderColor: errorText
            ? colors.inputErrorText
            : isFocused
                ? colors.themePrimary
                : colors.border,
        borderRadius: 8,
        paddingHorizontal: 13,
        paddingRight: secureTextEntry ? 80 : 50,
        color: colors.textInputText,
        fontSize: fonts.size.font16,
        fontFamily: fonts.family.primaryRegular,
        paddingTop: Platform.OS === 'ios' ? 16 : 16,
        paddingBottom: Platform.OS === 'ios' ? 8 : 8,
        backgroundColor: backgroundColor || colors.textInputBackground,
    };

    const handleFocus = useCallback(
        (e: any) => {
            setIsFocused(true);
            onFocus?.(e);
        },
        [onFocus]
    );

    const handleBlur = useCallback(
        (e: any) => {
            setIsFocused(false);
            onBlur?.(e);
        },
        [onBlur]
    );

    const handleLabelPress = useCallback(() => {
        inputRef.current?.focus();
    }, []);

    const handleClearText = useCallback(() => {
        setRawValue('');
        setFormattedDisplayValue('');
        onChangeText?.('');
    }, [onChangeText]);

    const handleTextChange = useCallback(
        (text: string) => {
            let cleanedText = text;

            if (onlyAllowAlphabet) {
                const alphabetOnly = /^[a-zA-Z ]*$/;
                if (!alphabetOnly.test(text)) {
                    return;
                }
            }

            if (formatting === 'currency') {
                const newText = text.replace(/[^0-9]/g, '');
                setRawValue(newText);
                setFormattedDisplayValue(NumberUtils.formatNumber(newText));
                onChangeText?.(newText);
                return;
            }

            if (keyboardType === 'number-pad' && specialCharactersNotAllowed) {
                cleanedText = text.replace(/[^0-9]/g, '');
            }

            if (isPancard) {
                cleanedText = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
            }

            setRawValue(cleanedText);
            setFormattedDisplayValue(cleanedText);
            onChangeText?.(cleanedText);
        },
        [formatting, keyboardType, onChangeText, specialCharactersNotAllowed, onlyAllowAlphabet, isPancard]
    );

    // Calculate label position
    const labelTop = animatedLabel.interpolate({
        inputRange: [0, 1.08],
        outputRange: [Platform.OS === 'ios' ? 16 : 16, -10],
    });

    const labelFontSize = animatedLabel.interpolate({
        inputRange: [0, 1],
        outputRange: [fonts.size.font16, fonts.size.font12],
    });

    const labelColor = errorText
        ? colors.inputErrorText
        : isFocused
            ? colors.themePrimary
            : colors.textLabel;

    return (
        <TouchableWithoutFeedback onPress={handleLabelPress}>
            <View style={styles.container}>
                <View style={styles.inputWrapper}>
                    <TextInput
                        ref={inputRef}
                        style={{
                            ...inputStyle,
                            paddingLeft: formatting === 'currency' ? 23 : leftIconName ? 40 : 13,
                        }}
                        value={formattedDisplayValue}
                        secureTextEntry={secureTextEntry && !showPassword}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        onChangeText={handleTextChange}
                        keyboardType={formatting !== 'none' ? 'numeric' : keyboardType}
                        {...props}
                        placeholder=""
                        placeholderTextColor="transparent"
                    />

                    {formatting === 'currency' && (
                        <View style={styles.currencyIcon}>
                            <Text style={styles.currencyText}>₹</Text>
                        </View>
                    )}

                    {leftIconName && (
                        <View style={styles.leftIcon}>
                            <Image
                                source={imageSource[leftIconName]}
                                resizeMode="contain"
                                style={{ width: 18, height: 18 }}
                            />
                        </View>
                    )}

                    <Animated.Text
                        style={[
                            styles.label,
                            {
                                top: labelTop,
                                fontSize: labelFontSize,
                                color: labelColor,
                                backgroundColor: topLevelBackGroundColor || colors.backgroundPrimary || '#fff',
                            },
                        ]}
                        pointerEvents="none"
                    >
                        {label}
                    </Animated.Text>
                </View>

                {rawValue.length > 0 && isFocused && showCrossButton && (
                    <TouchableOpacity style={{ ...styles.clearButton, right: secureTextEntry ? 42 : 12, }} onPress={handleClearText}>
                        <Feather name="x-circle" size={20} color={colors.themePrimary} />
                    </TouchableOpacity>
                )}

                {showContactIcon && onContact && rawValue.length < 1 && (
                    <TouchableOpacity style={styles.contactButton} onPress={onContact}>
                        <MaterialIcons name="contacts" size={22} color={colors.themePrimary} />
                    </TouchableOpacity>
                )}

                {secureTextEntry && (
                    <TouchableOpacity
                        style={styles.eyeIcon}
                        onPress={() => setShowPassword(!showPassword)}
                    >
                        <Feather
                            name={showPassword ? 'eye' : 'eye-off'}
                            size={20}
                            color={colors.lightGrey}
                        />
                    </TouchableOpacity>
                )}

                {errorText && <Text style={styles.errorText}>{errorText}</Text>}
            </View>
        </TouchableWithoutFeedback>
    );
};

const getStyles = (colors: any) =>
    StyleSheet.create({
        container: {
            position: 'relative',
        },
        inputWrapper: {
            position: 'relative',
        },
        label: {
            position: 'absolute',
            left: 10,
            paddingHorizontal: 5,
            zIndex: 999,
            elevation: 999,
            fontFamily: fonts.family.primaryRegular,
        },
        currencyIcon: {
            position: 'absolute',
            left: 12,
            top: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1,
        },
        currencyText: {
            fontSize: 16,
            color: colors.themePrimary,
            fontFamily: fonts.family.primarySemiBold,
        },
        leftIcon: {
            position: 'absolute',
            left: 15,
            top: 15,
            zIndex: 1,
        },
        clearButton: {
            position: 'absolute',
            right: 12,
            top: 16,
            zIndex: 10,
        },
        contactButton: {
            position: 'absolute',
            right: 12,
            top: 16,
            zIndex: 10,
        },
        eyeIcon: {
            position: 'absolute',
            right: 12,
            top: 16,
            zIndex: 10,
        },
        errorText: {
            color: colors.inputErrorText,
            fontSize: fonts.size.font12,
            marginTop: 4,
            marginLeft: 13,
            fontFamily: fonts.family.primaryRegular,
        },
    });

export default React.memo(AppTextInput);