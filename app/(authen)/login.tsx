import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import ActionButton from "../../components/ActionButton";
import InputField from "../../components/InputField";
import useForm from "../../hooks/useForm";

const LoginPage = () => {
    //loading for Spinning component (dont have in here)
    const { loading, emailAccount, setEmailAccount, password, setPassword } =
        useForm();
    const router = useRouter();

    const goToHome = () => {
        router.push("/(tabs)/home");
    };

    const goToRegister = () => {
        router.push("/register");
    };

    return (
        <View style={styles.container}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
                <InputField
                    placeholder="Email"
                    value={emailAccount}
                    onChangeText={setEmailAccount}
                />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
                <InputField
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />
            </View>

            {/* Login Button */}
            <View style={styles.buttonContainer}>
                <ActionButton title="Login" onPress={goToHome} />
            </View>

            {/* Register Link */}
            <View style={styles.registerContainer}>
                <ActionButton title="Create account" onPress={goToRegister} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        padding: 20,
    },
    inputContainer: {
        marginBottom: 16,
    },
    buttonContainer: {
        marginVertical: 16,
    },
    registerContainer: {
        alignItems: "center",
    },
});

export default LoginPage;
