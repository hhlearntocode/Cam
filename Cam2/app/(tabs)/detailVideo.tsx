import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View, Image } from "react-native";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase.config";

const DetailVideoScreen = () => {
    const params = useLocalSearchParams();
    const router = useRouter();
    const [notificationData, setNotificationData] = useState<any>(null);

    const { notificationId } = params;

    // Hàm để lấy dữ liệu thông báo từ Firebase
    const fetchNotificationData = async () => {
        try {
            const docRef = doc(db, "notifications", notificationId); // Tạo ref đến thông báo theo ID
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setNotificationData(docSnap.data()); // Lưu dữ liệu vào state
            } else {
                console.log("No such document!");
            }
        } catch (error) {
            console.error("Error fetching notification data: ", error);
        }
    };

    useEffect(() => {
        if (notificationId) {
            fetchNotificationData(); // Lấy dữ liệu khi có notificationId
        }
    }, [notificationId]);

    // Nếu chưa có dữ liệu, hiển thị loading
    if (!notificationData) {
        return (
            <View style={styles.container}>
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    const { title, imageUrl, time, date, message, status } = notificationData;

    return (
        <View style={styles.container}>
            <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backButton}
            >
                <Text style={styles.backButtonText}>Quay lại</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Chi tiết thông báo</Text>

            {/* Hiển thị hình ảnh nếu có */}
            {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.image} />
            ) : (
                <View style={styles.placeholderImage}>
                    <Text style={styles.placeholderText}>No Image</Text>
                </View>
            )}

            {/* Hiển thị các chi tiết thông báo */}
            <View style={styles.detailsContainer}>
                <Text style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Tiêu đề:</Text> {title}
                </Text>
                <Text style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Nội dung:</Text> {message}
                </Text>
                <Text style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Ngày:</Text> {date}
                </Text>
                <Text style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Thời gian:</Text> {time}
                </Text>
                <Text style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Trạng thái:</Text> {status}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: "#000", // Change background to black
    },
    backButton: {
        marginBottom: 20,
        padding: 10,
        backgroundColor: "#007bff",
        borderRadius: 5,
    },
    backButtonText: {
        color: "#fff",
        textAlign: "center",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 16,
        textAlign: "center",
        color: "#fff", // Set header text to white
    },
    image: {
        width: "100%",
        height: 300,
        marginBottom: 16,
        borderRadius: 8,
    },
    placeholderImage: {
        width: "100%",
        height: 300,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#ddd",
        marginBottom: 16,
        borderRadius: 8,
    },
    placeholderText: {
        fontSize: 18,
        color: "#888",
    },
    detailsContainer: {
        marginTop: 16,
    },
    detailItem: {
        fontSize: 16,
        marginBottom: 8,
        color: "#fff", // Set text color to white
    },
    detailLabel: {
        fontWeight: "bold",
    },
    loadingText: {
        color: "#fff", // Loading text color to white
        textAlign: "center",
        fontSize: 18,
    },
});

export default DetailVideoScreen;
