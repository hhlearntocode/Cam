import Feather from "@expo/vector-icons/Feather";
import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View, Image, Alert } from "react-native";
import AddStudentModal from "../../components/AddStudent";
import ListNotification from "../../components/ListNotification";
import { db } from "../../firebase.config"; 
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore"; 
import EditStudentModal from "../../components/EditStudentModel";
import AsyncStorage from "@react-native-async-storage/async-storage";

const HomeScreen = () => {
    const [modalVisible, setModalVisible] = useState(false);
    const [students, setStudents] = useState([]); 
    const [editModalStates, setEditModalStates] = useState({}); 

    const fetchStudents = async () => {
        try {
            // const userId = sessionStorage.getItem("userId");
            const userId = await AsyncStorage.getItem("userId")
    
            if (!userId) {
                console.error("User ID is missing from AsyncStorage.");
                return;
            }
    
            // Fetch all students
            const querySnapshot = await getDocs(collection(db, "students"));
    
            // Filter students where the current user is listed in parentIDs
            const studentsList = querySnapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }))
                .filter(student => student.userId?.includes(userId));
    
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
        setEditModalStates(prevStates => ({
            ...prevStates,
            [studentId]: isVisible,
        }));
    };

    const handleDeleteStudent = async (studentId: string) => {
        // const userId = sessionStorage.getItem("userId"); // Retrieve the logged-in user's ID
        const userId = await AsyncStorage.getItem("userId")
    
        if (!userId) {
            Alert.alert("Lỗi", "Không xác định được người dùng. Vui lòng đăng nhập lại.");
            return;
        }
    
        Alert.alert(
            "Xác nhận xóa",
            "Bạn có chắc chắn muốn xóa học sinh này?",
            [
                { text: "Hủy", style: "cancel" },
                {
                    text: "Xóa",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            // Retrieve the student document to validate `userId`
                            const studentRef = doc(db, "students", studentId);
                            const studentSnap = await getDoc(studentRef);
    
                            if (!studentSnap.exists()) {
                                Alert.alert("Lỗi", "Học sinh không tồn tại.");
                                return;
                            }
    
                            const studentData = studentSnap.data();
    
                            // Check if the logged-in user is associated with the student
                            if (!studentData.userId?.includes(userId)) {
                                Alert.alert("Lỗi", "Bạn không có quyền xóa học sinh này.");
                                return;
                            }
    
                            // Proceed with deletion
                            await deleteDoc(studentRef);
    
                            // Refresh the student list
                            await fetchStudents();
    
                            console.log(`Student with ID ${studentId} deleted successfully.`);
                        } catch (error) {
                            console.error("Error deleting student: ", error);
    
                            Alert.alert(
                                "Lỗi",
                                "Không thể xóa học sinh. Vui lòng thử lại sau."
                            );
                        }
                    },
                },
            ]
        );
    };
    

    useEffect(() => {
        fetchStudents(); 
    }, []);

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.userPlusButton}
                onPress={() => setModalVisible(true)}
            >
                <Feather name="user-plus" size={24} color="#fff" />
            </TouchableOpacity>
            <AddStudentModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
            />

            <FlatList
                data={students}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.information}>
                        <Text style={styles.header}> thông tin học sinh</Text>
                        <View style={styles.studentItem}>
                            <Text style={styles.studentText}>Tên: {item.name}</Text>
                            <Text style={styles.studentText}>Tuổi: {item.age}</Text>
                            {item.imageUrl && <Image source={{ uri: item.imageUrl }} style={styles.studentImage} />}
                        </View>
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={styles.editButton}
                                onPress={() => toggleEditModal(item.id, true)}
                            >
                                <Text style={styles.buttonText}>Sửa</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => handleDeleteStudent(item.id)}
                            >
                                <Text style={styles.buttonText}>Xóa</Text>
                            </TouchableOpacity>
                        </View>

                        <EditStudentModal
                            visible={editModalStates[item.id]}
                            onClose={() => toggleEditModal(item.id, false)}
                            studentId={item.id}
                        />
                    </View>
                )}
            />

            <View style={styles.information}>
                <Text style={styles.header}>Thông báo</Text>
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
    userPlusButton: {
        alignSelf: "flex-end",
        backgroundColor: "#007bff",
        borderRadius: 20,
        padding: 10,
        width: 50,
        height: 50,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    information: {
        backgroundColor: "#ECEBDE",
        height: 300,
        borderRadius: 10,
        padding: 20,
        marginBottom: 20,
    },
    header: {
        fontSize: 24,
        textAlign: "center",
        color: "#000",
        marginBottom: 16,
    },
    studentItem: {
        marginBottom: 10,
    },
    studentText: {
        fontSize: 18,
        color: "#000",
    },
    studentImage: {
        width: 100,
        height: 100,
        borderRadius: 10,
        marginTop: 10,
    },
    buttonContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 10,
    },
    editButton: {
        backgroundColor: "#007bff",
        borderRadius: 10,
        padding: 10,
    },
    deleteButton: {
        backgroundColor: "#dc3545",
        borderRadius: 10,
        padding: 10,
    },
    buttonText: {
        color: "#fff",
        fontWeight: "bold",
    },
});
