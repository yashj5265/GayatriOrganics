import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SendOTPScreen from '../screens/auth/SendOTPScreen';
import VerifyOTPScreen from '../screens/auth/VerifyOTPScreen';
import constant from '../utilities/constant';

const NavigationStack = createNativeStackNavigator();

const AuthNavigation: React.FC = () => {
    return (
        <NavigationStack.Navigator
            initialRouteName={constant.routeName.sendOTPScreen}
            screenOptions={{ headerShown: false }}
        >
            <NavigationStack.Screen
                name={constant.routeName.sendOTPScreen}
                component={SendOTPScreen}
            />
            <NavigationStack.Screen
                name={constant.routeName.verifyOTPScreen}
                component={VerifyOTPScreen}
            />
        </NavigationStack.Navigator>
    );
};

export default AuthNavigation;