import React, { useState } from "react";
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
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db, storage } from "../firebase.config"; // Firebase config
import AsyncStorage from "@react-native-async-storage/async-storage";

interface EditStudentModalProps {
    visible: boolean;
    onClose: () => void;
    studentId: string;
}

const EditStudentModal: React.FC<EditStudentModalProps> = ({
    visible,
    onClose,
    studentId,
}) => {
    const [name, setName] = useState("");
    const [age, setAge] = useState("");
    const [image, setImage] = useState("");
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
                updatedAt: new Date(), // Thêm thời gian cập nhật
            });

            console.log("Document updated successfully");

            setName("");
            setAge("");
            setImage("");
            setCurrentImageUrl(imageUrl);

            onClose();
        } catch (error) {
            console.error("Error updating student:", error);
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
                        placeholder="Name"
                        value={name}
                        onChangeText={setName}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Age"
                        value={age}
                        onChangeText={setAge}
                        keyboardType="numeric"
                    />
                    <TouchableOpacity
                        onPress={handleImagePicker}
                        style={styles.uploadButton}
                    >
                        <Text style={styles.uploadButtonText}>Choose Image</Text>
                    </TouchableOpacity>
                    {image || currentImageUrl ? (
                        <Image
                            source={{ uri: image || currentImageUrl }}
                            style={styles.image}
                        />
                    ) : (
                        <Text style={styles.placeholderText}>No image selected</Text>
                    )}

                    <TouchableOpacity
                        style={styles.submitButton}
                        onPress={handleUpdate}
                    >
                        <Text style={styles.submitButtonText}>Update</Text>
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

export default EditStudentModal;
