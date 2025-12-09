import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiManager from '../managers/ApiManager';
import StorageManager from '../managers/StorageManager';
import constant from '../utilities/constant';

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
            const token = await StorageManager.getItem(constant.shareInstanceKey.authToken);

            if (!token) {
                // If no token, try to load from local storage as fallback
                const savedAddressesJson = await AsyncStorage.getItem(ADDRESS_STORAGE_KEY);
                const savedSelectedIdJson = await AsyncStorage.getItem(SELECTED_ADDRESS_KEY);

                if (savedAddressesJson) {
                    const savedAddresses = JSON.parse(savedAddressesJson);
                    if (Array.isArray(savedAddresses)) {
                        setAddresses(savedAddresses);
                        const savedSelectedId = savedSelectedIdJson ? JSON.parse(savedSelectedIdJson) : null;
                        if (savedSelectedId) {
                            const selected = savedAddresses.find((addr: Address) => addr.id === savedSelectedId);
                            if (selected) {
                                setSelectedAddress(selected);
                            }
                        }
                    }
                }
                return;
            }

            // Fetch addresses from API
            const response = await ApiManager.get({
                endpoint: constant.apiEndPoints.addressList,
                token: token,
                showError: false, // Don't show error toast, handle silently
            });

            if (response?.data && Array.isArray(response.data)) {
                // Map API response to Address format
                const apiAddresses: Address[] = response.data.map((addr: any) => ({
                    id: addr.id?.toString() || addr.id,
                    name: addr.full_name || addr.name || '',
                    mobile: addr.phone || addr.mobile || '',
                    addressLine1: addr.address || addr.addressLine1 || '',
                    addressLine2: addr.address_line2 || addr.addressLine2 || '',
                    city: addr.city || '',
                    state: addr.state || '',
                    pincode: addr.pincode || '',
                    landmark: addr.landmark || '',
                    addressType: (addr.address_type?.toLowerCase() || addr.addressType || 'home') as 'home' | 'work' | 'other',
                    isDefault: addr.is_default || addr.isDefault || false,
                }));

                setAddresses(apiAddresses);

                // Set selected address (default or first)
                const defaultAddr = apiAddresses.find(addr => addr.isDefault) || apiAddresses[0];
                if (defaultAddr) {
                    setSelectedAddress(defaultAddr);
                    await AsyncStorage.setItem(SELECTED_ADDRESS_KEY, JSON.stringify(defaultAddr.id));
                }
            } else {
                // Fallback to local storage if API returns no data
                const savedAddressesJson = await AsyncStorage.getItem(ADDRESS_STORAGE_KEY);
                if (savedAddressesJson) {
                    const savedAddresses = JSON.parse(savedAddressesJson);
                    if (Array.isArray(savedAddresses)) {
                        setAddresses(savedAddresses);
                    }
                }
            }
        } catch (error) {
            console.error('Error loading addresses:', error);
            // Fallback to local storage on error
            try {
                const savedAddressesJson = await AsyncStorage.getItem(ADDRESS_STORAGE_KEY);
                if (savedAddressesJson) {
                    const savedAddresses = JSON.parse(savedAddressesJson);
                    if (Array.isArray(savedAddresses)) {
                        setAddresses(savedAddresses);
                    }
                }
            } catch (storageError) {
                console.error('Error loading from local storage:', storageError);
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    const addAddress = useCallback(async (addressData: Omit<Address, 'id'>) => {
        try {
            const token = await StorageManager.getItem(constant.shareInstanceKey.authToken);

            // Prepare API payload
            const apiPayload = {
                full_name: addressData.name,
                address_type: addressData.addressType.charAt(0).toUpperCase() + addressData.addressType.slice(1), // Capitalize first letter
                phone: addressData.mobile,
                address: addressData.addressLine1,
                city: addressData.city,
                state: addressData.state,
                pincode: addressData.pincode,
                is_default: addressData.isDefault,
            };

            if (token) {
                // Call API to add address
                const response = await ApiManager.post({
                    endpoint: constant.apiEndPoints.addAddress,
                    params: apiPayload,
                    token: token,
                    showError: true,
                    showSuccess: false,
                });

                if (response?.data) {
                    // Map API response to Address format
                    const newAddress: Address = {
                        id: response.data.id?.toString() || response.data.id,
                        name: response.data.full_name || response.data.name || addressData.name,
                        mobile: response.data.phone || response.data.mobile || addressData.mobile,
                        addressLine1: response.data.address || response.data.addressLine1 || addressData.addressLine1,
                        addressLine2: response.data.address_line2 || response.data.addressLine2 || addressData.addressLine2,
                        city: response.data.city || addressData.city,
                        state: response.data.state || addressData.state,
                        pincode: response.data.pincode || addressData.pincode,
                        landmark: response.data.landmark || addressData.landmark,
                        addressType: (response.data.address_type?.toLowerCase() || addressData.addressType) as 'home' | 'work' | 'other',
                        isDefault: response.data.is_default || response.data.isDefault || addressData.isDefault,
                    };

                    const updatedAddresses = [...addresses, newAddress];
                    setAddresses(updatedAddresses);
                    await AsyncStorage.setItem(ADDRESS_STORAGE_KEY, JSON.stringify(updatedAddresses));

                    // If it's the first address or default, select it
                    if (addresses.length === 0 || newAddress.isDefault) {
                        setSelectedAddress(newAddress);
                        await AsyncStorage.setItem(SELECTED_ADDRESS_KEY, JSON.stringify(newAddress.id));
                    }

                    // Reload addresses from API to ensure sync
                    await loadAddresses();
                } else {
                    throw new Error('Failed to add address');
                }
            } else {
                // Fallback to local storage if no token
                const newAddress: Address = {
                    ...addressData,
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                };

                const updatedAddresses = [...addresses, newAddress];
                setAddresses(updatedAddresses);
                await AsyncStorage.setItem(ADDRESS_STORAGE_KEY, JSON.stringify(updatedAddresses));

                if (addresses.length === 0 || newAddress.isDefault) {
                    setSelectedAddress(newAddress);
                    await AsyncStorage.setItem(SELECTED_ADDRESS_KEY, JSON.stringify(newAddress.id));
                }
            }
        } catch (error) {
            console.error('Error adding address:', error);
            throw error;
        }
    }, [addresses, loadAddresses]);

    const updateAddress = useCallback(async (id: string, addressData: Partial<Address>) => {
        try {
            const token = await StorageManager.getItem(constant.shareInstanceKey.authToken);

            // Prepare API payload
            const apiPayload: any = {};
            if (addressData.name) apiPayload.full_name = addressData.name;
            if (addressData.mobile) apiPayload.phone = addressData.mobile;
            if (addressData.addressLine1) apiPayload.address = addressData.addressLine1;
            if (addressData.city) apiPayload.city = addressData.city;
            if (addressData.state) apiPayload.state = addressData.state;
            if (addressData.pincode) apiPayload.pincode = addressData.pincode;
            if (addressData.addressType) {
                apiPayload.address_type = addressData.addressType.charAt(0).toUpperCase() + addressData.addressType.slice(1);
            }
            if (addressData.isDefault !== undefined) apiPayload.is_default = addressData.isDefault;

            if (token) {
                // Call API to update address
                const response = await ApiManager.put({
                    endpoint: `${constant.apiEndPoints.updateAddress}/${id}`,
                    params: apiPayload,
                    token: token,
                    showError: true,
                    showSuccess: false,
                });

                if (response?.data) {
                    // Reload addresses from API to ensure sync
                    await loadAddresses();
                } else {
                    throw new Error('Failed to update address');
                }
            } else {
                // Fallback to local storage if no token
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
            }
        } catch (error) {
            console.error('Error updating address:', error);
            throw error;
        }
    }, [addresses, selectedAddress, loadAddresses]);

    const deleteAddress = useCallback(async (id: string) => {
        try {
            const token = await StorageManager.getItem(constant.shareInstanceKey.authToken);

            if (token) {
                // Call API to delete address
                await ApiManager.delete({
                    endpoint: `${constant.apiEndPoints.deleteAddress}/${id}`,
                    token: token,
                    showError: true,
                    showSuccess: false,
                });

                // Remove from local state
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

                // Reload addresses from API to ensure sync
                await loadAddresses();
            } else {
                // Fallback to local storage if no token
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
            }
        } catch (error) {
            console.error('Error deleting address:', error);
            throw error;
        }
    }, [addresses, selectedAddress, loadAddresses]);

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
            const token = await StorageManager.getItem(constant.shareInstanceKey.authToken);

            if (token) {
                // Call API to set default address
                await ApiManager.post({
                    endpoint: `${constant.apiEndPoints.setAddressDefault}/${id}/set-default`,
                    params: {}, // API might not need body, but keeping it flexible
                    token: token,
                    showError: true,
                    showSuccess: false,
                });

                // Update local state
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

                // Reload addresses from API to ensure sync
                await loadAddresses();
            } else {
                // Fallback to local storage if no token
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
            }
        } catch (error) {
            console.error('Error setting default address:', error);
            throw error;
        }
    }, [addresses, loadAddresses]);

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

