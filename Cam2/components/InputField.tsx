import React from "react";
import { StyleSheet, TextInput, View } from "react-native";

interface InputFieldProps {
    placeholder: string;
    value: string;
    onChangeText: (text: string) => void;
    secureTextEntry?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({
    placeholder,
    value,
    onChangeText,
    secureTextEntry = false,
}) => {
    return (
        <View style={styles.inputContainer}>
            <TextInput
                placeholder={placeholder}
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={secureTextEntry}
                style={styles.inputField}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    inputContainer: {
        marginBottom: 16,
    },
    inputField: {
        height: 50,
        borderWidth: 1,
        borderColor: "#6c47ff",
        borderRadius: 4,
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: "#fff",
    },
});

export default InputField;
