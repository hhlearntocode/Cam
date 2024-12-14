import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const UserScreen = () => {
    const [info, useInfo] = useState("");

    const getUser = async () => {
        const userId = await AsyncStorage.getItem("userId");
        if (!userId) {
            console.error("User ID is missing from AsyncStorage.");
            return;
        }

        // lên firebase lấy thông tin về
        // setInfo
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Image
                    style={styles.avatar}
                    source="https://cdn.iconscout.com/icon/free/png-512/avatar-367-456319.png"
                    contentFit="contain"
                    transition={1000}
                ></Image>
                {/* <Text>{info.name}</Text>
                <Text>{info.phone}</Text> */}
                <View style={styles.info}>
                    <Text style={styles.name}>Zuyfus</Text>
                    <Text style={styles.phone}>000000000</Text>
                </View>
            </View>
            <TouchableOpacity style={styles.button} onPress={() => {}}>
                <Text style={styles.logoutText}>Log out</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    header: {
        flexDirection: "row",
        marginVertical: 20,
        height: 100,
        gap: 20,
    },
    avatar: {
        width: 100,
    },
    info: {
        flex: 1,
        height: "100%",
        justifyContent: "center",
    },
    name: {
        fontSize: 24,
        fontWeight: "500",
    },
    phone: {
        marginTop: 6,
        fontSize: 14,
        color: "#999",
    },
    button: {
        width: "100%",
        justifyContent: "center",
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "red",
        borderRadius: 30,
        borderWidth: 1,
        borderColor: "#999",
        padding: 12,
    },
    logoutText: {
        fontWeight: 500,
        fontSize: 18,
    },
});

export default UserScreen;
