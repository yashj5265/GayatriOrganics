import React, { useMemo, useCallback } from 'react';
import { Platform } from 'react-native';
import { useTheme } from '../contexts/ThemeProvider';
import fonts from '../styles/fonts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from '../screens/front/HomeScreen';
import CategoriesScreen from '../screens/front/CategoriesScreen';
import CartScreen from '../screens/front/CartScreen';
import ProfileScreen from '../screens/front/ProfileScreen';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CategoryDetailScreen from '../screens/front/CategoryDetailScreen';
import constant from '../utilities/constant';
import ProductListScreen from '../screens/front/ProductListScreen';
import ProductDetailScreen from '../screens/front/ProductDetailScreen';
import { useCart } from '../contexts/CardContext';
import { CategoryDetailScreenProps } from '../screens/front/CategoryDetailScreen';
import { ProductListScreenProps } from '../screens/front/ProductListScreen';
import { ProductDetailScreenProps } from '../screens/front/ProductDetailScreen';
import AddressListScreen from '../screens/front/AddressListScreen';
import AddEditAddressScreen from '../screens/front/AddEditAddressScreen';
import WishlistScreen from '../screens/front/WishlistScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

export type FrontStackParamList = {
    [constant.routeName.mainTabs]: undefined;
    [constant.routeName.categoryDetail]: { params: CategoryDetailScreenProps };
    [constant.routeName.products]: { params?: ProductListScreenProps };
    [constant.routeName.productDetail]: { params: ProductDetailScreenProps };
};

// Bottom Tab Navigator Component
const BottomTabs: React.FC = React.memo(() => {
    const colors = useTheme();
    const insets = useSafeAreaInsets();
    const { cartCount } = useCart();

    const tabBarStyle = useMemo(() => ({
        backgroundColor: colors.backgroundPrimary,
        borderTopColor: colors.border,
        borderTopWidth: 1,
        height: Platform.OS === 'ios'
            ? 85 + insets.bottom
            : 65 + insets.bottom,
        paddingBottom: Platform.OS === 'ios'
            ? insets.bottom
            : Math.max(insets.bottom, 8),
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    }), [colors.backgroundPrimary, colors.border, insets.bottom]);

    const tabBarBadgeStyle = useMemo(() => ({
        backgroundColor: '#FF5252',
        color: '#FFFFFF',
        fontSize: fonts.size.font10,
        fontFamily: fonts.family.primaryBold,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        lineHeight: Platform.OS === 'ios' ? 18 : 17,
        textAlign: 'center' as const,
    }), []);

    const renderHomeIcon = useCallback(({ focused, color, size }: { focused: boolean; color: string; size: number }) => (
        <Icon
            name={focused ? 'home' : 'home-outline'}
            size={size}
            color={color}
        />
    ), []);

    const renderCategoriesIcon = useCallback(({ focused, color, size }: { focused: boolean; color: string; size: number }) => (
        <Icon
            name={focused ? 'view-grid' : 'view-grid-outline'}
            size={size}
            color={color}
        />
    ), []);

    const renderCartIcon = useCallback(({ focused, color, size }: { focused: boolean; color: string; size: number }) => (
        <Icon
            name={focused ? 'cart' : 'cart-outline'}
            size={size}
            color={color}
        />
    ), []);

    const renderProfileIcon = useCallback(({ focused, color, size }: { focused: boolean; color: string; size: number }) => (
        <Icon
            name={focused ? 'account' : 'account-outline'}
            size={size}
            color={color}
        />
    ), []);

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle,
                tabBarActiveTintColor: colors.themePrimary,
                tabBarInactiveTintColor: colors.textLabel,
                tabBarLabelStyle: {
                    fontSize: fonts.size.font11,
                    fontWeight: '600',
                    marginTop: 4,
                },
                tabBarIconStyle: {
                    marginTop: 4,
                },
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarLabel: 'Home',
                    tabBarIcon: renderHomeIcon,
                }}
            />

            <Tab.Screen
                name={constant.routeName.categories}
                component={CategoriesScreen}
                options={{
                    tabBarLabel: 'Categories',
                    tabBarIcon: renderCategoriesIcon,
                }}
            />

            <Tab.Screen
                name={constant.routeName.cart}
                component={CartScreen}
                options={{
                    tabBarLabel: 'Cart',
                    tabBarIcon: renderCartIcon,
                    tabBarBadge: cartCount > 0 ? cartCount : undefined,
                    tabBarBadgeStyle,
                }}
            />

            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarLabel: 'Profile',
                    tabBarIcon: renderProfileIcon,
                }}
            />
        </Tab.Navigator>
    );
});

// Main Front Navigation with Stack
const FrontNavigation: React.FC = React.memo(() => {
    const screenOptions = useMemo(() => ({
        headerShown: false,
        animation: 'slide_from_right' as const,
    }), []);

    return (
        <Stack.Navigator screenOptions={screenOptions}>
            <Stack.Screen
                name={constant.routeName.mainTabs}
                component={BottomTabs}
            />

            <Stack.Screen
                name={constant.routeName.categoryDetail}
                component={CategoryDetailScreen as any}
            />

            <Stack.Screen
                name={constant.routeName.products}
                component={ProductListScreen}
            />

            <Stack.Screen
                name={constant.routeName.productDetail}
                component={ProductDetailScreen as any}
            />

            <Stack.Screen
                name={constant.routeName.addressList}
                component={AddressListScreen as any}
            />

            <Stack.Screen
                name={constant.routeName.addEditAddress}
                component={AddEditAddressScreen as any}
            />

            <Stack.Screen
                name={constant.routeName.wishlist}
                component={WishlistScreen as any}
            />
        </Stack.Navigator>
    );
});

FrontNavigation.displayName = 'FrontNavigation';

export default FrontNavigation;