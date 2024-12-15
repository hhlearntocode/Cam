import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { db } from "../firebase.config";

const ListNotification = () => {
    const [notifications, setNotifications] = useState<any[]>([]);

    const fetchNotification = async () => {
        try {
            const userId = await AsyncStorage.getItem("userId");

            if (!userId) {
                console.error("User ID is missing from AsyncStorage.");
                return;
            }

            const querySnapshot = await getDocs(
                collection(db, "notifications")
            );

            const notificationsList = querySnapshot.docs
                .map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }))
                .filter((notification) =>
                    notification.userId?.includes(userId)
                );

            setNotifications(notificationsList);
        } catch (error) {
            console.error("Error fetching notifications: ", error);
        }
    };

    useEffect(() => {
        fetchNotification();
    }, []);

    const handlePress = (item: any) => {
        router.push({
            pathname: "/detailVideo",
            params: { notificationId: item.id },
        });
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity onPress={() => handlePress(item)} style={styles.item}>
            <View style={styles.iconContainer}>
                {item.imageUrl ? (
                    <Image
                        source={{ uri: item.imageUrl }}
                        style={styles.image}
                    />
                ) : (
                    <View style={styles.icon}>
                        <Text style={styles.iconText}>
                            {item.message.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                )}
            </View>
            <View style={styles.infoContainer}>
                <Text style={styles.title}>{item.message}</Text>
                <Text style={styles.details}>Trạng thái: {item.status}</Text>
                <Text style={styles.details}>{item.date}</Text>
                <Text style={styles.details}>{item.time}</Text>
                <Text style={styles.details}>Địa điểm: </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
        />
    );
};

const styles = StyleSheet.create({
    listContainer: {
        padding: 16,
        backgroundColor: "#ECEBDE",
        borderRadius: 40,
    },
    item: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        backgroundColor: "#ffffff",
        borderRadius: 20,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    iconContainer: {
        marginRight: 12,
    },
    icon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#007bff",
        justifyContent: "center",
        alignItems: "center",
    },
    image: {
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    iconText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    infoContainer: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        color: "#000",
        fontWeight: "bold",
    },
    details: {
        fontSize: 14,
        color: "#6c757d",
    },
});

export default ListNotification;
