import Feather from "@expo/vector-icons/Feather";
import React, { useState } from "react";
import {
    Animated,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const SettingScreen = () => {
    const [isOn, setIsOn] = useState(false);
    const [showDescription, setShowDescription] = useState(false);
    const translateX = new Animated.Value(isOn ? 26 : 0);

    const toggleSwitch = () => {
        setIsOn(!isOn);
        Animated.timing(translateX, {
            toValue: isOn ? 0 : 20,
            duration: 200,
            useNativeDriver: true,
        }).start();
    };
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Notification Settings</Text>
            <View style={styles.div1}>
                <Text style={styles.title_content}>
                    Here you can adjust your notification settings seamlessly
                </Text>
            </View>
            <View style={styles.div2}>
                <View style={styles.setting1}>
                    <View style={styles.iconContainer}>
                        <Feather name="phone-call" size={24} color="#6C63FF" />
                    </View>
                    <Text style={styles.setting1_content}>Calls</Text>
                    <TouchableOpacity onPress={() => setShowDescription(true)}>
                        <Feather name="help-circle" size={20} color="#6c6c6c" />
                    </TouchableOpacity>
                    {showDescription && (
                        <Modal
                            transparent={true}
                            visible={showDescription}
                            animationType="fade"
                            onRequestClose={() => setShowDescription(false)}
                        >
                            <View style={styles.modalContainer}>
                                <View style={styles.modalContent}>
                                    <Text style={styles.modalTitle}>
                                        Call Notifications
                                    </Text>
                                    <Text style={styles.modalText}>
                                        This setting enables or disables call
                                        notifications.
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() =>
                                            setShowDescription(false)
                                        }
                                    >
                                        <Text style={styles.closeButton}>
                                            Close
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </Modal>
                    )}
                </View>
                <TouchableOpacity onPress={toggleSwitch}>
                    <View
                        style={[
                            styles.switch,
                            { backgroundColor: isOn ? "blue" : "gray" },
                        ]}
                    >
                        <Animated.View
                            style={[
                                styles.circle,
                                { transform: [{ translateX }] },
                            ]}
                        />
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default SettingScreen;

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    div1: {
        backgroundColor: "#ffffff",
        padding: 16,
        borderRadius: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#1a1a1a",
        marginBottom: 30,
    },
    title_content: {
        fontSize: 16,
        fontWeight: 400,
        color: "#666666",
    },
    div2: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        backgroundColor: "#fff",
        borderRadius: 10,
    },
    setting1: {
        flexDirection: "row",
        gap: 10,
        alignItems: "center",
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#EDEAFF",
        justifyContent: "center",
        alignItems: "center",
    },
    setting1_content: {
        fontSize: 24,
        fontWeight: "500",
        color: "#000",
    },
    switch: {
        width: 50,
        height: 25,
        borderRadius: 15,
        padding: 3,
        justifyContent: "center",
    },
    circle: {
        width: 19,
        height: 19,
        borderRadius: 9.5,
        backgroundColor: "white",
    },
    modalContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.5)",
    },
    modalContent: {
        width: 300,
        padding: 20,
        backgroundColor: "white",
        borderRadius: 10,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 2 },
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 10,
    },
    modalText: {
        fontSize: 14,
        color: "#666",
        marginBottom: 20,
    },
    closeButton: {
        textAlign: "center",
        color: "blue",
        fontSize: 16,
    },
});
