import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    ReactNode,
} from 'react';
import StorageManager, { StorageKey } from '../managers/StorageManager';
import constant from '../utilities/constant';

export interface AuthUser {
    id?: number;
    name?: string;
    mobile?: string;
    [key: string]: any;
}

interface AuthContextType {
    isLoggedIn: boolean;
    isLoading: boolean;
    user: AuthUser | null;
    login: (token: string, userData?: AuthUser) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<AuthUser | null>(null);

    useEffect(() => {
        const bootstrapAuth = async () => {
            try {
                await StorageManager.sync();
                const token = await StorageManager.getItem<string>(constant.shareInstanceKey.authToken);
                const savedUser = await StorageManager.getItem<AuthUser>(constant.shareInstanceKey.userData);

                setIsLoggedIn(!!token);
                setUser(token ? savedUser : null);
            } catch (error) {
                console.error('❌ Error checking auth status:', error);
                setIsLoggedIn(false);
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        void bootstrapAuth();
    }, []);

    const login = useCallback(async (token: string, userData?: AuthUser) => {
        try {
            await StorageManager.setItem(StorageKey.TOKEN, token);

            if (userData) {
                await StorageManager.setItem(StorageKey.USER, userData);
                setUser(userData);
            }

            setIsLoggedIn(true);
        } catch (error) {
            console.error('❌ Error during login:', error);
            throw error;
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await StorageManager.clearAll();
            setIsLoggedIn(false);
            setUser(null);
        } catch (error) {
            console.error('❌ Error during logout:', error);
            throw error;
        }
    }, []);

    return (
        <AuthContext.Provider value={{ isLoggedIn, isLoading, user, login, logout }}>
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