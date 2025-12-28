/**
 * Voice Module Bridge
 * 
 * This bridge ensures @react-native-voice/voice works with React Native's new architecture.
 * The module uses the old bridge (ReactContextBaseJavaModule) which should still work
 * with new architecture enabled, but requires proper initialization.
 * 
 * Since we can't modify NativeModules in new architecture, we create a custom wrapper
 * that directly uses the RCTVoice native module.
 */

import { NativeModules, NativeEventEmitter, Platform, DeviceEventEmitter } from 'react-native';

// Module name as defined in VoiceModule.java
const NATIVE_MODULE_NAME = 'RCTVoice';

let VoiceModule: any = null;
let isInitialized = false;

/**
 * Create a custom wrapper for the voice module that works with new architecture
 */
function createVoiceWrapper(nativeModule: any): any {
    if (!nativeModule) {
        return null;
    }

    // We use DeviceEventEmitter directly instead of NativeEventEmitter
    // This works with both old and new architecture without warnings

    // Store event listeners
    const listeners: any[] = [];
    const eventHandlers: any = {};

    // Custom wrapper that mimics the library's API
    const wrapper = {
        // Event handlers (set by the hook)
        onSpeechStart: undefined,
        onSpeechEnd: undefined,
        onSpeechResults: undefined,
        onSpeechError: undefined,
        onSpeechPartialResults: undefined,
        onSpeechRecognized: undefined,
        onSpeechVolumeChanged: undefined,

        // Setup event listeners using DeviceEventEmitter (works with both old and new architecture)
        _setupListeners() {
            if (!listeners.length) {
                const events = [
                    'onSpeechStart',
                    'onSpeechEnd',
                    'onSpeechResults',
                    'onSpeechError',
                    'onSpeechPartialResults',
                    'onSpeechRecognized',
                    'onSpeechVolumeChanged',
                    // Also try with RCTVoice prefix (common pattern)
                    'RCTVoice_onSpeechStart',
                    'RCTVoice_onSpeechEnd',
                    'RCTVoice_onSpeechResults',
                    'RCTVoice_onSpeechError',
                    'RCTVoice_onSpeechPartialResults',
                    'RCTVoice_onSpeechRecognized',
                    'RCTVoice_onSpeechVolumeChanged'
                ];

                events.forEach(eventName => {
                    // Use DeviceEventEmitter directly - it works with both architectures
                    const listener = DeviceEventEmitter.addListener(eventName, (data: any) => {
                        // Map RCTVoice_ prefixed events to regular event names
                        const mappedEventName = eventName.startsWith('RCTVoice_') 
                            ? eventName.replace('RCTVoice_', '') 
                            : eventName;
                        
                        if (wrapper[mappedEventName as keyof typeof wrapper] && 
                            typeof wrapper[mappedEventName as keyof typeof wrapper] === 'function') {
                            (wrapper[mappedEventName as keyof typeof wrapper] as Function)(data);
                        }
                    });
                    listeners.push(listener);
                });
            }
        },

        // Start speech recognition
        async start(locale: string, options: any = {}) {
            return new Promise((resolve, reject) => {
                if (!nativeModule.startSpeech) {
                    reject(new Error('startSpeech method not available'));
                    return;
                }

                this._setupListeners();

                const defaultOptions = Platform.OS === 'android' ? {
                    EXTRA_LANGUAGE_MODEL: 'LANGUAGE_MODEL_FREE_FORM',
                    EXTRA_MAX_RESULTS: 5,
                    EXTRA_PARTIAL_RESULTS: true,
                    REQUEST_PERMISSIONS_AUTO: true,
                    ...options
                } : {};

                const callback = (error: any) => {
                    if (error) {
                        reject(new Error(error));
                    } else {
                        resolve(undefined);
                    }
                };

                if (Platform.OS === 'android') {
                    nativeModule.startSpeech(locale, defaultOptions, callback);
                } else {
                    nativeModule.startSpeech(locale, callback);
                }
            });
        },

        // Stop speech recognition
        async stop() {
            return new Promise((resolve, reject) => {
                if (!nativeModule.stopSpeech) {
                    resolve(undefined);
                    return;
                }
                nativeModule.stopSpeech((error: any) => {
                    if (error) {
                        reject(new Error(error));
                    } else {
                        resolve(undefined);
                    }
                });
            });
        },

        // Cancel speech recognition
        async cancel() {
            return new Promise((resolve, reject) => {
                if (!nativeModule.cancelSpeech) {
                    resolve(undefined);
                    return;
                }
                nativeModule.cancelSpeech((error: any) => {
                    if (error) {
                        reject(new Error(error));
                    } else {
                        resolve(undefined);
                    }
                });
            });
        },

        // Check if speech recognition is available
        async isAvailable() {
            return new Promise((resolve, reject) => {
                if (!nativeModule.isSpeechAvailable) {
                    reject(new Error('isSpeechAvailable method not available'));
                    return;
                }
                nativeModule.isSpeechAvailable((isAvailable: boolean, error: any) => {
                    if (error) {
                        reject(new Error(error));
                    } else {
                        resolve(isAvailable);
                    }
                });
            });
        },

        // Destroy the module
        async destroy() {
            return new Promise((resolve, reject) => {
                // Remove all listeners
                listeners.forEach(listener => listener.remove());
                listeners.length = 0;

                if (!nativeModule.destroySpeech) {
                    resolve(undefined);
                    return;
                }
                nativeModule.destroySpeech((error: any) => {
                    if (error) {
                        reject(new Error(error));
                    } else {
                        resolve(undefined);
                    }
                });
            });
        },

        // Remove all listeners (but keep the DeviceEventEmitter listeners active)
        // This is called when a component unmounts, but we don't want to remove
        // the DeviceEventEmitter listeners since other components might be using them
        removeAllListeners() {
            // Only clear the event handlers, don't remove DeviceEventEmitter listeners
            // The DeviceEventEmitter listeners stay active for other components
            this.onSpeechStart = undefined;
            this.onSpeechEnd = undefined;
            this.onSpeechResults = undefined;
            this.onSpeechError = undefined;
            this.onSpeechPartialResults = undefined;
            this.onSpeechRecognized = undefined;
            this.onSpeechVolumeChanged = undefined;
        },

        // Check if recognizing
        async isRecognizing() {
            return new Promise((resolve, reject) => {
                if (!nativeModule.isRecognizing) {
                    resolve(false);
                    return;
                }
                nativeModule.isRecognizing((isRecognizing: boolean) => {
                    resolve(isRecognizing);
                });
            });
        }
    };

    return wrapper;
}

/**
 * Initialize the voice module bridge
 * This ensures the module is accessible even with new architecture enabled
 */
export function initializeVoiceModule(): any {
    if (isInitialized && VoiceModule) {
        return VoiceModule;
    }

    try {
        // Step 1: Try to get the native module directly
        const nativeModule = NativeModules[NATIVE_MODULE_NAME];
        
        if (!nativeModule) {
            return null;
        }

        // Step 2: Create custom wrapper that works with new architecture
        VoiceModule = createVoiceWrapper(nativeModule);

        if (VoiceModule) {
            isInitialized = true;
            return VoiceModule;
        } else {
            return null;
        }
    } catch (error) {
        console.error('[VoiceBridge] Initialization error:', error);
        return null;
    }
}

/**
 * Get the voice module instance
 */
export function getVoiceModule(): any {
    if (!isInitialized) {
        return initializeVoiceModule();
    }
    return VoiceModule;
}

/**
 * Get the voice event emitter (DeviceEventEmitter)
 * Note: We use DeviceEventEmitter directly, which works with both architectures
 */
export function getVoiceEventEmitter(): typeof DeviceEventEmitter {
    return DeviceEventEmitter;
}

/**
 * Check if voice module is available
 */
export function isVoiceModuleAvailable(): boolean {
    const module = getVoiceModule();
    return module !== null && typeof module.start === 'function';
}

