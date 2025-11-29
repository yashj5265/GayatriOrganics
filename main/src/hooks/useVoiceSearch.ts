import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform, PermissionsAndroid, Alert } from 'react-native';

// Try to import Voice, but handle if it's not available
let Voice: any = null;
try {
    const voiceModule = require('@react-native-voice/voice');
    // Handle both default export and named export
    Voice = voiceModule.default || voiceModule;
    // Check if it's actually a valid module (not null)
    if (!Voice || (typeof Voice.isAvailable !== 'function' && !Voice.default)) {
        console.warn('Voice module imported but native methods not available - rebuild required');
        Voice = null;
    }
} catch (err) {
    console.warn('Voice module not available:', err);
    Voice = null;
}

interface UseVoiceSearchOptions {
    onResult?: (text: string) => void;
    onError?: (error: Error) => void;
    language?: string;
}

interface UseVoiceSearchReturn {
    isListening: boolean;
    isAvailable: boolean;
    startListening: () => Promise<void>;
    stopListening: () => Promise<void>;
    error: string | null;
}

export const useVoiceSearch = (options: UseVoiceSearchOptions = {}): UseVoiceSearchReturn => {
    const { onResult, onError, language = 'en-US' } = options;
    const [isListening, setIsListening] = useState(false);
    const [isAvailable, setIsAvailable] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const isInitialized = useRef(false);

    // Check if voice recognition is available
    useEffect(() => {
        const checkAvailability = async () => {
            if (!Voice) {
                console.warn('Voice module is not available. Please rebuild the app after installing @react-native-voice/voice');
                setIsAvailable(false);
                return;
            }

            try {
                // Check if the native module is actually linked by trying to access it
                // If Voice.isAvailable throws an error about null, the module isn't linked
                if (typeof Voice.isAvailable === 'function') {
                    const available = await Voice.isAvailable();
                    setIsAvailable(available);
                    console.log('Voice recognition available:', available);
                } else {
                    // Module exists but methods aren't available - likely not linked
                    console.warn('Voice module methods not available - native module not linked');
                    setIsAvailable(false);
                }
            } catch (err: any) {
                console.warn('Voice recognition availability check failed:', err);
                // If error is about null or Cannot read property, the module isn't linked
                if (err?.message?.includes('null') ||
                    err?.message?.includes('Cannot read property') ||
                    err?.message?.includes('isSpeechAvailable')) {
                    console.error('Voice native module is not linked. Please rebuild the app.');
                    setIsAvailable(false);
                } else {
                    // Other errors - allow users to try
                    setIsAvailable(true);
                }
            }
        };
        checkAvailability();
    }, []);

    // Initialize voice recognition
    useEffect(() => {
        if (!Voice) {
            console.warn('Voice module not available for initialization');
            return;
        }

        if (!isInitialized.current) {
            Voice.onSpeechStart = () => {
                setIsListening(true);
                setError(null);
            };

            Voice.onSpeechEnd = () => {
                setIsListening(false);
            };

            Voice.onSpeechResults = (e) => {
                if (e.value && e.value.length > 0) {
                    const recognizedText = e.value[0];
                    onResult?.(recognizedText);
                }
                setIsListening(false);
            };

            Voice.onSpeechError = (e) => {
                const errorMessage = e.error?.message || 'Speech recognition error';
                setError(errorMessage);
                setIsListening(false);
                onError?.(new Error(errorMessage));
            };

            isInitialized.current = true;
        }

        return () => {
            if (isInitialized.current && Voice) {
                Voice.destroy().then(() => {
                    Voice.removeAllListeners();
                }).catch((err: any) => {
                    console.warn('Error cleaning up Voice:', err);
                });
                isInitialized.current = false;
            }
        };
    }, [onResult, onError]);

    // Request permissions
    const requestPermissions = useCallback(async (): Promise<boolean> => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                    {
                        title: 'Microphone Permission',
                        message: 'This app needs access to your microphone for voice search.',
                        buttonNeutral: 'Ask Me Later',
                        buttonNegative: 'Cancel',
                        buttonPositive: 'OK',
                    }
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } catch (err) {
                console.error('Permission request error:', err);
                return false;
            }
        }
        // iOS permissions are handled via Info.plist
        return true;
    }, []);

    // Start listening
    const startListening = useCallback(async () => {
        try {
            console.log('Starting voice recognition...');

            // Check if Voice module is available
            if (!Voice) {
                Alert.alert(
                    'Voice Search Not Available',
                    'Voice recognition module is not properly linked. Please rebuild the app:\n\n1. Stop the Metro bundler\n2. Run: npm run android\n3. Or rebuild in Android Studio',
                    [{ text: 'OK' }]
                );
                return;
            }

            // Check permissions first
            const hasPermission = await requestPermissions();
            if (!hasPermission) {
                Alert.alert(
                    'Permission Denied',
                    'Microphone permission is required for voice search. Please enable it in your device settings.',
                    [{ text: 'OK' }]
                );
                return;
            }

            // Stop any existing recognition first
            try {
                await Voice.cancel();
            } catch (cancelErr) {
                console.log('No existing recognition to cancel');
            }

            // Start new recognition
            console.log('Starting Voice.start with language:', language);
            await Voice.start(language);
            console.log('Voice.start called successfully');
        } catch (err: any) {
            console.error('Voice recognition error:', err);
            const errorMessage = err?.message || err?.toString() || 'Failed to start voice recognition';
            setError(errorMessage);
            setIsListening(false);
            onError?.(new Error(errorMessage));

            // Show user-friendly error message
            let userMessage = 'Failed to start voice search. ';
            if (err?.code === 'E_NO_MATCH') {
                userMessage = 'No speech detected. Please try again.';
            } else if (err?.message?.includes('permission')) {
                userMessage = 'Microphone permission is required. Please enable it in settings.';
            } else if (err?.message?.includes('null') || err?.message?.includes('startSpeech')) {
                userMessage = 'Voice recognition module is not properly linked. Please rebuild the app completely.';
            } else {
                userMessage += 'Please check your microphone and try again.';
            }

            Alert.alert('Voice Search Error', userMessage, [{ text: 'OK' }]);
        }
    }, [language, requestPermissions, onError]);

    // Stop listening
    const stopListening = useCallback(async () => {
        if (!Voice) {
            setIsListening(false);
            return;
        }

        try {
            await Voice.stop();
            setIsListening(false);
        } catch (err: any) {
            console.error('Error stopping voice recognition:', err);
            setIsListening(false);
        }
    }, []);

    return {
        isListening,
        isAvailable,
        startListening,
        stopListening,
        error,
    };
};

