import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import {
    arrayRemove,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    updateDoc,
} from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
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
import { db, storage } from "../firebase.config"; // Firebase config
import useForm from "../hooks/useForm";
import StudentInput from "./StudentInput";

interface EditStudentModalProps {
    visible: boolean;
    onClose: () => void;
    studentId: string;
    setStudents: React.Dispatch<React.SetStateAction<any[]>>;
}

const EditStudentModal: React.FC<EditStudentModalProps> = ({
    visible,
    onClose,
    studentId,
    setStudents,
}) => {
    const {
        name,
        setName,
        age,
        setAge,
        classes,
        setClasses,
        school,
        setSchool,
        image,
        setImage,
    } = useForm();
    const [currentImageUrl, setCurrentImageUrl] = useState("");
    const [editModalStates, setEditModalStates] = useState({});

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
                    setClasses(data.classes || "");
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
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const handleUpdate = async () => {
        const userId = await AsyncStorage.getItem("userId");

        // if (!name || !age) {
        //     console.error("Missing required fields: name or age.");
        //     return;
        // }

        try {
            let imageUrl = currentImageUrl;

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
                classes,
                school,
                imageUrl,
                updatedAt: new Date(), 
            });

            console.log("Document updated successfully");

            setName("");
            setAge("");
            setImage("");
            setClasses("");
            setSchool("");
            setCurrentImageUrl("");

            setStudents((prevStudents) =>
                prevStudents.map((student) => {
                    if (student.id === studentId) {
                        return {
                            ...student,
                            name,
                            age: parseInt(age, 10),
                            classes,
                            school,
                            imageUrl,
                        };
                    }
                    return student;
                })
            );

            onClose();
        } catch (error) {
            console.error("Error updating student:", error);
        }
    };

    const handleDeleteStudent = async (studentId: string) => {
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

                        // Delete the image from Firebase Storage
                        
                        try {
                            let imageRef = studentData.imageUrl;
                            if (imageRef) {
                                imageRef = ref(storage, imageRef);
                                await deleteObject(imageRef);
                            }
                            console.error(`Image deleted successfully for ${imageRef}`);
                        } catch (error) {
                            console.error(`Error deleting image: ${error}`);
                        }

                        // delete student from user 
                        try {
                            const userRef = doc(db, "user", userId);
                            const userSnap = await getDoc(userRef);
                        
                            if (!userSnap.exists()) {
                                console.error("User document not found");
                                return;
                            }
                        
                            const userData = userSnap.data();
                        
                            console.error("User data:", userData);
                        
                            // Kiểm tra và chuyển đổi studentId thành DocumentReference
                            const studentRef = doc(db, "students", studentId);
                        
                            // Xóa DocumentReference khỏi mảng studentId
                            await updateDoc(userRef, {
                                studentId: arrayRemove(studentRef),
                            });
                        
                            console.error(`Student ID ${studentId} deleted successfully from user`);
                        } catch (error) {
                            console.error("Error deleting student from user: ", error);
                        }

                        // delete student from firestore
                        await deleteDoc(studentRef);


                        console.log(`Student with ID ${studentId} deleted successfully.`);

                        setStudents((prevStudents) =>
                            prevStudents.filter(
                                (student) => student.id !== studentId
                            )
                        );

                        onClose();
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
                            label="Student Classes"
                            placeholder="Classes"
                            value={classes}
                            onChangeText={setClasses}
                        />
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
    uploadButton: {
        backgroundColor: "#28a745",
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
        backgroundColor: "#28a745",
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
        backgroundColor: "red",
        padding: 14,
        borderRadius: 20,
        width: "100%",
        alignItems: "center",
        marginTop: 10,
    },
});

export default EditStudentModal;