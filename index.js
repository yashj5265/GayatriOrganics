/**
 * @format
 */

import { AppRegistry } from 'react-native';
import { name as appName } from './app.json';
import NavigationManager from './main/src/navigations/NavigationManager';
import { ThemeProvider } from './main/src/contexts/ThemeProvider';
import { AuthProvider } from './main/src/contexts/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CartProvider } from './main/src/contexts/CardContext';

const MainApp = () => {
    return (
        <SafeAreaProvider>
            <ThemeProvider>
                <AuthProvider>
                    <CartProvider>
                        <NavigationManager />
                    </CartProvider>
                </AuthProvider>
            </ThemeProvider>
        </SafeAreaProvider>
    );
};

AppRegistry.registerComponent(appName, () => MainApp);