import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
    LoginScreen,
    SignupScreen,
    ForgotPasswordScreen,
    ResetPasswordScreen,
} from '../screens';

export type AuthStackParamList = {
    Login: undefined;
    Signup: undefined;
    ForgotPassword: { email?: string };
    ResetPassword: { email: string };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator: React.FC = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        </Stack.Navigator>
    );
};
