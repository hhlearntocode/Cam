import React, { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import ActionButton from "../../components/ActionButton";
import InputField from "../../components/InputField";
import { db } from "../../firebase.config";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { useRouter } from "expo-router";
import useForm from "../../hooks/useForm";

const RegisterPage = () => {
    const { name, setName, password, setPassword, phone, setPhone } = useForm();
    const router = useRouter();

    const onSignUpPress = async () => {
        if (!phone || !name || !password || !phone) {
            Alert.alert("Vui lòng nhập đầy đủ thông tin"); 
            return;
        }
        
        try {

            const usersRef = collection(db, "user");
            const userQuery = query(usersRef, where("name", "==", name));
            const userSnapshot = await getDocs(userQuery);

            if (userSnapshot.docs.length > 0) {
                Alert.alert("Đăng ký thất bại", "Tên đã được dùng");
                return;
            }

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
            {/* Name Input */}
            <View style={styles.inputContainer}>
                <InputField
                    label="Name"
                    placeholder="Enter your name"
                    value={name}
                    onChangeText={setName}
                />
            </View>

            {/* Phone Input */}
            <View style={styles.inputContainer}>
                <InputField
                    label="Phone"
                    placeholder="Enter your phone"
                    value={phone}
                    onChangeText={setPhone}
                    secureTextEntry={false}
                />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
                <InputField
                    label="Password"
                    placeholder="Enter your password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={true}
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
