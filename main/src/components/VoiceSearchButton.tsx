import React, { memo } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
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

    return (
        <AppTouchableRipple
            onPress={handlePress}
            disabled={isDisabled}
            style={[
                styles.button,
                {
                    backgroundColor: isListening
                        ? colors.themePrimary
                        : isDisabled
                            ? 'rgba(0,0,0,0.05)'
                            : colors.themePrimaryLight,
                    opacity: isDisabled ? 0.5 : 1,
                },
            ]}
        >
            {isListening ? (
                <View style={styles.listeningContainer}>
                    <ActivityIndicator size="small" color={colors.white} />
                    {showLabel && (
                        <Text style={[styles.label, { color: colors.white }]}>
                            Listening...
                        </Text>
                    )}
                </View>
            ) : (
                <View style={styles.iconContainer}>
                    <Icon 
                        name="microphone" 
                        size={size} 
                        color={isDisabled ? colors.textLabel : colors.themePrimary} 
                    />
                    {showLabel && (
                        <Text style={[styles.label, { color: isDisabled ? colors.textLabel : colors.themePrimary }]}>
                            Speak
                        </Text>
                    )}
                </View>
            )}
        </AppTouchableRipple>
    );
});

VoiceSearchButton.displayName = 'VoiceSearchButton';

export default VoiceSearchButton;

const styles = StyleSheet.create({
    button: {
        minWidth: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 12,
    },
    iconContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    listeningContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    label: {
        fontSize: fonts.size.font12,
        fontFamily: fonts.family.primaryMedium,
    },
});

