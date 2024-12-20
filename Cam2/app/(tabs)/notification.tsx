import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { collection, getDocs } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { db } from "../../firebase.config";
import { router } from "expo-router";

export default function NotificationPage() {
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

    const renderNotification = ({ item }: any) => (
        <TouchableOpacity
            style={[
                styles.notificationContainer,
                item.isRead && styles.notificationContainerRead,
            ]}
            onPress={() => handlePress(item)}
        >
            <View style={styles.header}>
                <Text style={styles.date}>{item.date}</Text>
                {item.isRead && (
                    <MaterialIcons
                        name="fiber-manual-record"
                        size={12}
                        color="#FF3B30"
                    />
                )}
            </View>
            <Text style={styles.title}>{item.message}</Text>
            <View style={styles.timeContainer}>
                <MaterialIcons name="access-time" size={12} color="#A9A9A9" />
                <Text style={styles.time}>{item.time}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.markAllReadButton}>
                <Text style={styles.markAllReadText}>
                    Đánh dấu tất cả đã đọc
                </Text>
            </TouchableOpacity>
            <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                renderItem={renderNotification}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F9F9F9",
        padding: 16,
    },
    headerText: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#000",
        marginBottom: 16,
    },
    markAllReadButton: {
        alignSelf: "flex-end",
        marginBottom: 16,
    },
    markAllReadText: {
        color: "#FF3B30",
        fontWeight: "bold",
    },
    notificationContainer: {
        backgroundColor: "#FFF",
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    notificationContainerRead: {
        backgroundColor: "#F5F0CD",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    date: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#6C6C6C",
    },
    title: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#000",
        marginVertical: 8,
    },
    description: {
        fontSize: 14,
        color: "#6C6C6C",
        marginBottom: 8,
    },
    timeContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    time: {
        fontSize: 12,
        color: "#A9A9A9",
        marginLeft: 4,
    },
});
