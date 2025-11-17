import React from 'react';
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

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Bottom Tab Navigator Component
const BottomTabs: React.FC = () => {
    const colors = useTheme();
    const insets = useSafeAreaInsets();
    const { cartCount } = useCart(); // Get dynamic cart count

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
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
                },
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
                    tabBarIcon: ({ focused, color, size }) => {
                        return (
                            <Icon
                                name={focused ? 'home' : 'home-outline'}
                                size={size}
                                color={color}
                            />
                        )
                    },
                }}
            />

            <Tab.Screen
                name={constant.routeName.categories}
                component={CategoriesScreen}
                options={{
                    tabBarLabel: 'Categories',
                    tabBarIcon: ({ focused, color, size }) => {
                        return (
                            <Icon
                                name={focused ? 'view-grid' : 'view-grid-outline'}
                                size={size}
                                color={color}
                            />
                        )
                    },
                }}
            />

            <Tab.Screen
                name={constant.routeName.cart}
                component={CartScreen}
                options={{
                    tabBarLabel: 'Cart',
                    tabBarIcon: ({ focused, color, size }) => {
                        return (
                            <Icon
                                name={focused ? 'cart' : 'cart-outline'}
                                size={size}
                                color={color}
                            />
                        )
                    },
                    // Dynamic cart badge - only show when cart has items
                    tabBarBadge: cartCount > 0 ? cartCount : undefined,
                    tabBarBadgeStyle: {
                        backgroundColor: '#FF5252',
                        color: '#FFFFFF',
                        fontSize: fonts.size.font10,
                        fontFamily: fonts.family.primaryBold,
                        minWidth: 18,
                        height: 18,
                        borderRadius: 9,
                        lineHeight: Platform.OS === 'ios' ? 18 : 17,
                        textAlign: 'center',
                    }
                }}
            />

            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarLabel: 'Profile',
                    tabBarIcon: ({ focused, color, size }) => {
                        return (
                            <Icon
                                name={focused ? 'account' : 'account-outline'}
                                size={size}
                                color={color}
                            />
                        )
                    },
                }}
            />
        </Tab.Navigator>
    );
};

// Main Front Navigation with Stack
const FrontNavigation: React.FC = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
            }}
        >
            {/* Main Tab Navigator */}
            <Stack.Screen
                name={constant.routeName.mainTabs}
                component={BottomTabs}
            />

            {/* Stack Screens (Hidden from tabs) */}
            <Stack.Screen
                name={constant.routeName.categoryDetail}
                component={CategoryDetailScreen as any}
            />

            <Stack.Screen
                name={constant.routeName.products}
                component={ProductListScreen as any}
            />

            <Stack.Screen
                name={constant.routeName.productDetail}
                component={ProductDetailScreen as any}
            />
        </Stack.Navigator>
    );
};

export default FrontNavigation;