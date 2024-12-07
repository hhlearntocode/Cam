import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
// import { StyleSheet, Text, Video, View } from "react-native";
//

// const DetailScreen = ({ route }) => {
const DetailScreen = () => {
    // const { data } = route.params;

    return (
        <View style={styles.container}>
            <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backButton}
            >
                <Text style={styles.backButtonText}>Quay lại</Text>
            </TouchableOpacity>
            <Text>Chi tiết video</Text>
            {/* Nội dung chi tiết video ở đây */}
            {/* <Video
                source={{ uri: data.videoUrl }}
                style={styles.video}
                controls
            /> */}
            {/* <Text style={styles.title}>{data.title}</Text>
            <Text style={styles.info}>Camera: {data.camera}</Text>
            <Text style={styles.info}>Time: {data.time}</Text>
            <Text style={styles.info}>Size: {data.size}</Text> */}
            <View style={styles.image}></View>
            <Text style={styles.title}>title hihihi</Text>
            <Text style={styles.info}>Camera</Text>
            <Text style={styles.info}>Time</Text>
            <Text style={styles.info}>Size</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    image: {
        marginTop: 20,
        backgroundColor: "#c0c0c0",
        borderStyle: "dotted",
        borderWidth: 5,
        borderColor: "black",
        height: 300,
        width: 300,
        alignSelf: "center",
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
    container: { flex: 1, padding: 20, backgroundColor: "#121212" },
    video: { width: "100%", height: 200, backgroundColor: "#000" },
    title: { fontSize: 24, color: "#fff", marginVertical: 16 },
    info: { fontSize: 16, color: "#bbb", marginVertical: 4 },
});

export default DetailScreen;
