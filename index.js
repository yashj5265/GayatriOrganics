/**
 * @format
 */

import { AppRegistry, StatusBar, Platform } from 'react-native';
import { name as appName } from './app.json';
import NavigationManager from './main/src/navigations/NavigationManager';
import { ThemeProvider } from './main/src/contexts/ThemeProvider';
import { AuthProvider } from './main/src/contexts/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CartProvider } from './main/src/contexts/CardContext';
import { AddressProvider } from './main/src/contexts/AddressContext';
import { WishlistProvider } from './main/src/contexts/WishlistContext';
import FlashMessage from 'react-native-flash-message';

const MainApp = () => {
    return (
        <SafeAreaProvider>
            <ThemeProvider>
                <AuthProvider>
                    <CartProvider>
                        <AddressProvider>
                            <WishlistProvider>
                                <NavigationManager />
                                <FlashMessage
                                    position='top'
                                    style={{ marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : undefined }}
                                />
                            </WishlistProvider>
                        </AddressProvider>
                    </CartProvider>
                </AuthProvider>
            </ThemeProvider>
        </SafeAreaProvider>
    );
};

AppRegistry.registerComponent(appName, () => MainApp);