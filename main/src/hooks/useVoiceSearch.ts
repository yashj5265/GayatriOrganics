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
    const isStartingRef = useRef(false);
    const isStoppingRef = useRef(false);

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

    // Initialize voice recognition - setup event handlers
    useEffect(() => {
        const voiceModule = getVoiceModule();

        if (!voiceModule) {
            console.warn('[useVoiceSearch] Voice module not available for initialization');
            return;
        }

        // Always set up event handlers (they can be updated when callbacks change)
        voiceModule.onSpeechStart = (e?: any) => {
            console.log('[useVoiceSearch] onSpeechStart event received', e);
            setIsListening(true);
            setError(null);
            isStartingRef.current = false;
        };

        voiceModule.onSpeechEnd = (e?: any) => {
            console.log('[useVoiceSearch] onSpeechEnd event received', e);
            setIsListening(false);
            isStartingRef.current = false;
        };

        voiceModule.onSpeechResults = (e: any) => {
            console.log('[useVoiceSearch] onSpeechResults event received', e);
            if (e && e.value && e.value.length > 0) {
                const recognizedText = e.value[0];
                console.log('[useVoiceSearch] Recognized text:', recognizedText);
                onResult?.(recognizedText);
            }
            setIsListening(false);
            isStartingRef.current = false;
        };

        voiceModule.onSpeechError = (e: any) => {
            console.log('[useVoiceSearch] onSpeechError event received', e);
            const errorMessage = e?.error?.message || e?.message || e?.toString() || 'Speech recognition error';
            setError(errorMessage);
            setIsListening(false);
            isStartingRef.current = false;
            onError?.(new Error(errorMessage));
        };

        voiceModule.onSpeechPartialResults = (e: any) => {
            console.log('[useVoiceSearch] onSpeechPartialResults event received', e);
            // Handle partial results if needed
        };

        if (!isInitialized.current) {
            isInitialized.current = true;
            console.log('[useVoiceSearch] Voice event handlers initialized');
        }

        // Cleanup only on unmount, not when callbacks change
        return () => {
            // Only cleanup on actual unmount, not when dependencies change
            // This prevents resetting state when callbacks are recreated
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
        // Prevent multiple simultaneous starts
        if (isStartingRef.current) {
            console.log('[useVoiceSearch] Already starting, ignoring duplicate call');
            return;
        }

        // If already listening, don't start again
        if (isListening) {
            console.log('[useVoiceSearch] Already listening, ignoring start call');
            return;
        }

        isStartingRef.current = true;

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
                isStartingRef.current = false;
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
                isStartingRef.current = false;
                return;
            }

            // Check if already recognizing and stop/cancel first
            try {
                if (voiceModule.isRecognizing && typeof voiceModule.isRecognizing === 'function') {
                    const isRecognizing = await voiceModule.isRecognizing();
                    if (isRecognizing) {
                        console.log('[useVoiceSearch] Module is already recognizing, stopping first...');
                        if (voiceModule.stop && typeof voiceModule.stop === 'function') {
                            await voiceModule.stop().catch((err: any) => {
                                console.log('[useVoiceSearch] Error stopping:', err);
                            });
                        }
                        await new Promise(resolve => setTimeout(resolve, 200));
                        if (voiceModule.cancel && typeof voiceModule.cancel === 'function') {
                            await voiceModule.cancel().catch((err: any) => {
                                console.log('[useVoiceSearch] Error canceling:', err);
                            });
                        }
                        await new Promise(resolve => setTimeout(resolve, 200));
                    }
                } else {
                    // If isRecognizing is not available, always try to stop/cancel to be safe
                    console.log('[useVoiceSearch] Stopping any existing recognition...');
                    if (voiceModule.stop && typeof voiceModule.stop === 'function') {
                        await voiceModule.stop().catch((err: any) => {
                            console.log('[useVoiceSearch] Error stopping (may not be active):', err);
                        });
                    }
                    await new Promise(resolve => setTimeout(resolve, 200));
                    if (voiceModule.cancel && typeof voiceModule.cancel === 'function') {
                        await voiceModule.cancel().catch((err: any) => {
                            console.log('[useVoiceSearch] Error canceling (may not be active):', err);
                        });
                    }
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
            } catch (cleanupErr) {
                console.log('[useVoiceSearch] Error during cleanup:', cleanupErr);
            }

            // Reset listening state before starting
            setIsListening(false);
            setError(null);

            // Ensure event handlers are set (they should already be set by useEffect, but ensure they're current)
            voiceModule.onSpeechStart = (e?: any) => {
                console.log('[useVoiceSearch] onSpeechStart event received', e);
                setIsListening(true);
                setError(null);
                isStartingRef.current = false;
            };

            voiceModule.onSpeechEnd = (e?: any) => {
                console.log('[useVoiceSearch] onSpeechEnd event received', e);
                setIsListening(false);
                isStartingRef.current = false;
            };

            voiceModule.onSpeechResults = (e: any) => {
                console.log('[useVoiceSearch] onSpeechResults event received', e);
                if (e && e.value && e.value.length > 0) {
                    const recognizedText = e.value[0];
                    console.log('[useVoiceSearch] Recognized text:', recognizedText);
                    onResult?.(recognizedText);
                }
                setIsListening(false);
                isStartingRef.current = false;
            };

            voiceModule.onSpeechError = (e: any) => {
                console.log('[useVoiceSearch] onSpeechError event received', e);
                const errorMessage = e?.error?.message || e?.message || e?.toString() || 'Speech recognition error';
                setError(errorMessage);
                setIsListening(false);
                isStartingRef.current = false;
                onError?.(new Error(errorMessage));
            };

            if (!isInitialized.current) {
                isInitialized.current = true;
                console.log('[useVoiceSearch] Voice event handlers initialized');
            }

            // Start new recognition
            console.log('[useVoiceSearch] Starting Voice.start with language:', language);
            await voiceModule.start(language);
            console.log('[useVoiceSearch] Voice.start called successfully');

            // Note: isListening will be set to true by onSpeechStart event
            // If onSpeechStart doesn't fire within 2 seconds, reset the starting flag
            setTimeout(() => {
                if (isStartingRef.current && !isListening) {
                    console.warn('[useVoiceSearch] onSpeechStart did not fire, resetting state');
                    isStartingRef.current = false;
                }
            }, 2000);

        } catch (err: any) {
            console.error('[useVoiceSearch] Voice recognition error:', err);
            const errorMessage = err?.message || err?.toString() || 'Failed to start voice recognition';
            setError(errorMessage);
            setIsListening(false);
            isStartingRef.current = false;
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
    }, [language, requestPermissions, onResult, onError, isListening]);

    // Stop listening
    const stopListening = useCallback(async () => {
        // Prevent multiple simultaneous stops
        if (isStoppingRef.current) {
            console.log('[useVoiceSearch] Already stopping, ignoring duplicate call');
            return;
        }

        isStoppingRef.current = true;
        const voiceModule = getVoiceModule();

        if (!voiceModule) {
            setIsListening(false);
            isStoppingRef.current = false;
            return;
        }

        try {
            console.log('[useVoiceSearch] Stopping voice recognition...');
            // Reset starting flag in case we were in the middle of starting
            isStartingRef.current = false;
            
            // First try to stop
            if (voiceModule.stop && typeof voiceModule.stop === 'function') {
                await voiceModule.stop().catch((err: any) => {
                    console.log('[useVoiceSearch] Error stopping:', err);
                });
            }
            // Small delay before canceling
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Then try to cancel to ensure clean state
            if (voiceModule.cancel && typeof voiceModule.cancel === 'function') {
                await voiceModule.cancel().catch((err: any) => {
                    console.log('[useVoiceSearch] Error canceling:', err);
                });
            }
            
            setIsListening(false);
            console.log('[useVoiceSearch] Voice recognition stopped');
        } catch (err: any) {
            console.error('[useVoiceSearch] Error stopping voice recognition:', err);
            setIsListening(false);
        } finally {
            isStoppingRef.current = false;
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

