import AsyncStorage from "@react-native-async-storage/async-storage";
import { collection, getDocs } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Swiper from "react-native-swiper";
import EditStudentModal from "../../components/EditStudentModel";
import ListNotification from "../../components/ListNotification";
import { db } from "../../firebase.config";

const HomeScreen = () => {
    const [students, setStudents] = useState([]);
    const [editModalStates, setEditModalStates] = useState({});

    const fetchStudents = async () => {
        try {
            // const userId = sessionStorage.getItem("userId");
            const userId = await AsyncStorage.getItem("userId");

            if (!userId) {
                console.error("User ID is missing from AsyncStorage.");
                return;
            }

            // Fetch all students
            const querySnapshot = await getDocs(collection(db, "students"));

            // Filter students where the current user is listed in parentIDs
            const studentsList = querySnapshot.docs
                .map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }))
                .filter((student) => student.userId?.includes(userId));

            // Update state with the filtered students list
            setStudents(studentsList);

            // Create initial modal states for each student
            const initialModalStates = studentsList.reduce((acc, student) => {
                acc[student.id] = false; // Set all modals to closed initially
                return acc;
            }, {});
            setEditModalStates(initialModalStates);
        } catch (error) {
            console.error("Error fetching students: ", error);
        }
    };

    const toggleEditModal = (studentId, isVisible) => {
        setEditModalStates((prevStates) => ({
            ...prevStates,
            [studentId]: isVisible,
        }));
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    return (
        <View style={styles.container}>
            <Swiper
                style={styles.wrapper}
                showsButtons={true}
                showsPagination={false}
            >
                {students.map((item) => (
                    <TouchableOpacity
                        style={styles.container1}
                        onPress={() => toggleEditModal(item.id, true)}
                        key={item.id}
                    >
                        <View style={styles.studentItem}>
                            <View style={styles.studentInfo}>
                                {item.imageUrl && (
                                    <Image
                                        source={{ uri: item.imageUrl }}
                                        style={styles.studentImage}
                                    />
                                )}
                                <View style={styles.profile}>
                                    <Text style={styles.title}>Học sinh</Text>
                                    <Text style={styles.studentText}>
                                        Tên: {item.name}
                                    </Text>
                                    <Text style={styles.studentText}>
                                        Tuổi: {item.age}
                                    </Text>
                                    <Text style={styles.studentText}>
                                        Địa chỉ: {item.name}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.schoolInfo}>
                                <Text style={styles.title}>Trường học</Text>
                                <Text style={styles.studentText}>
                                    Tên: {item.name}
                                </Text>
                            </View>
                        </View>
                        {/* Edit modal */}
                        <EditStudentModal
                            visible={editModalStates[item.id]}
                            onClose={() => toggleEditModal(item.id, false)}
                            studentId={item.id}
                        />
                    </TouchableOpacity>
                ))}
            </Swiper>

            <View style={styles.container2}>
                <Text style={styles.smallTitle}>Thông báo</Text>
                <ListNotification />
            </View>
        </View>
    );
};

export default HomeScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#ffffff",
        padding: 20,
        gap: 10,
    },
    container1: {
        backgroundColor: "#ECEBDE",
        flex: 1,
        borderRadius: 40,
        paddingHorizontal: 20,
        paddingTop: 20,
        height: "auto",
    },
    wrapper: {},
    profile: {},
    studentItem: {
        flex: 1,
        gap: 10,
    },
    studentInfo: {
        flexDirection: "row",
        gap: 20,
    },
    studentImage: {
        width: 140,
        height: 140,
        borderRadius: 100,
    },
    schoolInfo: {},
    title: {
        fontSize: 24,
        fontWeight: "500",
    },
    studentText: {
        fontSize: 16,
        color: "#000",
    },
    container2: {
        gap: 10,
        height: "60%",
    },
    smallTitle: {
        fontSize: 20,
        fontWeight: "bold",
    },
});
