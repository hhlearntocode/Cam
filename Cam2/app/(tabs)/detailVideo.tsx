import { useLocalSearchParams } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { db } from "../../firebase.config";

const videoSource =
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

const DetailVideoScreen = () => {
    const params = useLocalSearchParams();
    const [notificationData, setNotificationData] = useState<any>(null);
    const { notificationId } = params;
    const player = useVideoPlayer(videoSource, (player) => {
        player.loop = true;
        player.play();
    });

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

    const { title, time, date, message, status } = notificationData;

    return (
        <View style={styles.container}>
            <View style={styles.container1}>
                <Text style={styles.title}>Chi tiết thông báo</Text>
                <VideoView
                    style={styles.video}
                    player={player}
                    allowsFullscreen
                    allowsPictureInPicture
                />
            </View>
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
        padding: 20,
    },
    container1: {
        marginTop: 30,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        marginTop: 10,
        marginBottom: 30,
        textAlign: "center",
        color: "#000",
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
        fontSize: 20,
        marginBottom: 8,
        color: "#000",
    },
    detailLabel: {
        fontWeight: "bold",
    },
    loadingText: {
        color: "#000",
        textAlign: "center",
        fontSize: 18,
    },
    video: {
        width: "100%",
        height: 200,
    },
});

export default DetailVideoScreen;
