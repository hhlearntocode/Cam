import React from "react";
import { StyleSheet, View } from "react-native";
import ActionButton from "../../components/ActionButton";
import InputField from "../../components/InputField";
import useForm from "../../hooks/useForm";

const RegisterPage = () => {
    const { loading, emailAccount, setEmailAccount, password, setPassword } =
        useForm();

    const onSignUpPress = async () => {
        // Handle sign-up logic here
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

            {/* Sign Up Button */}
            <View style={styles.buttonContainer}>
                <ActionButton title="Sign up" onPress={onSignUpPress} />
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
});

export default RegisterPage;
