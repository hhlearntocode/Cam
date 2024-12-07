import { Stack } from "expo-router";
import React from "react";

const PublicLayout = () => {
    return (
        <Stack
            initialRouteName="login"
            screenOptions={{
                headerStyle: {
                    backgroundColor: "#6c47ff",
                },
                headerTintColor: "#fff",
                headerBackTitle: "Back", //Android, ignored back button with just the arrow
            }}
        >
            <Stack.Screen
                name="login"
                options={{
                    headerTitle: "Todo-App",
                }}
            ></Stack.Screen>
            <Stack.Screen
                name="register"
                options={{
                    headerTitle: "Create account",
                }}
            ></Stack.Screen>
        </Stack>
    );
};

export default PublicLayout;
