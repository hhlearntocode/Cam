import { router } from "expo-router";
import React from "react";
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import notifications from "../assets/dummyData";

const ListNotification = () => {
    //gan item de xac dinh doi tuong an vao
    const handlePress = (item: any) => {
        router.push("detailVideo");
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity onPress={() => handlePress(item)} style={styles.item}>
            <View style={styles.iconContainer}>
                <View style={styles.icon}>
                    <Text style={styles.iconText}>{item.title.charAt(0)}</Text>
                </View>
            </View>
            <View style={styles.infoContainer}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.camera}>{item.camera}</Text>
                <Text style={styles.details}>
                    {item.day} • {item.time}
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
