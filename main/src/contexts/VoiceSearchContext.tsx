import React, { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { getVoiceModule, initializeVoiceModule } from '../utils/voiceModuleBridge';

interface VoiceSearchContextType {
    isListening: boolean;
    isAvailable: boolean;
    startListening: (onResult?: (text: string) => void, onError?: (error: Error) => void, language?: string) => Promise<void>;
    stopListening: () => Promise<void>;
    error: string | null;
}

const VoiceSearchContext = createContext<VoiceSearchContextType | undefined>(undefined);

interface VoiceSearchProviderProps {
    children: ReactNode;
}

export const VoiceSearchProvider: React.FC<VoiceSearchProviderProps> = ({ children }) => {
    const [isListening, setIsListening] = useState(false);
    const [isAvailable, setIsAvailable] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const isInitialized = useRef(false);
    const voiceModuleRef = useRef<any>(null);
    const currentCallbacks = useRef<{ onResult?: (text: string) => void; onError?: (error: Error) => void }>({});

    // Initialize voice module and check availability
    useEffect(() => {
        const checkAvailability = async () => {
            voiceModuleRef.current = initializeVoiceModule();
            const voiceModule = voiceModuleRef.current;

            if (!voiceModule) {
                console.warn('[VoiceSearchContext] Voice module is not available');
                setIsAvailable(false);
                return;
            }

            if (typeof voiceModule.isAvailable === 'function') {
                try {
                    await new Promise(resolve => setTimeout(resolve, 500));
                    const available = await voiceModule.isAvailable();
                    setIsAvailable(available);
                    console.log('[VoiceSearchContext] Voice recognition available:', available);
                } catch (err: any) {
                    console.warn('[VoiceSearchContext] Availability check failed:', err);
                    setIsAvailable(true); // Optimistically allow usage
                }
            } else if (typeof voiceModule.start === 'function') {
                setIsAvailable(true);
            } else {
                setIsAvailable(false);
            }
        };

        const timeoutId = setTimeout(() => {
            checkAvailability();
        }, 1000);

        return () => clearTimeout(timeoutId);
    }, []);

    // Setup event listeners
    useEffect(() => {
        const voiceModule = voiceModuleRef.current;

        if (!voiceModule || isInitialized.current) {
            return;
        }

        // Set up event handlers
        voiceModule.onSpeechStart = () => {
            console.log('[VoiceSearchContext] onSpeechStart event received');
            setIsListening(true);
            setError(null);
        };

        voiceModule.onSpeechEnd = () => {
            console.log('[VoiceSearchContext] onSpeechEnd event received');
            setIsListening(false);
        };

        voiceModule.onSpeechResults = (e: any) => {
            console.log('[VoiceSearchContext] onSpeechResults event received', e);
            if (e && e.value && e.value.length > 0) {
                const recognizedText = e.value[0];
                console.log('[VoiceSearchContext] Recognized text:', recognizedText);
                currentCallbacks.current.onResult?.(recognizedText);
            }
            setIsListening(false);
        };

        voiceModule.onSpeechError = (e: any) => {
            console.log('[VoiceSearchContext] onSpeechError event received', e);
            const errorMessage = e?.error?.message || e?.message || e?.toString() || 'Speech recognition error';
            setError(errorMessage);
            setIsListening(false);
            currentCallbacks.current.onError?.(new Error(errorMessage));
        };

        isInitialized.current = true;
        console.log('[VoiceSearchContext] Voice event handlers initialized');

        return () => {
            if (isInitialized.current && voiceModule) {
                // Stop listening if active
                if (isListening) {
                    voiceModule.stop().catch(console.warn);
                }
                // Clean up listeners
                if (voiceModule.removeAllListeners && typeof voiceModule.removeAllListeners === 'function') {
                    voiceModule.removeAllListeners();
                }
                isInitialized.current = false;
            }
        };
    }, [isListening]);

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
                console.error('[VoiceSearchContext] Permission request error:', err);
                return false;
            }
        }
        return true;
    }, []);

    // Start listening
    const startListening = useCallback(async (
        onResult?: (text: string) => void,
        onError?: (error: Error) => void,
        language: string = 'en-US'
    ) => {
        try {
            console.log('[VoiceSearchContext] Starting voice recognition...');
            const voiceModule = voiceModuleRef.current;

            if (!voiceModule) {
                Alert.alert(
                    'Voice Search Not Available',
                    'Voice recognition module is not properly linked. Please rebuild the app.',
                    [{ text: 'OK' }]
                );
                return;
            }

            if (typeof voiceModule.start !== 'function') {
                Alert.alert(
                    'Voice Search Not Available',
                    'Voice recognition native module is not properly linked.',
                    [{ text: 'OK' }]
                );
                return;
            }

            // Store callbacks for this session
            currentCallbacks.current = { onResult, onError };

            // Check permissions
            const hasPermission = await requestPermissions();
            if (!hasPermission) {
                Alert.alert(
                    'Permission Denied',
                    'Microphone permission is required for voice search.',
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
                console.log('[VoiceSearchContext] No existing recognition to cancel');
            }

            // Start new recognition
            console.log('[VoiceSearchContext] Starting Voice.start with language:', language);
            await voiceModule.start(language);
            console.log('[VoiceSearchContext] Voice.start called successfully');
            
            // Set listening state optimistically
            setIsListening(true);
        } catch (err: any) {
            console.error('[VoiceSearchContext] Voice recognition error:', err);
            const errorMessage = err?.message || err?.toString() || 'Failed to start voice recognition';
            setError(errorMessage);
            setIsListening(false);
            onError?.(new Error(errorMessage));

            let userMessage = 'Failed to start voice search. ';
            if (err?.code === 'E_NO_MATCH') {
                userMessage = 'No speech detected. Please try again.';
            } else if (err?.message?.includes('permission')) {
                userMessage = 'Microphone permission is required. Please enable it in settings.';
            } else {
                userMessage += 'Please check your microphone and try again.';
            }

            Alert.alert('Voice Search Error', userMessage, [{ text: 'OK' }]);
        }
    }, [requestPermissions]);

    // Stop listening
    const stopListening = useCallback(async () => {
        const voiceModule = voiceModuleRef.current;
        if (!voiceModule) {
            setIsListening(false);
            return;
        }

        try {
            await voiceModule.stop();
            setIsListening(false);
            console.log('[VoiceSearchContext] Voice.stop called successfully');
        } catch (err: any) {
            console.error('[VoiceSearchContext] Error stopping voice recognition:', err);
            setIsListening(false);
        }
    }, []);

    return (
        <VoiceSearchContext.Provider
            value={{
                isListening,
                isAvailable,
                startListening,
                stopListening,
                error,
            }}
        >
            {children}
        </VoiceSearchContext.Provider>
    );
};

export const useVoiceSearchContext = (): VoiceSearchContextType => {
    const context = useContext(VoiceSearchContext);
    if (context === undefined) {
        throw new Error('useVoiceSearchContext must be used within a VoiceSearchProvider');
    }
    return context;
};

