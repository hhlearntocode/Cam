import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import ActionButton from "../../components/ActionButton";
import InputField from "../../components/InputField";
import { db } from "../../firebase.config";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Debug from "../(debug)/debug";
import getApiToken from "../../utils/getToken";
import { usePushNotifications } from "../../utils/pushnotification";

const LoginPage = () => {
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const { expoPushToken, notification } = usePushNotifications();
    const router = useRouter();

    const handleLogin = async () => {
        try {
            const usersRef = collection(db, "user");
            const querySnapshot = await getDocs(usersRef);

            let authenticated = false;
            let userId = "";

            // const fcmToken = getFCMdevice(userId); 
            // const ApiToken = getApiToken();
            
            const ApiToken = expoPushToken?.data;

            // console.log("hahahhahahaha: ", ApiToken);

            querySnapshot.forEach((doc) => {
                const user = doc.data();
                if (user.name === name && user.password === password) {
                    authenticated = true;
                    userId = doc.id; 
                }
            });

            if (authenticated) {
                router.push("/home");

                const userDocRef = doc(db, "user", userId); 

                await updateDoc(userDocRef, { apiToken: ApiToken });

                // await updateDoc(userRef, { fcmToken: fcmToken });
                await AsyncStorage.setItem("userId", userId);
            }

        } catch (error) {
            console.error("Error during login:", error);
            alert("An error occurred. Please try again.");
        }
    };

    const goToRegister = () => {
        router.push("/register");
    };

    return (
        <View style={styles.container}>
            <View style={styles.inputContainer}>
                <InputField placeholder="Name" value={name} onChangeText={setName} />
            </View>
            <View style={styles.inputContainer}>
                <InputField
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />
            </View>
            <View style={styles.buttonContainer}>
                <ActionButton title="Login" onPress={handleLogin} />
            </View>
            <View style={styles.registerContainer}>
                <ActionButton title="Create account" onPress={goToRegister} />
            </View>

            <Debug />

        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: "center", padding: 20 },
    inputContainer: { marginBottom: 16 },
    buttonContainer: { marginVertical: 16 },
    registerContainer: { alignItems: "center" },
});

export default LoginPage;
