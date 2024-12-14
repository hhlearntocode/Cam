import { Stack } from "expo-router";

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
                    headerShown: false,
                }}
            ></Stack.Screen>
            <Stack.Screen
                name="register"
                options={{
                    headerShown: false,
                }}
            ></Stack.Screen>
        </Stack>
    );
};

export default PublicLayout;
