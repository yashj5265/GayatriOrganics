import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import StorageManager, { StorageKey } from '../managers/StorageManager';

interface CartItem {
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
        loadCartFromStorage();
    }, []);

    // Save cart to storage whenever it changes
    useEffect(() => {
        saveCartToStorage();
    }, [cartItems]);

    const loadCartFromStorage = async () => {
        try {
            const storedCart = await StorageManager.getItem<CartItem[]>(CART_STORAGE_KEY);
            if (storedCart && Array.isArray(storedCart)) {
                setCartItems(storedCart);
            }
        } catch (error) {
            console.error('Error loading cart from storage:', error);
        }
    };

    const saveCartToStorage = async () => {
        try {
            await StorageManager.setItem(CART_STORAGE_KEY, cartItems);
        } catch (error) {
            console.error('Error saving cart to storage:', error);
        }
    };

    const addToCart = (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
        setCartItems((prevItems) => {
            const existingItem = prevItems.find((i) => i.id === item.id);
            const quantityToAdd = item.quantity || 1;

            if (existingItem) {
                // Item already in cart, increase quantity
                return prevItems.map((i) =>
                    i.id === item.id ? { ...i, quantity: i.quantity + quantityToAdd } : i
                );
            } else {
                // New item, add with specified quantity
                return [...prevItems, { ...item, quantity: quantityToAdd }];
            }
        });
    };

    const removeFromCart = (itemId: number) => {
        setCartItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
    };

    const updateQuantity = (itemId: number, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(itemId);
            return;
        }

        setCartItems((prevItems) =>
            prevItems.map((item) =>
                item.id === itemId ? { ...item, quantity } : item
            )
        );
    };

    const clearCart = () => {
        setCartItems([]);
    };

    const isInCart = (itemId: number): boolean => {
        return cartItems.some((item) => item.id === itemId);
    };

    const getCartItem = (itemId: number): CartItem | undefined => {
        return cartItems.find((item) => item.id === itemId);
    };

    const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
    const cartTotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

    return (
        <CartContext.Provider
            value={{
                cartItems,
                cartCount,
                cartTotal,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                isInCart,
                getCartItem,
            }}
        >
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