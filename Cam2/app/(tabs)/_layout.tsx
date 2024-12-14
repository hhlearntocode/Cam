import Feather from "@expo/vector-icons/Feather";
import { Tabs } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const TodoLayout = () => {
    //OPTION IN TAB.SCREEN
    const renderHeaderTitle = () => (
        <View style={styles.headerContainer}>
            <Image
                source={{
                    uri: "",
                }}
                style={styles.avatar}
            />
            <View style={styles.headerTextContainer}>
                <Text style={styles.headerTitle}>Student Name</Text>
                <Text style={styles.headerSubtitle}>Age</Text>
            </View>
        </View>
    );

    const renderHeaderRight = () => {
        return (
            <TouchableOpacity
                style={styles.notificationButton}
                onPress={() => null}
            >
                <Feather name="bell" size={20} color="#fff" />
            </TouchableOpacity>
        );
    };

    const commonOptions = {
        headerStyle: {
            backgroundColor: "#171D22",
        },
        headerTintColor: "#fff",
        headerTitle: renderHeaderTitle,
        headerRight: renderHeaderRight,
    };
    //name={icon} cua fontawesome khong nhan du lieu tu data nen phai tuong minh
    type FeatherIconName = "home" | "user" | "settings";
    const showScreen: {
        name: string;
        title: string;
        icon: FeatherIconName;
    }[] = [
        { name: "home", title: "Home", icon: "home" },
        { name: "setting", title: "Setting", icon: "settings" },
        { name: "user", title: "Profile", icon: "user" },
    ];

    return (
        <Tabs>
            {showScreen.map(({ name, title, icon }) => (
                <Tabs.Screen
                    key={name}
                    name={name}
                    options={{
                        ...commonOptions,
                        title,
                        tabBarIcon: ({ color }) => (
                            <Feather size={28} name={icon} color={color} />
                        ),
                    }}
                />
            ))}
            <Tabs.Screen
                key="detailVideo"
                name="detailVideo"
                options={{
                    href: null,
                }}
            />
        </Tabs>
    );
};

const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    headerTextContainer: {
        justifyContent: "center",
    },
    headerTitle: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    headerSubtitle: {
        color: "#ccc",
        fontSize: 14,
    },
    notificationButton: {
        marginRight: 20,
        borderRadius: 50,
        padding: 10,
        backgroundColor: "#ccc",
    },
});

export default TodoLayout;
