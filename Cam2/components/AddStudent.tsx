import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import {
    addDoc,
    arrayUnion,
    collection,
    doc,
    updateDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import React from "react";
import {
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { db, storage } from "../firebase.config"; // Import Firebase config
import useForm from "../hooks/useForm";
import StudentInput from "./StudentInput";

interface AddStudentModalProps {
    visible: boolean;
    onClose: () => void;
    setStudents: React.Dispatch<React.SetStateAction<any[]>>;
    setEditModalStates: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

// interface student {
//     name: string;
//     age: number;
//     imageUrl: string;
// }

const AddStudentModal: React.FC<AddStudentModalProps> = ({
    visible,
    onClose,
    setStudents,
    setEditModalStates,
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

    const handleUpload = async () => {
        if (!image || !name || !age || !school || !address) {
            console.error("All input is required");
            alert("All input is required");
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
            });

            console.log("Document written with ID: ", docRef.id);
            console.log("Image uploaded successfully:", downloadURL);

            setName("");
            setAge("");
            setImage(""); // Reset ảnh sau khi upload thành công
            setStudents((prevStudents) => [...prevStudents, { id: docRef.id, name, age, imageUrl: downloadURL }]);
            setEditModalStates((prevStates) => ({ ...prevStates, [docRef.id]: false }));

            onClose();
        } catch (error) {
            console.error("Error uploading image:", error);
            alert("Error uploading image");
        }
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
                        <TouchableOpacity
                            onPress={handleImagePicker}
                            style={styles.uploadButton}
                        >
                            <Text style={styles.uploadButtonText}>
                                Chọn ảnh
                            </Text>
                        </TouchableOpacity>
                        {image ? (
                            <Image
                                source={{ uri: image }}
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
                            onPress={handleUpload}
                        >
                            <Text style={styles.submitButtonText}>
                                Xác nhận
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
