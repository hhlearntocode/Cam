import React, { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

interface InputFieldProps {
    label: string;
    placeholder: string;
    value: string;
    onChangeText: (text: string) => void;
    secureTextEntry?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({
    label,
    placeholder,
    value,
    onChangeText,
    secureTextEntry = false,
}) => {
    const [isFocus, setIsFocus] = useState(false);
    return (
        <View style={styles.inputContainer}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                placeholder={placeholder}
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={secureTextEntry}
                style={[styles.inputField, isFocus && styles.inputHover]}
                onFocus={() => setIsFocus(true)}
                onBlur={() => setIsFocus(false)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    inputContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 16,
        color: "#000",
        marginBottom: 8,
        fontWeight: "500",
    },
    inputField: {
        height: 50,
        borderWidth: 1,
        borderColor: "#6c757d",
        borderRadius: 30,
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: "#fff",
        opacity: 0.5,
    },
    inputHover: {
        borderColor: "#000",
        opacity: 1,
    },
});

export default InputField;
