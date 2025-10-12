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

const Tab = createBottomTabNavigator();

const FrontNavigation: React.FC = () => {
    const colors = useTheme();
    const insets = useSafeAreaInsets();

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
                name="Categories"
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
                name="Cart"
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
                    tabBarBadge: 3, // Dynamic cart count (update from context/state)
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

export default FrontNavigation;