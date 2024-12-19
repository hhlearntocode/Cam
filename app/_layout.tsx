import { Stack } from "expo-router";
import React from "react";
import { StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

const RootLayoutNav = () => {
    return (
        <SafeAreaProvider>
            <StatusBar barStyle="light-content" backgroundColor="#171D22" />
            <Stack>
                <Stack.Screen
                    name="(authen)"
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="(tabs)"
                    options={{
                        headerShown: false,
                    }}
                />
            </Stack>
        </SafeAreaProvider>
    );
};

export default RootLayoutNav;
