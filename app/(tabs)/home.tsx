import Feather from "@expo/vector-icons/Feather";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import AddStudentModal from "../../components/AddStudent";
import ListNotification from "../../components/ListNotification";

const HomeScreen = () => {
    const [modalVisible, setModalVisible] = useState(false);
    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.userPlusButton}
                onPress={() => setModalVisible(true)}
            >
                <Feather name="user-plus" size={24} color="#fff" />
            </TouchableOpacity>
            <AddStudentModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
            />
            <View style={styles.information}>
                <Text style={styles.header}>Thông tin học sinh</Text>
            </View>
            <View style={styles.information}>
                <Text style={styles.header}>Thong bao</Text>
                <ListNotification />
            </View>
        </View>
    );
};

export default HomeScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#ffffff",
        padding: 20,
        gap: 10,
    },
    userPlusButton: {
        alignSelf: "flex-end",
        backgroundColor: "#007bff",
        borderRadius: 20,
        padding: 10,
        width: 50,
        height: 50,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    information: {
        backgroundColor: "#ECEBDE",
        height: 300,
        borderRadius: 10,
        padding: 20,
    },
    header: {
        fontSize: 24,
        textAlign: "center",
        color: "#000",
        marginBottom: 16,
    },
});
