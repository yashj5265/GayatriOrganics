import React, { memo } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AppTouchableRipple from './AppTouchableRipple';
import { AppColors } from '../styles/colors';
import fonts from '../styles/fonts';

export interface VoiceSearchButtonProps {
    isListening: boolean;
    isAvailable: boolean;
    onPress: () => void;
    colors: AppColors;
    size?: number;
    disabled?: boolean;
    showLabel?: boolean;
}

const VoiceSearchButton: React.FC<VoiceSearchButtonProps> = memo(({
    isListening,
    isAvailable,
    onPress,
    colors,
    size = 20,
    disabled = false,
    showLabel = false,
}) => {
    // Only disable if explicitly disabled, not based on availability
    // This allows users to try even if availability check failed
    const isDisabled = disabled;

    const handlePress = () => {
        console.log('Voice button pressed, isListening:', isListening, 'isAvailable:', isAvailable);
        if (onPress) {
            onPress();
        }
    };

    const buttonStyle: ViewStyle = {
        ...styles.button,
        opacity: isDisabled ? 0.5 : 1,
    };

    return (
        <AppTouchableRipple
            onPress={handlePress}
            disabled={isDisabled}
            style={buttonStyle}
        >
            <Icon
                name="microphone"
                size={size}
                color={isDisabled ? colors.textLabel : colors.themePrimary}
            />
        </AppTouchableRipple>
    );
});

VoiceSearchButton.displayName = 'VoiceSearchButton';

export default VoiceSearchButton;

const styles = StyleSheet.create({
    button: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 0,
    },
});

