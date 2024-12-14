import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Debug from "../(debug)/debug";
import ActionButton from "../../components/ActionButton";
import InputField from "../../components/InputField";
import { db } from "../../firebase.config";
import useForm from "../../hooks/useForm";
import { usePushNotifications } from "../../utils/pushnotification";

//co the them phan xu ly khi ng dung chua nhap email voi pass thi button khong duoc an va mau xam --> nhap xong ca 2 thi hien mau len va duoc an
const LoginPage = () => {
    const { name, setName, password, setPassword } = useForm();
    const { expoPushToken, notification } = usePushNotifications();
    const router = useRouter();

    //BO? VO COMPONENT + ADD ALERT
    const handleLogin = async () => {
        if (!name || !password) {
            Alert.alert("Invalid login, please try again");
            return;
        }
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
            //BUG KHONG ALERT DUOC
            Alert.alert("Invalid login, please try again");
        }
    };

    const goToRegister = () => {
        router.push("/register");
    };

    return (
        <View style={styles.container}>
            {/* Logo */}
            <Image
                style={styles.logo}
                source="https://www.musicman.co.jp/sites/default/files/inline-images/hifive_logo.jpg"
                contentFit="contain"
                transition={1000}
            ></Image>
            {/* Title */}
            <Text style={styles.title}>Work without limits</Text>

            {/* Email Input */}
            <View style={styles.inputContainer}>
                <InputField
                    label="Your email address"
                    placeholder="Email"
                    value={name}
                    onChangeText={setName}
                />
            </View>
            {/* Password Input */}
            <View style={styles.inputContainer}>
                <InputField
                    label="Choose a password"
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />
            </View>
            {/* Login Button */}
            <View style={styles.buttonContainer}>
                <ActionButton title="Sign in" onPress={handleLogin} />
            </View>

            {/* Divider */}
            <Text style={styles.divider}>
                _______________________________________________
            </Text>
            {/* Sign up with Google */}
            <TouchableOpacity style={styles.button} onPress={() => {}}>
                <Image
                    style={styles.logoG}
                    source="https://th.bing.com/th/id/R.7e557f1c0864829c54c300d15bee69f4?rik=fjZN1AYH30vXIw&riu=http%3a%2f%2fpngimg.com%2fuploads%2fgoogle%2fgoogle_PNG19635.png&ehk=ZmsumEtoeJQhKoUzQTZO2TEbYPBu0%2b7EFdjmJ3qljls%3d&risl=&pid=ImgRaw&r=0"
                    contentFit="contain"
                    transition={1000}
                ></Image>
                <Text style={styles.buttonText}>Sign up with Google</Text>
            </TouchableOpacity>
            {/* Sign up */}
            <View style={styles.regisContain}>
                <Text>Don't have an account?</Text>
                <TouchableOpacity onPress={goToRegister}>
                    <Text style={styles.regisText}>Sign Up here</Text>
                </TouchableOpacity>
            </View>
            {/* Token */}
            <Debug />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        padding: 20,
        backgroundColor: "#fefefe",
        alignItems: "center",
    },
    logo: {
        alignSelf: "center",
        width: 200,
        height: 75,
    },
    title: {
        fontSize: 18,
        fontWeight: "600",
        color: "#333",
        marginBottom: 100,
    },
    inputContainer: {
        marginBottom: 16,
        width: "100%",
    },
    buttonContainer: {
        width: "100%",
    },
    divider: {
        fontSize: 16,
        color: "#999",
        marginVertical: 16,
        opacity: 0.2,
    },
    button: {
        width: "100%",
        justifyContent: "center",
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 30,
        borderWidth: 1,
        borderColor: "#999",
        padding: 12,
    },
    logoG: {
        width: 30,
        height: 30,
    },
    buttonText: {
        fontWeight: 500,
    },
    regisContain: {
        flexDirection: "row",
        gap: 3,
        marginTop: 20,
    },
    regisText: {
        color: "blue",
    },
});

export default LoginPage;
