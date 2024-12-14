import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

interface ActionButtonProps {
    title: string;
    onPress: () => void;
    hover?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ title, onPress }) => {
    return (
        <TouchableOpacity style={styles.button} onPress={onPress}>
            <Text style={styles.buttonText}>{title}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        backgroundColor: "#6c47ff",
        paddingVertical: 14,
        borderRadius: 30,
        alignItems: "center",
        width: "100%",
    },
    buttonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold",
    },
});

export default ActionButton;
