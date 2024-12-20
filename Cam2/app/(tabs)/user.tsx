import { Feather, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { db } from "../../firebase.config";

const UserScreen = () => {
    const [info, setInfo] = useState<any>(null); // Thông tin người dùng
    const [students, setStudents] = useState<any[]>([]); // Danh sách học sinh
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const data = [
        {
            id: "1",
            icon: "user",
            title: "My Account",
            description: "Make changes to your account",
            alert: true,
        },
        {
            id: "2",
            icon: "lock",
            title: "Face ID / Touch ID",
            description: "Manage your device security",
            isSwitch: true,
        },
        {
            id: "3",
            icon: "shield",
            title: "Two-Factor Authentication",
            description: "Further secure your account for safety",
            alert: false,
        },
        {
            id: "4",
            icon: "log-out",
            title: "Log out",
            description: "Further secure your account for safety",
            alert: false,
        },
    ];

    const logout = async () => {
        try {
            AsyncStorage.removeItem("userId");
            router.push("/login");
            console.log("Logout successfully");
        } catch (error) {
            console.error("Error: ", error);
        }
    };

    const fetchInfo = async () => {
        try {
            const userId = await AsyncStorage.getItem("userId");
            console.log(userId);
            if (!userId) {
                console.error("User ID is missing from AsyncStorage.");
                return;
            }
            console.log(userId);
            const docRef = doc(db, "user", userId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setInfo(docSnap.data());
            } else {
                console.log("No such document!");
            }
        } catch (error) {
            console.error("Error fetching user info: ", error);
        }
    };

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
                    .map((doc) => ({
                        id: doc.id,
                        idUser: userId,
                        ...doc.data(),
                    }))
                    .filter((student) => student.userId?.includes(userId));

                setStudents(studentsList2);
            } catch (error) {
                console.error("Error fetching students: ", error);
            }
        } catch (error) {
            console.error("Error fetching students: ", error);
        }
    };

    useEffect(() => {
        fetchInfo();
        fetchStudents();
        setInfo(null);
    }, []);

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    const AccountSettings = () => {
        const [isEnabled, setIsEnabled] = React.useState(false);

        const toggleSwitch = () => setIsEnabled(!isEnabled);

        const renderItem = ({ item }: any) => {
            return (
                <TouchableOpacity
                    style={styles.itemContainer}
                    activeOpacity={0.7}
                    onPress={() => {
                        if (item.id === "4") {
                            logout();
                        }
                    }}
                >
                    <View style={styles.iconContainer}>
                        <Feather name={item.icon} size={24} color="#6C63FF" />
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={styles.title}>{item.title}</Text>
                        <Text style={styles.description}>
                            {item.description}
                        </Text>
                    </View>
                    {item.isSwitch ? (
                        <Switch
                            trackColor={{ false: "#767577", true: "#6C63FF" }}
                            thumbColor={isEnabled ? "#f4f3f4" : "#f4f3f4"}
                            onValueChange={toggleSwitch}
                            value={isEnabled}
                        />
                    ) : (
                        <View style={styles.rightIconContainer}>
                            {item.alert && (
                                <MaterialIcons
                                    name="error-outline"
                                    size={16}
                                    color="#FF3B30"
                                />
                            )}
                            <Feather
                                name="chevron-right"
                                size={24}
                                color="#A9A9A9"
                            />
                        </View>
                    )}
                </TouchableOpacity>
            );
        };
        return (
            <View style={styles.box}>
                <FlatList
                    data={data}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                />
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {info ? (
                <>
                    <View style={styles.header}>
                        <Image
                            style={styles.avatar}
                            source="https://cdn.iconscout.com/icon/free/png-512/avatar-367-456319.png"
                            contentFit="contain"
                            transition={1000}
                        ></Image>
                        {/* <Text>{info.name}</Text>
                <Text>{info.phone}</Text> */}
                        <View style={styles.info}>
                            {/* <Text style={styles.name}>{info.name}</Text>
                            <Text style={styles.phone}>{info.phone}</Text> */}
                            <Text style={styles.name}>Zuyfus</Text>
                            <Text style={styles.phone}>0773462786</Text>
                        </View>
                        <TouchableOpacity style={styles.rightInfo}>
                            <Feather name="edit-2" size={24} color="#6C63FF" />
                        </TouchableOpacity>
                    </View>
                </>
            ) : (
                <Text>Loading...</Text>
            )}
            <AccountSettings />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: "#fffffb"
    },
    header1: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#1a1a1a",
        marginBottom: 10,
    },
    header: {
        flexDirection: "row",
        marginVertical: 20,
        height: 100,
        gap: 12,
        // backgroundColor: "#2A28B4",
        padding: 14,
        borderRadius: 8,
        alignItems: "center"
    },
    avatar: {
        width: 80,
        height: 80,
        // borderWidth: 2,
        // borderColor: "#FFFFFF",
        // borderRadius: 100,
    },
    info: {
        flex: 1,
        height: "100%",
        justifyContent: "center",
        gap: 4,
    },
    name: {
        fontSize: 20,
        fontWeight: "500",
        color: "#000",
    },
    phone: {
        fontSize: 14,
        color: "#000",
    },
    rightInfo: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#EDEAFF",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 14,
    },
    ////
    box: {
        flex: 1,
        // backgroundColor: "#F7F7F7",
    },
    itemContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFF",
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#EDEAFF",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
    },
    description: {
        fontSize: 12,
        color: "#999",
        marginTop: 4,
    },
    rightIconContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    listContainer: {
        marginTop: 20,
    },
});

export default UserScreen;
