import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { deleteDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import React, { useState } from "react";
import {
    Alert,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { db, storage } from "../firebase.config";
import useFetchStudents from "../hooks/useFetchStudents";
import useForm from "../hooks/useForm";
import StudentInput from "./StudentInput";

interface EditStudentModalProps {
    visible: boolean;
    onClose: () => void;
    studentId: string;
    refreshStudents: () => void;
}

const EditStudentModal: React.FC<EditStudentModalProps> = ({
    visible,
    onClose,
    studentId,
    refreshStudents,
}) => {
    const {
        name,
        setName,
        age,
        setAge,
        address,
        setAddress,
        school,
        setSchool,
        image,
        setImage,
    } = useForm();
    const { fetchStudents, setStudents } = useFetchStudents();
    const [currentImageUrl, setCurrentImageUrl] = useState("");

    // Load student data
    React.useEffect(() => {
        const fetchStudentData = async () => {
            if (!studentId) return;
            try {
                const docRef = doc(db, "students", studentId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setName(data.name || "");
                    setAge(data.age?.toString() || "");
                    setCurrentImageUrl(data.imageUrl || "");
                    setAddress(data.address || "");
                    setSchool(data.school || "");
                } else {
                    console.log("No such document!");
                }
            } catch (error) {
                console.error("Error fetching student data:", error);
            }
        };

        fetchStudentData();
    }, [studentId]);

    const handleImagePicker = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [3, 4],
            quality: 1,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const handleUpdate = async () => {
        const userId = await AsyncStorage.getItem("userId");

        if (!name || !age) {
            console.error("Missing required fields: name or age.");
            return;
        }

        try {
            let imageUrl = currentImageUrl;

            // Upload new image if one is selected
            if (image) {
                const imageName = `students/${Date.now()}.jpg`;
                const storageRef = ref(storage, imageName);
                const response = await fetch(image);
                const blob = await response.blob();

                await uploadBytes(storageRef, blob);
                imageUrl = await getDownloadURL(storageRef);
            }

            // Update Firestore document
            const docRef = doc(db, "students", studentId);
            await updateDoc(docRef, {
                name,
                age: parseInt(age, 10),
                imageUrl,
                address: address,
                school: school,
                updatedAt: new Date(), // Thêm thời gian cập nhật
            });

            console.log("Document updated successfully");
            await fetchStudents();
            refreshStudents();
            onClose();
        } catch (error) {
            console.error("Error updating student:", error);
        }
    };

    const handleDeleteStudent = async (studentId: string) => {
        // const userId = sessionStorage.getItem("userId"); // Retrieve the logged-in user's ID
        const userId = await AsyncStorage.getItem("userId");

        if (!userId) {
            Alert.alert(
                "Lỗi",
                "Không xác định được người dùng. Vui lòng đăng nhập lại."
            );
            return;
        }

        Alert.alert("Xác nhận xóa", "Bạn có chắc chắn muốn xóa học sinh này?", [
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
                            Alert.alert(
                                "Lỗi",
                                "Bạn không có quyền xóa học sinh này."
                            );
                            return;
                        }

                        // Proceed with deletion
                        await deleteDoc(studentRef);
                        setStudents((prevStudents) =>
                            prevStudents.filter(
                                (student) => student.id !== studentId
                            )
                        );
                        // Refresh the student list
                        await fetchStudents();
                        refreshStudents();
                        onClose();
                        console.log(
                            `Student with ID ${studentId} deleted successfully.`
                        );
                    } catch (error) {
                        console.error("Error deleting student: ", error);

                        Alert.alert(
                            "Lỗi",
                            "Không thể xóa học sinh. Vui lòng thử lại sau."
                        );
                    }
                },
            },
        ]);
    };

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <TouchableOpacity
                        onPress={onClose}
                        style={styles.closeButton}
                    >
                        <Text style={styles.closeButtonText}>X</Text>
                    </TouchableOpacity>
                    <ScrollView
                        contentContainerStyle={styles.scrollViewContent}
                        showsVerticalScrollIndicator={false}
                    >
                        <Text style={styles.title}>Thông tin học sinh</Text>
                        <StudentInput
                            label="Student name"
                            placeholder="Name"
                            value={name}
                            onChangeText={setName}
                        />
                        <StudentInput
                            label="Student age"
                            placeholder="Age"
                            value={age}
                            onChangeText={setAge}
                        />
                        <StudentInput
                            label="Student address"
                            placeholder="Address"
                            value={address}
                            onChangeText={setAddress}
                        />
                        <View style={styles.imgContainer}>
                            <TouchableOpacity
                                onPress={handleImagePicker}
                                style={styles.uploadButton}
                            >
                                <Text style={styles.uploadButtonText}>
                                    Chọn ảnh
                                </Text>
                            </TouchableOpacity>
                            {image || currentImageUrl ? (
                                <Image
                                    source={{ uri: image || currentImageUrl }}
                                    style={styles.image}
                                />
                            ) : (
                                <Text style={styles.placeholderText}>
                                    No image selected
                                </Text>
                            )}
                        </View>
                        <Text style={styles.title}>Thông tin trường học</Text>
                        <StudentInput
                            label="School name"
                            placeholder="School"
                            value={school}
                            onChangeText={setSchool}
                        />

                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={handleUpdate}
                        >
                            <Text style={styles.submitButtonText}>
                                Xác nhận
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => handleDeleteStudent(studentId)}
                        >
                            <Text style={styles.submitButtonText}>
                                Xóa học sinh
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "flex-end",
        alignItems: "center",
    },
    scrollViewContent: {
        paddingBottom: 20,
    },
    modalContainer: {
        height: "90%",
        width: "100%",
        backgroundColor: "#fff",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
    },
    closeButton: {
        alignSelf: "flex-end",
        marginBottom: 10,
    },
    closeButtonText: {
        fontSize: 18,
        color: "#000",
    },
    title: {
        alignSelf: "flex-start",
        marginBottom: 16,
        fontSize: 20,
        fontWeight: 500,
    },
    imgContainer:{
        alignItems: "center",
    },
    uploadButton: {
        backgroundColor: "#5b5f97",
        padding: 10,
        borderRadius: 20,
        marginVertical: 16,
        width: "50%",
        alignItems: "center",
    },
    uploadButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    submitButton: {
        backgroundColor: "#5b5f97",
        padding: 14,
        borderRadius: 20,
        width: "100%",
        alignItems: "center",
        marginTop: 10,
    },
    submitButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    image: {
        width: 200,
        height: 200,
        borderRadius: 100,
        marginBottom: 10,
    },
    placeholderText: {
        color: "#aaa",
        marginBottom: 10,
    },
    deleteButton: {
        backgroundColor: "#ff6b6c",
        padding: 14,
        borderRadius: 20,
        width: "100%",
        alignItems: "center",
        marginTop: 10,
    },
});

export default EditStudentModal;
