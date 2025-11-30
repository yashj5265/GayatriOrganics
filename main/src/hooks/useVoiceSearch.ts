import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { getVoiceModule, getVoiceEventEmitter, isVoiceModuleAvailable, initializeVoiceModule } from '../utils/voiceModuleBridge';

// Initialize voice module using the bridge
const Voice = initializeVoiceModule();
const VoiceEventEmitter = getVoiceEventEmitter();

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
            // Re-initialize in case it wasn't ready before
            const voiceModule = getVoiceModule();

            if (!voiceModule || !isVoiceModuleAvailable()) {
                console.warn('[useVoiceSearch] Voice module is not available. Please rebuild the app.');
                setIsAvailable(false);
                return;
            }

            try {
                // Check if the native module is actually linked by trying to access it
                if (typeof voiceModule.isAvailable === 'function') {
                    // Add a delay to ensure native module is initialized
                    await new Promise(resolve => setTimeout(resolve, 500));
                    const available = await voiceModule.isAvailable();
                    setIsAvailable(available);
                    console.log('[useVoiceSearch] Voice recognition available:', available);
                } else if (typeof voiceModule.start === 'function') {
                    // If isAvailable doesn't exist but start does, assume it might work
                    console.warn('[useVoiceSearch] Voice.isAvailable not found, but Voice.start exists - will check on first use');
                    setIsAvailable(true); // Optimistically set to true, will fail gracefully on use
                } else {
                    setIsAvailable(false);
                }
            } catch (err: any) {
                console.warn('[useVoiceSearch] Voice recognition availability check failed:', err);
                const errorMsg = err?.message || err?.toString() || '';
                // If error is about null or Cannot read property, the module isn't linked
                if (errorMsg.includes('null') ||
                    errorMsg.includes('Cannot read property') ||
                    errorMsg.includes('isSpeechAvailable') ||
                    errorMsg.includes('startSpeech')) {
                    console.error('[useVoiceSearch] Voice native module is not properly linked.');
                    setIsAvailable(false);
                } else {
                    // Other errors - might be permission or device issue, allow users to try
                    console.log('[useVoiceSearch] Availability check error (may be recoverable):', errorMsg);
                    setIsAvailable(true);
                }
            }
        };
        // Add a delay before checking to ensure native modules are initialized
        const timeoutId = setTimeout(() => {
            checkAvailability();
        }, 1000);

        return () => clearTimeout(timeoutId);
    }, []);

    // Initialize voice recognition
    useEffect(() => {
        const voiceModule = getVoiceModule();

        if (!voiceModule) {
            console.warn('[useVoiceSearch] Voice module not available for initialization');
            return;
        }

        if (!isInitialized.current) {
            // Set up event listeners using the wrapper's event system
            voiceModule.onSpeechStart = (e?: any) => {
                console.log('[useVoiceSearch] onSpeechStart event received', e);
                setIsListening(true);
                setError(null);
            };

            voiceModule.onSpeechEnd = (e?: any) => {
                console.log('[useVoiceSearch] onSpeechEnd event received', e);
                setIsListening(false);
            };

            voiceModule.onSpeechResults = (e: any) => {
                console.log('[useVoiceSearch] onSpeechResults event received', e);
                if (e && e.value && e.value.length > 0) {
                    const recognizedText = e.value[0];
                    console.log('[useVoiceSearch] Recognized text:', recognizedText);
                    onResult?.(recognizedText);
                }
                setIsListening(false);
            };

            voiceModule.onSpeechError = (e: any) => {
                console.log('[useVoiceSearch] onSpeechError event received', e);
                const errorMessage = e?.error?.message || e?.message || e?.toString() || 'Speech recognition error';
                setError(errorMessage);
                setIsListening(false);
                onError?.(new Error(errorMessage));
            };

            voiceModule.onSpeechPartialResults = (e: any) => {
                console.log('[useVoiceSearch] onSpeechPartialResults event received', e);
                // Handle partial results if needed
            };

            isInitialized.current = true;
            console.log('[useVoiceSearch] Voice event handlers initialized');
        }

        return () => {
            if (isInitialized.current && voiceModule) {
                // Stop listening if active
                if (isListening) {
                    voiceModule.stop().catch((err: any) => {
                        console.warn('[useVoiceSearch] Error stopping Voice on cleanup:', err);
                    });
                }
                
                // Clean up listeners (but don't destroy the module - other instances might be using it)
                if (voiceModule.removeAllListeners && typeof voiceModule.removeAllListeners === 'function') {
                    voiceModule.removeAllListeners();
                }
                
                // Clear event handlers
                voiceModule.onSpeechStart = undefined;
                voiceModule.onSpeechEnd = undefined;
                voiceModule.onSpeechResults = undefined;
                voiceModule.onSpeechError = undefined;
                voiceModule.onSpeechPartialResults = undefined;
                
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
            console.log('[useVoiceSearch] Starting voice recognition...');

            const voiceModule = getVoiceModule();

            // Check if Voice module is available
            if (!voiceModule || !isVoiceModuleAvailable()) {
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
                if (voiceModule.cancel && typeof voiceModule.cancel === 'function') {
                    await voiceModule.cancel();
                }
            } catch (cancelErr) {
                console.log('[useVoiceSearch] No existing recognition to cancel');
            }

            // Ensure event handlers are set before starting
            if (!isInitialized.current) {
                voiceModule.onSpeechStart = () => {
                    console.log('[useVoiceSearch] onSpeechStart event received');
                    setIsListening(true);
                    setError(null);
                };
                voiceModule.onSpeechEnd = () => {
                    console.log('[useVoiceSearch] onSpeechEnd event received');
                    setIsListening(false);
                };
                voiceModule.onSpeechResults = (e: any) => {
                    console.log('[useVoiceSearch] onSpeechResults event received', e);
                    if (e && e.value && e.value.length > 0) {
                        const recognizedText = e.value[0];
                        console.log('[useVoiceSearch] Recognized text:', recognizedText);
                        onResult?.(recognizedText);
                    }
                    setIsListening(false);
                };
                voiceModule.onSpeechError = (e: any) => {
                    console.log('[useVoiceSearch] onSpeechError event received', e);
                    const errorMessage = e?.error?.message || e?.message || e?.toString() || 'Speech recognition error';
                    setError(errorMessage);
                    setIsListening(false);
                    onError?.(new Error(errorMessage));
                };
                isInitialized.current = true;
            }

            // Start new recognition
            console.log('[useVoiceSearch] Starting Voice.start with language:', language);
            await voiceModule.start(language);
            console.log('[useVoiceSearch] Voice.start called successfully');

            // Set listening state optimistically (will be confirmed by onSpeechStart event)
            setIsListening(true);
        } catch (err: any) {
            console.error('[useVoiceSearch] Voice recognition error:', err);
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
            } else if (err?.message?.includes('null') ||
                err?.message?.includes('startSpeech') ||
                err?.message?.includes('not available') ||
                err?.message?.includes('not properly linked')) {
                userMessage = 'Voice recognition module is not properly linked. Please:\n\n1. Stop Metro bundler\n2. Clean build: cd android && ./gradlew clean\n3. Rebuild: npm run android';
            } else {
                userMessage += 'Please check your microphone and try again.';
            }

            Alert.alert('Voice Search Error', userMessage, [{ text: 'OK' }]);
        }
    }, [language, requestPermissions, onError]);

    // Stop listening
    const stopListening = useCallback(async () => {
        const voiceModule = getVoiceModule();

        if (!voiceModule) {
            setIsListening(false);
            return;
        }

        try {
            await voiceModule.stop();
            setIsListening(false);
        } catch (err: any) {
            console.error('[useVoiceSearch] Error stopping voice recognition:', err);
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

