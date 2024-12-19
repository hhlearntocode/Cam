import Feather from "@expo/vector-icons/Feather";
import { Image } from "expo-image";
import { router, Tabs } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import AddStudentModal from "../../components/AddStudent";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { collection, doc, getDocs } from "firebase/firestore";
import { db } from "../../firebase.config";
import HomeScreen from "./home";

interface Student {
    id: string;
    userIds: string[];
    name: string;
    age: number;
    imageUrl?: string;
}

const TodoLayout = () => {
    const [modalVisible, setModalVisible] = useState(false);
    const [students, setStudents] = useState<Student[]>([]);

    const fetchStudents = async (): Promise<void> => {
        try {
            const userId = await AsyncStorage.getItem("userId");

            if (!userId) {
                console.error("User ID is missing from AsyncStorage.");
                return;
            }

            try {
                const querySnapshot = await getDocs(collection(db, "students"));

                const studentsList2 = querySnapshot.docs
                    .map(doc => ({
                        id: doc.id,
                        idUser: userId,
                        ...doc.data(),   
                    }))
                    .filter(student => student.userId?.includes(userId));    

                    setStudents(studentsList2);
            } catch (error) {
                console.error("Error fetching students: ", error);
            }

        } catch (error) {
            console.error("Error fetching students: ", error);
        }
    };
    
    useEffect(() => {
        fetchStudents();
    }, []);

    const goToHome = () => {
        router.push("/home");
    };

    //OPTION IN TAB.SCREEN
    const renderHeaderTitle = () => (
        <TouchableOpacity style={styles.headerContainer} onPress={goToHome}>
            <Image
                source={{
                    uri: "https://th.bing.com/th/id/R.7b28add3965d218ba46f61c16f1ac32c?rik=QAQ%2bzMIUs0OylA&pid=ImgRaw&r=0",
                }}
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
                    <Feather name="user-plus" size={24} color="#000" />
                </TouchableOpacity>
                <AddStudentModal
                    visible={modalVisible}
                    onClose={() => setModalVisible(false)}
                    setStudents={setStudents}
                />
                <TouchableOpacity
                    style={styles.notificationButton}
                    onPress={() => router.push("/notification")}
                >
                    <Feather name="bell" size={24} color="#000" />
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
                    headerShown: false,
                }}
            />

            <Tabs.Screen
                key="notification"
                name="notification"
                options={{
                    href: null,
                    headerShown: false,
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
        width: 160,
        height: 160,
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
        padding: 10,
    },
    userPlusButton: {
        // borderRadius: 20,
        // justifyContent: "center",
        // alignItems: "center",
        marginRight: 10,
        // shadowColor: "#000",
        // shadowOffset: { width: 0, height: 2 },
        // shadowOpacity: 0.3,
        // shadowRadius: 4,
        // elevation: 5,
    },
});

export default TodoLayout;