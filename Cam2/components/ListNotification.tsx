import React, { useEffect, useState } from "react";
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Image,
} from "react-native";
import { router } from "expo-router";
import { getDocs, collection } from "firebase/firestore";
import { db } from "../firebase.config";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ListNotification = () => {
    const [notifications, setNotifications] = useState<any[]>([]);

    const fetchNotification = async () => {
        try {
            const userId = await AsyncStorage.getItem("userId");

            if (!userId) {
                console.error("User ID is missing from AsyncStorage.");
                return;
            }

            const querySnapshot = await getDocs(collection(db, "notifications"));

            const notificationsList = querySnapshot.docs
                .map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }))
                .filter((notification) => notification.userId?.includes(userId));

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
                    <Image source={{ uri: item.imageUrl }} style={styles.image} />
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
                <Text style={styles.camera}>Status: {item.status}</Text>
                <Text style={styles.details}>
                    {item.date} • {item.time}
                </Text>
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
    },
    item: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        backgroundColor: "#ffffff",
        borderRadius: 8,
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
        width: 40,
        height: 40,
        borderRadius: 20,
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
    camera: {
        fontSize: 14,
        color: "#6c757d",
        marginVertical: 2,
    },
    details: {
        fontSize: 12,
        color: "#6c757d",
    },
});

export default ListNotification;
