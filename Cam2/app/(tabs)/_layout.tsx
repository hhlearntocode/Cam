import Feather from "@expo/vector-icons/Feather";
import { Image } from "expo-image";
import { router, Tabs } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import AddStudentModal from "../../components/AddStudent";
import useFetchStudents from "../../hooks/useFetchStudents";

const TodoLayout = () => {
    const [modalVisible, setModalVisible] = useState(false);
    const { fetchStudents } = useFetchStudents();
    const goToHome = () => {
        router.push("/home");
    };
    const notificationButton = (item: any) => {
        router.push({
            pathname: "/notification",
            params: { notificationId: item.id },
        });
    };
    //OPTION IN TAB.SCREEN
    const renderHeaderTitle = () => (
        <TouchableOpacity style={styles.headerContainer} onPress={goToHome}>
            <Image
                source={require("../../assets/hifive_logo.png")}
                contentFit="contain"
                transition={1000}
                style={styles.avatar}
            />
        </TouchableOpacity>
    );

    const renderHeaderRight = () => {
        return (
            <>
                <TouchableOpacity
                    style={styles.userPlusButton}
                    onPress={() => setModalVisible(true)}
                >
                    <Feather name="user-plus" size={24} color="#6C63FF" />
                </TouchableOpacity>
                {modalVisible && (
                    <AddStudentModal
                        visible={modalVisible}
                        onClose={() => setModalVisible(false)}
                        refreshStudents={fetchStudents}
                    />
                )}
                <TouchableOpacity
                    style={styles.notificationButton}
                    onPress={notificationButton}
                >
                    <Feather name="bell" size={24} color="#6C63FF" />
                </TouchableOpacity>
            </>
        );
    };

    const commonOptions = {
        headerTintColor: "#fff",
        headerTitle: renderHeaderTitle,
        headerRight: renderHeaderRight,
    };
    //name={icon} cua fontawesome khong nhan du lieu tu data nen phai tuong minh
    type FeatherIconName = "home" | "user" | "settings" | null;
    const showScreen: {
        name: string;
        title: string;
        icon: FeatherIconName;
        headerShown?: boolean;
        href?: string | null;
        color?: string
    }[] = [
        { name: "home", title: "Home", icon: "home", headerShown: true },
        { name: "setting", title: "Setting", icon: "settings", headerShown: false },
        { name: "user", title: "Profile", icon: "user", headerShown: true },
        { name: "detailVideo", title: "Video Detail", icon: null, headerShown: false, href: null },
        { name: "notification", title: "Notifications", icon: null, headerShown: true, href: null },
    ];

    return (
        <Tabs>
            {showScreen.map(({ name, title, icon, headerShown = true, href = undefined }) => (
                <Tabs.Screen
                key={name}
                name={name}
                options={{
                    ...commonOptions,
                    title,
                    headerShown,
                    href,
                    tabBarIcon: icon
                        ? ({ color }) => <Feather size={28} name={icon} color={color} />
                        : undefined, 
                    }}
                    />
                ))}
        </Tabs>
    );
};

const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    avatar: {
        width: 160,
        height: 160,
    },
    headerTextContainer: {
        justifyContent: "center",
    },
    notificationButton: {
        marginRight: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#EDEAFF",
        justifyContent: "center",
        alignItems: "center",
    },
    userPlusButton: {
        // borderRadius: 20,
        // justifyContent: "center",
        // alignItems: "center",
        marginRight: 12,
        // shadowColor: "#000",
        // shadowOffset: { width: 0, height: 2 },
        // shadowOpacity: 0.3,
        // shadowRadius: 4,
        // elevation: 5,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#EDEAFF",
        justifyContent: "center",
        alignItems: "center",
    },
});

export default TodoLayout;
