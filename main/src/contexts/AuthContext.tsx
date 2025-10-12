import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import StorageManager from '../managers/StorageManager';
import constant from '../utilities/constant';

interface AuthContextType {
    isLoggedIn: boolean;
    isLoading: boolean;
    login: (token: string, userData?: any) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        checkLoginStatus();
    }, []);

    const checkLoginStatus = async () => {
        try {
            await StorageManager.sync();
            const token = await StorageManager.getItem(constant.shareInstanceKey.authToken);
            console.log('🔍 Auth Check:', token ? 'Logged in ✅' : 'Not logged in ❌');
            setIsLoggedIn(!!token);
        } catch (error) {
            console.error('❌ Error checking auth status:', error);
            setIsLoggedIn(false);
        } finally {
            setTimeout(() => setIsLoading(false), 1500);
        }
    };

    const login = async (token: string, userData?: any) => {
        try {
            console.log('💾 Storing auth data...');

            await StorageManager.setItem(constant.shareInstanceKey.authToken, token);

            if (userData) {
                await StorageManager.setItem(constant.shareInstanceKey.userData, userData);
            }

            console.log('✅ Auth data stored successfully');
            setIsLoggedIn(true);
        } catch (error) {
            console.error('❌ Error during login:', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            console.log('🔄 Logging out...');
            await StorageManager.clearAll();
            console.log('✅ Storage cleared');
            setIsLoggedIn(false);
        } catch (error) {
            console.error('❌ Error during logout:', error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{ isLoggedIn, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};