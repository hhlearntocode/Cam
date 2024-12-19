import Feather from "@expo/vector-icons/Feather";
import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View, Image, Alert } from "react-native";
import AddStudentModal from "../../components/AddStudent";
import ListNotification from "../../components/ListNotification";
import { db } from "../../firebase.config";
import { collection, getDocs, doc, deleteDoc, getDoc } from "firebase/firestore";
import EditStudentModal from "../../components/EditStudentModel";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Swiper from "react-native-swiper";

const HomeScreen: React.FC = () => {
    const [students, setStudents] = useState<any[]>([]);
    const [editModalStates, setEditModalStates] = useState<Record<string, boolean>>({});

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

                    // console.log(studentsList2);

                    setStudents(studentsList2);
        
                    const initialModalStates = studentsList2.reduce((acc: Record<string, boolean>, student) => {
                        acc[student.id] = false;
                        return acc;
                    }, {});
        
                    setEditModalStates(initialModalStates);
            } catch (error) {
                console.error("Error fetching students: ", error);
            }

        } catch (error) {
            console.error("Error fetching students: ", error);
        }
    };

    const toggleEditModal = (studentId: string, isVisible: boolean): void => {
        setEditModalStates(prevStates => ({
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
                                        Lớp: {item.classes}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.schoolInfo}>
                                <Text style={styles.title}>Trường học</Text>
                                <Text style={styles.studentText}>
                                    Tên: {item.school}
                                </Text>
                            </View>
                        </View>
                        <EditStudentModal
                            visible={editModalStates[item.id]}
                            onClose={() => toggleEditModal(item.id, false)}
                            studentId={item.id}
                            setStudents={setStudents}
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
    wrapper: {
        // columnGap: 10,
    },
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
