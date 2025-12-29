import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import StorageManager, { StorageKey } from '../managers/StorageManager';
import ApiManager from '../managers/ApiManager';
import constant from '../utilities/constant';
import { CartResponseModel, CartItemModel } from '../dataModels/models';

// ============================================================================
// TYPES
// ============================================================================

export interface CartItem {
    id: number;
    name: string;
    price: number;
    quantity: number;
    image: string;
    unit: string;
    categoryId?: number;
    productId?: number;
    cartItemId?: number;
    deliveryCharge?: number;
    deliveryDate?: string;
}

interface CartContextType {
    cartItems: CartItem[];
    cartCount: number;
    cartTotal: number;
    addToCart: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
    removeFromCart: (itemId: number) => void;
    updateQuantity: (itemId: number, quantity: number) => void;
    clearCart: () => Promise<void>;
    isInCart: (itemId: number) => boolean;
    getCartItem: (itemId: number) => CartItem | undefined;
}

interface CartProviderProps {
    children: ReactNode;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CART_STORAGE_KEY = '@GOFManager:cart_items' as StorageKey;

// ============================================================================
// CONTEXT
// ============================================================================

const CartContext = createContext<CartContextType | undefined>(undefined);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Maps API cart response to CartItem format
 */
const mapApiResponseToCartItem = (apiItem: CartItemModel): CartItem => ({
    id: apiItem.product_id || apiItem.product?.id || apiItem.id,
    name: apiItem.product?.name || '',
    price: parseFloat(apiItem.price) || 0,
    quantity: apiItem.quantity || 0,
    image: apiItem.product?.image1 || '',
    unit: apiItem.unit_type || '',
    categoryId: apiItem.category_id || apiItem.category?.id,
    productId: apiItem.product_id || apiItem.product?.id,
    cartItemId: apiItem.id,
    deliveryCharge: undefined,
    deliveryDate: undefined,
});

/**
 * Validates and normalizes price value
 */
const validatePrice = (price: any): number => {
    if (typeof price === 'number' && !isNaN(price) && price > 0) {
        return price;
    }

    if (typeof price === 'string') {
        const parsed = parseFloat(price);
        if (!isNaN(parsed) && parsed > 0) {
            return parsed;
        }
    }

    return 0;
};

/**
 * Builds API payload for cart operations
 * Only includes: category_id, product_id, quantity, unit_type, price
 */
const buildCartPayload = (item: any, quantity: number, itemPrice: number) => ({
    category_id: Number(item.categoryId),
    product_id: Number(item.productId),
    quantity: Number(quantity),
    unit_type: String(item.unit || item.unit_type || 'kg'),
    price: Number(itemPrice),
});

// ============================================================================
// PROVIDER
// ============================================================================

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);

    // ========================================================================
    // LOAD CART ON MOUNT
    // ========================================================================

    useEffect(() => {
        const loadCart = async () => {
            try {
                const token = await StorageManager.getItem(constant.shareInstanceKey.authToken);

                if (token) {
                    const response = await ApiManager.get<CartResponseModel>({
                        endpoint: constant.apiEndPoints.getCart,
                        token,
                        showError: false,
                    });

                    // Handle both direct response and wrapped response
                    const cartData: CartResponseModel | undefined = response?.items
                        ? response as CartResponseModel
                        : (response?.data as CartResponseModel | undefined);

                    if (cartData?.items && Array.isArray(cartData.items)) {
                        const apiCartItems = cartData.items.map(mapApiResponseToCartItem);
                        setCartItems(apiCartItems);
                        await StorageManager.setItem(CART_STORAGE_KEY, apiCartItems);
                        return;
                    }
                }

                // Fallback to local storage
                const storedCart = await StorageManager.getItem<CartItem[]>(CART_STORAGE_KEY);
                if (storedCart && Array.isArray(storedCart)) {
                    setCartItems(storedCart);
                }
            } catch (error) {
                console.error('Error loading cart:', error);

                // Final fallback to local storage
                try {
                    const storedCart = await StorageManager.getItem<CartItem[]>(CART_STORAGE_KEY);
                    if (storedCart && Array.isArray(storedCart)) {
                        setCartItems(storedCart);
                    }
                } catch (storageError) {
                    console.error('Error loading from local storage:', storageError);
                }
            }
        };

        loadCart();
    }, []);

    // ========================================================================
    // SAVE CART TO LOCAL STORAGE
    // ========================================================================

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

    // ========================================================================
    // CART OPERATIONS
    // ========================================================================

    /**
     * Fetches latest cart data from API
     */
    const fetchCartFromApi = useCallback(async (token: string): Promise<boolean> => {
        try {
            const response = await ApiManager.get<CartResponseModel>({
                endpoint: constant.apiEndPoints.getCart,
                token,
                showError: false,
            });

            console.log('fetchCartFromApi response', response);

            // Handle both direct response and wrapped response
            const cartData: CartResponseModel | undefined = response?.items
                ? response as CartResponseModel
                : (response?.data as CartResponseModel | undefined);

            if (cartData?.items && Array.isArray(cartData.items)) {
                const apiCartItems = cartData.items.map(mapApiResponseToCartItem);
                setCartItems(apiCartItems);
                await StorageManager.setItem(CART_STORAGE_KEY, apiCartItems);
                return true;
            }

            return false;
        } catch (error) {
            console.error('Error fetching cart from API:', error);
            return false;
        }
    }, []);

    /**
     * Updates local cart state optimistically
     */
    const updateLocalCartState = useCallback((itemId: number, quantityToAdd: number, item: any) => {
        setCartItems((prevItems) => {
            const existingItem = prevItems.find((i) => i.id === itemId);

            if (existingItem) {
                return prevItems.map((i) =>
                    i.id === itemId ? { ...i, quantity: i.quantity + quantityToAdd } : i
                );
            }

            return [...prevItems, { ...item, quantity: quantityToAdd }];
        });
    }, []);

    /**
     * Reverts optimistic cart update
     */
    const revertCartUpdate = useCallback((itemId: number, quantityToRemove: number) => {
        setCartItems((prevItems) => {
            const existingItem = prevItems.find((i) => i.id === itemId);

            if (!existingItem) return prevItems;

            if (existingItem.quantity > quantityToRemove) {
                return prevItems.map((i) =>
                    i.id === itemId ? { ...i, quantity: i.quantity - quantityToRemove } : i
                );
            }

            return prevItems.filter((i) => i.id !== itemId);
        });
    }, []);

    /**
     * Adds item to cart
     */
    const addToCart = useCallback(async (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
        const quantityToAdd = item.quantity || 1;

        // Optimistically update local state
        updateLocalCartState(item.id, quantityToAdd, item);

        try {
            const token = await StorageManager.getItem(constant.shareInstanceKey.authToken);

            if (!token || !item.categoryId || !item.productId) {
                return;
            }

            // Validate price
            const itemPrice = validatePrice(item.price);

            if (itemPrice <= 0) {
                console.error('Invalid price for cart item:', {
                    item,
                    originalPrice: item.price,
                    calculatedPrice: itemPrice
                });

                Alert.alert(
                    'Error',
                    `Cannot add "${item.name}" to cart: Invalid price (₹${item.price || 'N/A'}). Please try again.`
                );

                revertCartUpdate(item.id, quantityToAdd);
                return;
            }

            // Build API payload
            const apiPayload = buildCartPayload(item, quantityToAdd, itemPrice);

            // Final price validation
            if (!apiPayload.price || isNaN(apiPayload.price) || apiPayload.price <= 0) {
                console.error('Price validation failed:', {
                    payload: apiPayload,
                    itemPrice,
                    originalItem: item
                });

                Alert.alert('Error', 'Invalid price. Cannot add item to cart.');
                revertCartUpdate(item.id, quantityToAdd);
                return;
            }

            // Call API to add to cart
            const response = await ApiManager.post({
                endpoint: constant.apiEndPoints.addToCart,
                params: apiPayload,
                token,
                showError: true,
                showSuccess: false,
            });

            // Reload cart from API if successful
            if (response?.data) {
                await fetchCartFromApi(token);
            }
        } catch (error) {
            console.error('Error adding to cart via API:', error);
        }
    }, [updateLocalCartState, revertCartUpdate, fetchCartFromApi]);

    /**
     * Removes item from cart
     */
    const removeFromCart = useCallback(async (itemId: number) => {
        try {
            const token = await StorageManager.getItem(constant.shareInstanceKey.authToken);
            const cartItem = cartItems.find(item => item.id === itemId);

            if (token && cartItem?.cartItemId) {
                await ApiManager.delete({
                    endpoint: `${constant.apiEndPoints.removeFromCart}/${cartItem.cartItemId}`,
                    params: { quantity: cartItem.quantity },
                    token,
                    showError: true,
                    showSuccess: false,
                });

                await fetchCartFromApi(token);
                return;
            }

            // Fallback to local state update
            setCartItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
        } catch (error) {
            console.error('Error removing from cart:', error);
            setCartItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
        }
    }, [cartItems, fetchCartFromApi]);

    /**
     * Updates item quantity in cart
     */
    const updateQuantity = useCallback(async (itemId: number, quantity: number) => {
        if (quantity <= 0) {
            await removeFromCart(itemId);
            return;
        }

        try {
            const token = await StorageManager.getItem(constant.shareInstanceKey.authToken);
            const cartItem = cartItems.find(item => item.id === itemId);

            if (token && cartItem?.cartItemId) {
                const response = await ApiManager.put({
                    endpoint: `${constant.apiEndPoints.updateCart}/${cartItem.cartItemId}`,
                    params: { quantity },
                    token,
                    showError: true,
                    showSuccess: false,
                });

                console.log('updateQuantity response', response);

                if (response?.data) {
                    await fetchCartFromApi(token);
                    return;
                }
            }

            // Fallback to local state update
            setCartItems((prevItems) =>
                prevItems.map((item) =>
                    item.id === itemId ? { ...item, quantity } : item
                )
            );
        } catch (error) {
            console.error('Error updating cart quantity:', error);
            setCartItems((prevItems) =>
                prevItems.map((item) =>
                    item.id === itemId ? { ...item, quantity } : item
                )
            );
        }
    }, [cartItems, removeFromCart, fetchCartFromApi]);

    /**
     * Clears all items from cart
     */
    const clearCart = useCallback(async () => {
        // Optimistically clear local state
        setCartItems([]);

        try {
            const token = await StorageManager.getItem(constant.shareInstanceKey.authToken);

            if (token) {
                await ApiManager.delete({
                    endpoint: constant.apiEndPoints.clearCart,
                    token,
                    showError: true,
                    showSuccess: false,
                });

                // Clear local storage
                await StorageManager.removeItem(CART_STORAGE_KEY);
            } else {
                // If no token, just clear local storage
                await StorageManager.removeItem(CART_STORAGE_KEY);
            }
        } catch (error) {
            console.error('Error clearing cart via API:', error);
            // Even if API fails, keep local state cleared
            // User can refresh to get server state if needed
            try {
                await StorageManager.removeItem(CART_STORAGE_KEY);
            } catch (storageError) {
                console.error('Error clearing cart from storage:', storageError);
            }
        }
    }, []);

    /**
     * Checks if item exists in cart
     */
    const isInCart = useCallback((itemId: number): boolean => {
        return cartItems.some((item) => item.id === itemId);
    }, [cartItems]);

    /**
     * Gets specific cart item by ID
     */
    const getCartItem = useCallback((itemId: number): CartItem | undefined => {
        return cartItems.find((item) => item.id === itemId);
    }, [cartItems]);

    // ========================================================================
    // COMPUTED VALUES
    // ========================================================================

    const cartCount = useMemo(() => {
        return cartItems.reduce((total, item) => total + item.quantity, 0);
    }, [cartItems]);

    const cartTotal = useMemo(() => {
        return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
    }, [cartItems]);

    // ========================================================================
    // CONTEXT VALUE
    // ========================================================================

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
    }), [
        cartItems,
        cartCount,
        cartTotal,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isInCart,
        getCartItem
    ]);

    return (
        <CartContext.Provider value={contextValue}>
            {children}
        </CartContext.Provider>
    );
};

// ============================================================================
// HOOK
// ============================================================================

export const useCart = (): CartContextType => {
    const context = useContext(CartContext);

    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }

    return context;
};