import AsyncStorage from "@react-native-async-storage/async-storage";

const PREFIX = "@GOFManager:";

export enum StorageKey {
    TOKEN = "auth_token",
    USER = "user_detail",
    BASE_URL = "base_url",
    loggedInUser = "loggedInUser",
}

type StorageValue = string | number | boolean | object | null;

export default class StorageManager {
    private static memoryCache: Record<string, StorageValue> = {};

    // ✅ Set any value
    static async setItem(key: StorageKey, value: StorageValue): Promise<void> {
        try {
            const finalKey = PREFIX + key;
            const jsonValue = JSON.stringify(value);
            await AsyncStorage.setItem(finalKey, jsonValue);
            this.memoryCache[key] = value;
        } catch (error) {
            console.error(`StorageManager: Error setting ${key}`, error);
            throw error;
        }
    }

    // ✅ Get value (sync + async safe)
    static async getItem<T = any>(key: StorageKey): Promise<T | null> {
        try {
            if (this.memoryCache[key] !== undefined) {
                return this.memoryCache[key] as T;
            }
            const finalKey = PREFIX + key;
            const value = await AsyncStorage.getItem(finalKey);
            if (value != null) {
                const parsed = JSON.parse(value);
                this.memoryCache[key] = parsed;
                return parsed as T;
            }
            return null;
        } catch (error) {
            console.error(`StorageManager: Error getting ${key}`, error);
            return null;
        }
    }

    // ✅ Remove single key
    static async removeItem(key: StorageKey): Promise<void> {
        try {
            const finalKey = PREFIX + key;
            await AsyncStorage.removeItem(finalKey);
            delete this.memoryCache[key];
        } catch (error) {
            console.error(`StorageManager: Error removing ${key}`, error);
        }
    }

    // ✅ Clear all GOFManager keys
    static async clearAll(): Promise<void> {
        try {
            const allKeys = await AsyncStorage.getAllKeys();
            const gofKeys = allKeys.filter((k) => k.startsWith(PREFIX));
            await AsyncStorage.multiRemove(gofKeys);
            this.memoryCache = {};
        } catch (error) {
            console.error("StorageManager: Error clearing storage", error);
        }
    }

    // ✅ Sync memory with AsyncStorage (optional for app startup)
    static async sync(): Promise<void> {
        try {
            const allKeys = await AsyncStorage.getAllKeys();
            const gofKeys = allKeys.filter((k) => k.startsWith(PREFIX));
            const stores = await AsyncStorage.multiGet(gofKeys);
            stores.forEach(([key, value]) => {
                const cleanKey = key.replace(PREFIX, "") as StorageKey;
                if (value) this.memoryCache[cleanKey] = JSON.parse(value);
            });
        } catch (error) {
            console.error("StorageManager: Error syncing storage", error);
        }
    }
}
