import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import StorageManager, { StorageKey } from '../managers/StorageManager';

export interface CartItem {
    id: number;
    name: string;
    price: number;
    quantity: number;
    image: string;
    unit: string;
}

interface CartContextType {
    cartItems: CartItem[];
    cartCount: number;
    cartTotal: number;
    addToCart: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
    removeFromCart: (itemId: number) => void;
    updateQuantity: (itemId: number, quantity: number) => void;
    clearCart: () => void;
    isInCart: (itemId: number) => boolean;
    getCartItem: (itemId: number) => CartItem | undefined;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
    children: ReactNode;
}

const CART_STORAGE_KEY = '@GOFManager:cart_items' as StorageKey;

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);

    // Load cart from storage on mount
    useEffect(() => {
        const loadCart = async () => {
            try {
                const storedCart = await StorageManager.getItem<CartItem[]>(CART_STORAGE_KEY);
                if (storedCart && Array.isArray(storedCart)) {
                    setCartItems(storedCart);
                }
            } catch (error) {
                console.error('Error loading cart from storage:', error);
            }
        };
        loadCart();
    }, []);

    // Save cart to storage whenever it changes
    useEffect(() => {
        const saveCart = async () => {
            try {
                await StorageManager.setItem(CART_STORAGE_KEY, cartItems);
            } catch (error) {
                console.error('Error saving cart to storage:', error);
            }
        };
        if (cartItems.length > 0) {
            saveCart();
        }
    }, [cartItems]);

    const addToCart = useCallback((item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
        setCartItems((prevItems) => {
            const existingItem = prevItems.find((i) => i.id === item.id);
            const quantityToAdd = item.quantity || 1;

            if (existingItem) {
                return prevItems.map((i) =>
                    i.id === item.id ? { ...i, quantity: i.quantity + quantityToAdd } : i
                );
            } else {
                return [...prevItems, { ...item, quantity: quantityToAdd }];
            }
        });
    }, []);

    const removeFromCart = useCallback((itemId: number) => {
        setCartItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
    }, []);

    const updateQuantity = useCallback((itemId: number, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(itemId);
            return;
        }

        setCartItems((prevItems) =>
            prevItems.map((item) =>
                item.id === itemId ? { ...item, quantity } : item
            )
        );
    }, [removeFromCart]);

    const clearCart = useCallback(() => {
        setCartItems([]);
    }, []);

    const isInCart = useCallback((itemId: number): boolean => {
        return cartItems.some((item) => item.id === itemId);
    }, [cartItems]);

    const getCartItem = useCallback((itemId: number): CartItem | undefined => {
        return cartItems.find((item) => item.id === itemId);
    }, [cartItems]);

    // Memoize computed values
    const cartCount = useMemo(() => {
        return cartItems.reduce((total, item) => total + item.quantity, 0);
    }, [cartItems]);

    const cartTotal = useMemo(() => {
        return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
    }, [cartItems]);

    const contextValue = useMemo(() => ({
        cartItems,
        cartCount,
        cartTotal,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isInCart,
        getCartItem,
    }), [cartItems, cartCount, cartTotal, addToCart, removeFromCart, updateQuantity, clearCart, isInCart, getCartItem]);

    return (
        <CartContext.Provider value={contextValue}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = (): CartContextType => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};