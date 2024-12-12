import React, { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import ActionButton from "../../components/ActionButton";
import InputField from "../../components/InputField";
import { db } from "../../firebase.config";
import { collection, addDoc } from "firebase/firestore";
import { useRouter } from "expo-router";

const RegisterPage = () => {

    const [phone, setPhone] = useState("");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");

    const router = useRouter();

    const onSignUpPress = async () => {
        if (!phone || !name || !password) {
            Alert.alert("Vui lòng nhập đầy đủ thông tin"); 
            return;
        }
        
        try {
            const docRef = await addDoc(collection(db, "user"), {
                name,
                phone,
                password, 
                createdAt: new Date().toISOString(),
            });
    
            Alert.alert("Đăng ký thành công", `User ID: ${docRef.id}`);

            router.push("/login");
        } catch (error) {
            console.error("Error adding document: ", error);
            Alert.alert("Đăng ký thất bại", "Vui lòng thử lại");
        }
    };

    return (
        <View style={styles.container}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
                <InputField
                    placeholder="Name"
                    value={name}
                    onChangeText={setName}
                />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
                <InputField
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />
            </View>

            <View style={styles.inputContainer}>
                <InputField
                    placeholder="Phone"
                    value={phone}
                    onChangeText={setPhone}
                />
            </View>

            {/* Sign Up Button */}
            <View style={styles.buttonContainer}>
                <ActionButton title="Sign up" onPress={onSignUpPress} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        padding: 20,
    },
    inputContainer: {
        marginBottom: 16,
    },
    buttonContainer: {
        marginVertical: 16,
    },
});

export default RegisterPage;
