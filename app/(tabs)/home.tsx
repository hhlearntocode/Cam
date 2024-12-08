import Feather from "@expo/vector-icons/Feather";
import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View, Image, Alert } from "react-native";
import AddStudentModal from "../../components/AddStudent";
import ListNotification from "../../components/ListNotification";
import { db } from "../../firebase.config"; // Import cấu hình Firestore
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore"; // Các hàm Firestore
import EditStudentModal from "../../components/EditStudentModel";

const HomeScreen = () => {
    const [modalVisible, setModalVisible] = useState(false);
    const [students, setStudents] = useState([]); // State lưu danh sách học sinh
    const [editModalStates, setEditModalStates] = useState({}); // State quản lý trạng thái modal cho từng học sinh

    // Hàm lấy danh sách học sinh từ Firestore
    const fetchStudents = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "students"));
            const studentsList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setStudents(studentsList); // Lưu danh sách vào state

            // Tạo state modal ban đầu cho từng học sinh
            const initialModalStates = {};
            studentsList.forEach(student => {
                initialModalStates[student.id] = false;
            });
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

    const handleDeleteStudent = async (studentId) => {
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
                            await deleteDoc(doc(db, "students", studentId)); // Xóa học sinh khỏi Firestore
                            fetchStudents(); // Cập nhật lại danh sách học sinh
                        } catch (error) {
                            console.error("Error deleting student: ", error);
                        }
                    },
                },
            ]
        );
    };

    useEffect(() => {
        fetchStudents(); // Lấy dữ liệu khi màn hình được tải
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
                        <Text style={styles.header}>Thông tin học sinh</Text>
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
