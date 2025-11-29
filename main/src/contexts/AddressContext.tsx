import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Address {
    id: string;
    name: string;
    mobile: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
    addressType: 'home' | 'work' | 'other';
    isDefault: boolean;
}

interface AddressContextType {
    addresses: Address[];
    selectedAddress: Address | null;
    isLoading: boolean;
    addAddress: (address: Omit<Address, 'id'>) => Promise<void>;
    updateAddress: (id: string, address: Partial<Address>) => Promise<void>;
    deleteAddress: (id: string) => Promise<void>;
    selectAddress: (id: string) => Promise<void>;
    setDefaultAddress: (id: string) => Promise<void>;
}

const AddressContext = createContext<AddressContextType | undefined>(undefined);

export const useAddress = () => {
    const context = useContext(AddressContext);
    if (!context) {
        throw new Error('useAddress must be used within AddressProvider');
    }
    return context;
};

// Using direct string keys since StorageManager uses enum
const ADDRESS_STORAGE_KEY = '@GOFManager:addresses';
const SELECTED_ADDRESS_KEY = '@GOFManager:selectedAddress';

export const AddressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load addresses and selected address on mount
    useEffect(() => {
        loadAddresses();
    }, []);

    const loadAddresses = useCallback(async () => {
        try {
            setIsLoading(true);
            const [savedAddressesJson, savedSelectedIdJson] = await Promise.all([
                AsyncStorage.getItem(ADDRESS_STORAGE_KEY),
                AsyncStorage.getItem(SELECTED_ADDRESS_KEY),
            ]);
            
            const savedAddresses = savedAddressesJson ? JSON.parse(savedAddressesJson) : null;
            const savedSelectedId = savedSelectedIdJson ? JSON.parse(savedSelectedIdJson) : null;

            if (savedAddresses && Array.isArray(savedAddresses)) {
                setAddresses(savedAddresses);
                
                // Set selected address
                if (savedSelectedId) {
                    const selected = savedAddresses.find(addr => addr.id === savedSelectedId);
                    if (selected) {
                        setSelectedAddress(selected);
                    } else if (savedAddresses.length > 0) {
                        // If selected address not found, use default or first address
                    const defaultAddr = savedAddresses.find(addr => addr.isDefault) || savedAddresses[0];
                    setSelectedAddress(defaultAddr);
                    await AsyncStorage.setItem(SELECTED_ADDRESS_KEY, JSON.stringify(defaultAddr.id));
                }
            } else if (savedAddresses.length > 0) {
                const defaultAddr = savedAddresses.find(addr => addr.isDefault) || savedAddresses[0];
                setSelectedAddress(defaultAddr);
                await AsyncStorage.setItem(SELECTED_ADDRESS_KEY, JSON.stringify(defaultAddr.id));
            }
            }
        } catch (error) {
            console.error('Error loading addresses:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const addAddress = useCallback(async (addressData: Omit<Address, 'id'>) => {
        try {
            const newAddress: Address = {
                ...addressData,
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            };

            const updatedAddresses = [...addresses, newAddress];
            setAddresses(updatedAddresses);
            await AsyncStorage.setItem(ADDRESS_STORAGE_KEY, JSON.stringify(updatedAddresses));

            // If it's the first address or default, select it
            if (addresses.length === 0 || newAddress.isDefault) {
                setSelectedAddress(newAddress);
                await AsyncStorage.setItem(SELECTED_ADDRESS_KEY, JSON.stringify(newAddress.id));
            }
        } catch (error) {
            console.error('Error adding address:', error);
            throw error;
        }
    }, [addresses]);

    const updateAddress = useCallback(async (id: string, addressData: Partial<Address>) => {
        try {
            const updatedAddresses = addresses.map(addr =>
                addr.id === id ? { ...addr, ...addressData } : addr
            );
            setAddresses(updatedAddresses);
            await AsyncStorage.setItem(ADDRESS_STORAGE_KEY, JSON.stringify(updatedAddresses));

            // Update selected address if it was updated
            if (selectedAddress?.id === id) {
                const updated = updatedAddresses.find(addr => addr.id === id);
                if (updated) {
                    setSelectedAddress(updated);
                }
            }
        } catch (error) {
            console.error('Error updating address:', error);
            throw error;
        }
    }, [addresses, selectedAddress]);

    const deleteAddress = useCallback(async (id: string) => {
        try {
            const updatedAddresses = addresses.filter(addr => addr.id !== id);
            setAddresses(updatedAddresses);
            await AsyncStorage.setItem(ADDRESS_STORAGE_KEY, JSON.stringify(updatedAddresses));

            // If deleted address was selected, select another one
            if (selectedAddress?.id === id) {
                if (updatedAddresses.length > 0) {
                    const newSelected = updatedAddresses.find(addr => addr.isDefault) || updatedAddresses[0];
                    setSelectedAddress(newSelected);
                    await AsyncStorage.setItem(SELECTED_ADDRESS_KEY, JSON.stringify(newSelected.id));
                } else {
                    setSelectedAddress(null);
                    await AsyncStorage.removeItem(SELECTED_ADDRESS_KEY);
                }
            }
        } catch (error) {
            console.error('Error deleting address:', error);
            throw error;
        }
    }, [addresses, selectedAddress]);

    const selectAddress = useCallback(async (id: string) => {
        try {
            const address = addresses.find(addr => addr.id === id);
            if (address) {
                setSelectedAddress(address);
                await AsyncStorage.setItem(SELECTED_ADDRESS_KEY, JSON.stringify(id));
            }
        } catch (error) {
            console.error('Error selecting address:', error);
            throw error;
        }
    }, [addresses]);

    const setDefaultAddress = useCallback(async (id: string) => {
        try {
            const updatedAddresses = addresses.map(addr => ({
                ...addr,
                isDefault: addr.id === id,
            }));
            setAddresses(updatedAddresses);
            await AsyncStorage.setItem(ADDRESS_STORAGE_KEY, JSON.stringify(updatedAddresses));

            // Select the default address
            const defaultAddr = updatedAddresses.find(addr => addr.id === id);
            if (defaultAddr) {
                setSelectedAddress(defaultAddr);
                await AsyncStorage.setItem(SELECTED_ADDRESS_KEY, JSON.stringify(id));
            }
        } catch (error) {
            console.error('Error setting default address:', error);
            throw error;
        }
    }, [addresses]);

    const value = useMemo(() => ({
        addresses,
        selectedAddress,
        isLoading,
        addAddress,
        updateAddress,
        deleteAddress,
        selectAddress,
        setDefaultAddress,
    }), [addresses, selectedAddress, isLoading, addAddress, updateAddress, deleteAddress, selectAddress, setDefaultAddress]);

    return (
        <AddressContext.Provider value={value}>
            {children}
        </AddressContext.Provider>
    );
};

