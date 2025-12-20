import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import StorageManager, { StorageKey } from '../managers/StorageManager';
import ApiManager from '../managers/ApiManager';
import constant from '../utilities/constant';

export interface CartItem {
    id: number;
    name: string;
    price: number;
    quantity: number;
    image: string;
    unit: string;
    // Additional fields for API integration
    categoryId?: number;
    productId?: number;
    cartItemId?: number; // ID from API response (for update/delete operations)
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

    // Load cart from API on mount
    useEffect(() => {
        const loadCart = async () => {
            try {
                const token = await StorageManager.getItem(constant.shareInstanceKey.authToken);

                if (token) {
                    // Fetch cart from API
                    const response = await ApiManager.get({
                        endpoint: constant.apiEndPoints.getCart,
                        token: token,
                        showError: false, // Don't show error toast on initial load
                    });
                    console.log("response", response)
                    if (response?.data && Array.isArray(response.data)) {
                        // Map API response to CartItem format
                        const apiCartItems: CartItem[] = response.data.map((item: any) => ({
                            id: item.product_id || item.product?.id || item.id,
                            name: item.product?.name || item.name || '',
                            price: item.price || 0,
                            quantity: item.quantity || 0,
                            image: item.product?.image || item.image || '',
                            unit: item.unit_type || item.unit || '',
                            categoryId: item.category_id || item.category?.id,
                            productId: item.product_id || item.product?.id,
                            cartItemId: item.id || item.cart_item_id,
                            deliveryCharge: item.delivery_charge || item.deliveryCharge,
                            deliveryDate: item.delivery_date || item.deliveryDate,
                        }));

                        setCartItems(apiCartItems);
                        // Also save to local storage as backup
                        await StorageManager.setItem(CART_STORAGE_KEY, apiCartItems);
                    } else {
                        // Fallback to local storage if API returns no data
                        const storedCart = await StorageManager.getItem<CartItem[]>(CART_STORAGE_KEY);
                        if (storedCart && Array.isArray(storedCart)) {
                            setCartItems(storedCart);
                        }
                    }
                } else {
                    // No token, load from local storage
                    const storedCart = await StorageManager.getItem<CartItem[]>(CART_STORAGE_KEY);
                    if (storedCart && Array.isArray(storedCart)) {
                        setCartItems(storedCart);
                    }
                }
            } catch (error) {
                console.error('Error loading cart:', error);
                // Fallback to local storage on error
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

    const addToCart = useCallback(async (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
        const quantityToAdd = item.quantity || 1;

        // Always update local state immediately for better UX
        const updateLocalState = () => {
            setCartItems((prevItems) => {
                const existingItem = prevItems.find((i) => i.id === item.id);

                if (existingItem) {
                    return prevItems.map((i) =>
                        i.id === item.id ? { ...i, quantity: i.quantity + quantityToAdd } : i
                    );
                } else {
                    return [...prevItems, { ...item, quantity: quantityToAdd }];
                }
            });
        };

        // Update local state immediately
        updateLocalState();

        try {
            const token = await StorageManager.getItem(constant.shareInstanceKey.authToken);

            if (!token) {
                console.log('⚠️ No token found, cart item saved locally only');
                return;
            }

            if (!item.categoryId || !item.productId) {
                console.warn('⚠️ Missing categoryId or productId, cart item saved locally only. Item:', item);
                return;
            }

            // Validate price - it's required by the database
            // Try multiple ways to extract a valid price
            let itemPrice: number;

            if (typeof item.price === 'number' && !isNaN(item.price) && item.price > 0) {
                itemPrice = item.price;
            } else if (typeof item.price === 'string') {
                const parsed = parseFloat(item.price);
                if (!isNaN(parsed) && parsed > 0) {
                    itemPrice = parsed;
                } else {
                    itemPrice = 0;
                }
            } else {
                itemPrice = 0;
            }

            // Final validation - price must be a positive number
            if (!itemPrice || isNaN(itemPrice) || itemPrice <= 0) {
                console.error('❌ Invalid price for cart item:', {
                    item,
                    originalPrice: item.price,
                    priceType: typeof item.price,
                    calculatedPrice: itemPrice
                });
                Alert.alert(
                    'Error',
                    `Cannot add "${item.name}" to cart: Invalid price (₹${item.price || 'N/A'}). Please try again.`
                );
                // Revert local state update
                setCartItems((prevItems) => {
                    const existingItem = prevItems.find((i) => i.id === item.id);
                    if (existingItem && existingItem.quantity > quantityToAdd) {
                        return prevItems.map((i) =>
                            i.id === item.id ? { ...i, quantity: i.quantity - quantityToAdd } : i
                        );
                    } else {
                        return prevItems.filter((i) => i.id !== item.id);
                    }
                });
                return;
            }

            // Ensure price is a number (not string) for JSON serialization
            itemPrice = Number(itemPrice);

            // Call API to add to cart
            // Explicitly ensure all fields are properly typed and included
            // IMPORTANT: price must be included as a number, not string
            // Build payload step by step to ensure price is never lost
            const apiPayload: Record<string, any> = {};

            // Add required fields one by one
            apiPayload.category_id = Number(item.categoryId);
            apiPayload.product_id = Number(item.productId);
            apiPayload.quantity = Number(quantityToAdd);
            apiPayload.unit_type = String(item.unit || 'kg');
            apiPayload.price = Number(itemPrice); // CRITICAL: Must be a number, required by database
            apiPayload.delivery_charge = Number(item.deliveryCharge || 0);
            apiPayload.delivery_date = String(item.deliveryDate || new Date().toISOString().split('T')[0]);

            // Explicitly verify price was set
            if (!('price' in apiPayload) || apiPayload.price === undefined || apiPayload.price === null || isNaN(apiPayload.price)) {
                console.error('❌ CRITICAL: Price failed to be set in payload!', {
                    itemPrice,
                    item,
                    apiPayload
                });
                apiPayload.price = Number(itemPrice); // Force set it again
            }

            // Final validation - ensure price is definitely included and valid
            if (!apiPayload.price || isNaN(apiPayload.price) || apiPayload.price <= 0) {
                console.error('❌ Price validation failed after payload creation:', {
                    payload: apiPayload,
                    itemPrice,
                    originalItem: item
                });
                Alert.alert('Error', 'Invalid price. Cannot add item to cart.');
                // Revert local state
                setCartItems((prevItems) => {
                    const existingItem = prevItems.find((i) => i.id === item.id);
                    if (existingItem && existingItem.quantity > quantityToAdd) {
                        return prevItems.map((i) =>
                            i.id === item.id ? { ...i, quantity: i.quantity - quantityToAdd } : i
                        );
                    } else {
                        return prevItems.filter((i) => i.id !== item.id);
                    }
                });
                return;
            }

            // Log payload for debugging
            if (__DEV__) {
                console.log('🛒 Add to Cart Payload:', JSON.stringify(apiPayload, null, 2));
                console.log('🛒 Price in payload:', apiPayload.price, 'Type:', typeof apiPayload.price);
                console.log('🛒 All payload keys:', Object.keys(apiPayload));
            }

            // Final safety check - ensure price exists before API call
            if (!('price' in apiPayload) || apiPayload.price === undefined || apiPayload.price === null) {
                console.error('❌ CRITICAL: Price missing from payload before API call!', apiPayload);
                Alert.alert('Error', 'Price information is missing. Cannot add item to cart.');
                // Revert local state
                setCartItems((prevItems) => {
                    const existingItem = prevItems.find((i) => i.id === item.id);
                    if (existingItem && existingItem.quantity > quantityToAdd) {
                        return prevItems.map((i) =>
                            i.id === item.id ? { ...i, quantity: i.quantity - quantityToAdd } : i
                        );
                    } else {
                        return prevItems.filter((i) => i.id !== item.id);
                    }
                });
                return;
            }

            // Log the exact payload being sent
            if (__DEV__) {
                console.log('🚀 Sending to API:', {
                    endpoint: constant.apiEndPoints.addToCart,
                    payload: apiPayload,
                    priceIncluded: 'price' in apiPayload,
                    priceValue: apiPayload.price,
                    priceType: typeof apiPayload.price,
                    payloadStringified: JSON.stringify(apiPayload),
                });
            }

            const response = await ApiManager.post({
                endpoint: constant.apiEndPoints.addToCart,
                params: apiPayload,
                token: token,
                showError: true,
                showSuccess: false,
            });

            if (response?.data) {
                // Reload cart from API to get updated data with cartItemId
                try {
                    const cartResponse = await ApiManager.get({
                        endpoint: constant.apiEndPoints.getCart,
                        token: token,
                        showError: false,
                    });

                    if (cartResponse?.data && Array.isArray(cartResponse.data)) {
                        const apiCartItems: CartItem[] = cartResponse.data.map((cartItem: any) => ({
                            id: cartItem.product_id || cartItem.product?.id || cartItem.id,
                            name: cartItem.product?.name || cartItem.name || '',
                            price: cartItem.price || 0,
                            quantity: cartItem.quantity || 0,
                            image: cartItem.product?.image || cartItem.image || '',
                            unit: cartItem.unit_type || cartItem.unit || '',
                            categoryId: cartItem.category_id || cartItem.category?.id,
                            productId: cartItem.product_id || cartItem.product?.id,
                            cartItemId: cartItem.id || cartItem.cart_item_id,
                            deliveryCharge: cartItem.delivery_charge || cartItem.deliveryCharge,
                            deliveryDate: cartItem.delivery_date || cartItem.deliveryDate,
                        }));

                        setCartItems(apiCartItems);
                        await StorageManager.setItem(CART_STORAGE_KEY, apiCartItems);
                        return;
                    }
                } catch (reloadError) {
                    console.error('Error reloading cart after add:', reloadError);
                    // Keep local state, don't throw error
                }
            }
        } catch (error) {
            console.error('Error adding to cart via API:', error);
            // Local state already updated, just log the error
        }
    }, []);

    const removeFromCart = useCallback(async (itemId: number) => {
        try {
            const token = await StorageManager.getItem(constant.shareInstanceKey.authToken);
            const cartItem = cartItems.find(item => item.id === itemId);

            if (token && cartItem?.cartItemId) {
                // Call API to remove from cart
                await ApiManager.delete({
                    endpoint: `${constant.apiEndPoints.removeFromCart}/${cartItem.cartItemId}`,
                    params: { quantity: cartItem.quantity }, // Some APIs might need quantity
                    token: token,
                    showError: true,
                    showSuccess: false,
                });

                // Reload cart from API
                const cartResponse = await ApiManager.get({
                    endpoint: constant.apiEndPoints.getCart,
                    token: token,
                    showError: false,
                });

                if (cartResponse?.data && Array.isArray(cartResponse.data)) {
                    const apiCartItems: CartItem[] = cartResponse.data.map((item: any) => ({
                        id: item.product_id || item.product?.id || item.id,
                        name: item.product?.name || item.name || '',
                        price: item.price || 0,
                        quantity: item.quantity || 0,
                        image: item.product?.image || item.image || '',
                        unit: item.unit_type || item.unit || '',
                        categoryId: item.category_id || item.category?.id,
                        productId: item.product_id || item.product?.id,
                        cartItemId: item.id || item.cart_item_id,
                        deliveryCharge: item.delivery_charge || item.deliveryCharge,
                        deliveryDate: item.delivery_date || item.deliveryDate,
                    }));

                    setCartItems(apiCartItems);
                    await StorageManager.setItem(CART_STORAGE_KEY, apiCartItems);
                    return;
                }
            }

            // Fallback to local state update
            setCartItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
        } catch (error) {
            console.error('Error removing from cart:', error);
            // Fallback to local state update on error
            setCartItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
        }
    }, [cartItems]);

    const updateQuantity = useCallback(async (itemId: number, quantity: number) => {
        if (quantity <= 0) {
            await removeFromCart(itemId);
            return;
        }

        try {
            const token = await StorageManager.getItem(constant.shareInstanceKey.authToken);
            const cartItem = cartItems.find(item => item.id === itemId);

            if (token && cartItem?.cartItemId) {
                // Call API to update cart quantity
                const response = await ApiManager.put({
                    endpoint: `${constant.apiEndPoints.updateCart}/${cartItem.cartItemId}`,
                    params: { quantity },
                    token: token,
                    showError: true,
                    showSuccess: false,
                });

                if (response?.data) {
                    // Reload cart from API
                    const cartResponse = await ApiManager.get({
                        endpoint: constant.apiEndPoints.getCart,
                        token: token,
                        showError: false,
                    });
                    console.log('calling')
                    if (cartResponse?.data && Array.isArray(cartResponse.data)) {
                        const apiCartItems: CartItem[] = cartResponse.data.map((item: any) => ({
                            id: item.product_id || item.product?.id || item.id,
                            name: item.product?.name || item.name || '',
                            price: item.price || 0,
                            quantity: item.quantity || 0,
                            image: item.product?.image || item.image || '',
                            unit: item.unit_type || item.unit || '',
                            categoryId: item.category_id || item.category?.id,
                            productId: item.product_id || item.product?.id,
                            cartItemId: item.id || item.cart_item_id,
                            deliveryCharge: item.delivery_charge || item.deliveryCharge,
                            deliveryDate: item.delivery_date || item.deliveryDate,
                        }));

                        setCartItems(apiCartItems);
                        await StorageManager.setItem(CART_STORAGE_KEY, apiCartItems);
                        return;
                    }
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
            // Fallback to local state update on error
            setCartItems((prevItems) =>
                prevItems.map((item) =>
                    item.id === itemId ? { ...item, quantity } : item
                )
            );
        }
    }, [cartItems, removeFromCart]);

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