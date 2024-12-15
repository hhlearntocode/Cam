import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    StyleSheet,
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
                            <Text style={styles.name}>{info.name}</Text>
                            <Text style={styles.phone}>{info.phone}</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.button} onPress={logout}>
                        <Text style={styles.logoutText}>Log out</Text>
                    </TouchableOpacity>
                </>
            ) : (
                <Text>Loading...</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    header: {
        flexDirection: "row",
        marginVertical: 20,
        height: 100,
        gap: 20,
    },
    avatar: {
        width: 100,
    },
    info: {
        flex: 1,
        height: "100%",
        justifyContent: "center",
    },
    name: {
        fontSize: 24,
        fontWeight: "500",
    },
    phone: {
        marginTop: 6,
        fontSize: 14,
        color: "#999",
    },
    button: {
        width: "100%",
        justifyContent: "center",
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "red",
        borderRadius: 30,
        borderWidth: 1,
        borderColor: "#999",
        padding: 12,
    },
    logoutText: {
        fontWeight: 500,
        fontSize: 18,
    },
});

export default UserScreen;
