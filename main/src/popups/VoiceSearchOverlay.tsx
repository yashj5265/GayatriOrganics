import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Animated, Easing } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppColors } from '../styles/colors';
import fonts from '../styles/fonts';

export interface VoiceSearchOverlayProps {
    visible: boolean;
    isListening: boolean;
    language?: string;
    colors: AppColors;
    onClose?: () => void;
}

const VoiceSearchOverlay: React.FC<VoiceSearchOverlayProps> = ({
    visible,
    isListening,
    language = 'English (United States)',
    colors,
    onClose,
}) => {
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (isListening && visible) {
            // Pulse animation for microphone icon
            const pulseAnimation = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.2,
                        duration: 1000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            );
            pulseAnimation.start();

            // Scale animation for the circle
            const scaleAnimation = Animated.loop(
                Animated.sequence([
                    Animated.timing(scaleAnim, {
                        toValue: 1.3,
                        duration: 1500,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(scaleAnim, {
                        toValue: 1,
                        duration: 1500,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            );
            scaleAnimation.start();

            return () => {
                pulseAnimation.stop();
                scaleAnimation.stop();
                pulseAnim.setValue(1);
                scaleAnim.setValue(1);
            };
        } else {
            pulseAnim.setValue(1);
            scaleAnim.setValue(1);
        }
    }, [isListening, visible, pulseAnim, scaleAnim]);

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                {/* Google Branding at Top */}
                <View style={styles.header}>
                    <Text style={styles.googleText}>Google</Text>
                </View>

                {/* Center Content */}
                <View style={styles.centerContent}>
                    {/* Animated Circle Background */}
                    <Animated.View
                        style={[
                            styles.circleBackground,
                            {
                                transform: [{ scale: scaleAnim }],
                                backgroundColor: isListening ? '#4285F4' : '#5F6368',
                            },
                        ]}
                    />

                    {/* Microphone Icon */}
                    <Animated.View
                        style={[
                            styles.microphoneContainer,
                            {
                                transform: [{ scale: pulseAnim }],
                            },
                        ]}
                    >
                        <Icon
                            name="microphone"
                            size={80}
                            color="#FFFFFF"
                        />
                    </Animated.View>

                    {/* Status Text */}
                    <Text style={styles.speakText}>
                        {isListening ? 'Speak now' : 'Tap to speak'}
                    </Text>

                    {/* Language Indicator */}
                    <Text style={styles.languageText}>{language}</Text>
                </View>

                {/* Bottom Hint */}
                {isListening && (
                    <View style={styles.bottomHint}>
                        <Text style={styles.hintText}>
                            Listening...
                        </Text>
                    </View>
                )}
            </View>
        </Modal>
    );
};

export default VoiceSearchOverlay;

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'space-between',
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    googleText: {
        fontSize: 24,
        fontFamily: 'sans-serif',
        color: '#FFFFFF',
        fontWeight: '400',
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    circleBackground: {
        width: 200,
        height: 200,
        borderRadius: 100,
        position: 'absolute',
        opacity: 0.3,
    },
    microphoneContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#4285F4',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    speakText: {
        marginTop: 40,
        fontSize: 20,
        fontFamily: fonts.family.primaryMedium,
        color: '#FFFFFF',
        textAlign: 'center',
    },
    languageText: {
        marginTop: 12,
        fontSize: 14,
        fontFamily: fonts.family.secondaryRegular,
        color: '#9AA0A6',
        textAlign: 'center',
    },
    bottomHint: {
        paddingBottom: 40,
        alignItems: 'center',
    },
    hintText: {
        fontSize: 14,
        fontFamily: fonts.family.secondaryRegular,
        color: '#9AA0A6',
    },
});

