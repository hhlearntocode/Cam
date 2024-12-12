import React, { useEffect, useState } from "react";
import {
    Image,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase.config" // Import Firebase config
import { doc, setDoc, addDoc, collection, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../firebase.config";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AddStudentModalProps {
    visible: boolean;
    onClose: () => void;
}

// interface student {
//     name: string;
//     age: number;
//     imageUrl: string;
// }

const AddStudentModal: React.FC<AddStudentModalProps> = ({
    visible,
    onClose,
}) => {
    const [name, setName] = useState("");
    const [age, setAge] = useState("");
    const [image, setImage] = useState("");

    // const [students, setStudents] = useState<student[]>([]);

    const handleImagePicker = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri); // Cập nhật đường dẫn ảnh
        }
    };

    // const fetchUser = async () => {

    // }

    // useEffect(() => {
    //     fetchUser();
    // } , [])

    const handleUpload = async () => {
        if (!image || !name || !age) {
            console.error("Missing required fields: name, age, or image.");
            return;
        }

        const userId = await AsyncStorage.getItem("userId");

        try {
            // Tạo một tham chiếu đến file trong Firebase Storage
            const imageName = `students/${Date.now()}.jpg`;
            const storageRef = ref(storage, imageName);

            // Fetch ảnh dưới dạng blob
            const response = await fetch(image);
            const blob = await response.blob();

            // Upload blob lên Firebase Storage
            await uploadBytes(storageRef, blob);
            // Lấy URL tải xuống của ảnh
            const downloadURL = await getDownloadURL(storageRef);

            // Lưu thông tin vào Firestore
            const docRef = await addDoc(collection(db, "students"), {
                name: name,
                age: parseInt(age), 
                imageUrl: downloadURL,
                createdAt: new Date(), // Thêm thời gian tạo
            });

            const studentRef = doc(db, "students", docRef.id);
            const userRef = doc(db, "user", userId);

            await updateDoc(studentRef, {
                userId: arrayUnion(userId),
            });

            await updateDoc(userRef, {
                studentId: arrayUnion(studentRef),
            })

            console.log("Document written with ID: ", docRef.id);
            console.log("Image uploaded successfully:", downloadURL);

            setName("");
            setAge("");
            setImage(""); // Reset ảnh sau khi upload thành công

            return downloadURL;
        } catch (error) {
            console.error("Error uploading image:", error);
        }
    };

    return (
        <Modal
            animationType="slide"
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

                    <TextInput
                        style={styles.input}
                        placeholder={name}
                        value={name}
                        onChangeText={setName}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder={age}
                        value={age}
                        onChangeText={setAge}
                    />
                    <TouchableOpacity
                        onPress={handleImagePicker}
                        style={styles.uploadButton}
                    >
                        <Text style={styles.uploadButtonText}>Chọn ảnh</Text>
                    </TouchableOpacity>
                    {image ? (
                        <Image source={{ uri: image }} style={styles.image} />
                    ) : (
                        <Text style={styles.placeholderText}>No image selected</Text>
                    )}

                    <TouchableOpacity
                        style={styles.submitButton}
                        onPress={handleUpload}
                    >
                        <Text style={styles.submitButtonText}>Xác nhận</Text>
                    </TouchableOpacity>
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
    modalContainer: {
        height: "90%",
        width: "100%",
        backgroundColor: "#fff",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        alignItems: "center",
    },
    closeButton: {
        alignSelf: "flex-end",
        marginBottom: 10,
    },
    closeButtonText: {
        fontSize: 18,
        color: "#000",
    },
    uploadButton: {
        backgroundColor: "#007bff",
        padding: 10,
        borderRadius: 5,
        marginBottom: 10,
    },
    uploadButtonText: {
        color: "#fff",
    },
    input: {
        width: "100%",
        padding: 10,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 5,
        marginBottom: 10,
    },
    submitButton: {
        backgroundColor: "#28a745",
        padding: 14,
        borderRadius: 10,
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
        width: 300,
        height: 200,
        borderRadius: 10,
        marginBottom: 10,
    },
    placeholderText: {
        color: "#aaa",
        marginBottom: 10,
    },
});

export default AddStudentModal;
