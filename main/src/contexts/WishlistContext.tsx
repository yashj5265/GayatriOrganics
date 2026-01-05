import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface WishlistItem {
    id: number;
    name: string;
    price: string;
    image1: string;
    category_id: number;
    category: {
        id: number;
        name: string;
    };
    stock: number;
    description: string;
    unit_type?: string;
    unit_value?: number;
}

interface WishlistContextType {
    wishlistItems: WishlistItem[];
    wishlistCount: number;
    addToWishlist: (item: WishlistItem) => void;
    removeFromWishlist: (itemId: number) => void;
    isInWishlist: (itemId: number) => boolean;
    clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const WISHLIST_STORAGE_KEY = '@GOFManager:wishlist_items';

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);

    // Load wishlist from storage on mount
    useEffect(() => {
        loadWishlist();
    }, []);

    const loadWishlist = useCallback(async () => {
        try {
            const savedWishlistJson = await AsyncStorage.getItem(WISHLIST_STORAGE_KEY);
            if (savedWishlistJson) {
                const savedWishlist = JSON.parse(savedWishlistJson);
                if (Array.isArray(savedWishlist)) {
                    setWishlistItems(savedWishlist);
                }
            }
        } catch (error) {
            console.error('Error loading wishlist from storage:', error);
        }
    }, []);

    // Save wishlist to storage whenever it changes
    useEffect(() => {
        const saveWishlist = async () => {
            try {
                await AsyncStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistItems));
            } catch (error) {
                console.error('Error saving wishlist to storage:', error);
            }
        };
        saveWishlist();
    }, [wishlistItems]);

    const addToWishlist = useCallback((item: WishlistItem) => {
        setWishlistItems((prevItems) => {
            const existingItem = prevItems.find((i) => i.id === item.id);
            if (existingItem) {
                return prevItems; // Already in wishlist
            }
            return [...prevItems, item];
        });
    }, []);

    const removeFromWishlist = useCallback((itemId: number) => {
        setWishlistItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
    }, []);

    const isInWishlist = useCallback((itemId: number): boolean => {
        return wishlistItems.some((item) => item.id === itemId);
    }, [wishlistItems]);

    const clearWishlist = useCallback(() => {
        setWishlistItems([]);
    }, []);

    const wishlistCount = useMemo(() => {
        return wishlistItems.length;
    }, [wishlistItems]);

    const value = useMemo(() => ({
        wishlistItems,
        wishlistCount,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        clearWishlist,
    }), [wishlistItems, wishlistCount, addToWishlist, removeFromWishlist, isInWishlist, clearWishlist]);

    return (
        <WishlistContext.Provider value={value}>
            {children}
        </WishlistContext.Provider>
    );
};

export const useWishlist = (): WishlistContextType => {
    const context = useContext(WishlistContext);
    if (!context) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
};

