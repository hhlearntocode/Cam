import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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

                try {
                    await AsyncStorage.setItem("userId", userId);
                    console.log("Stored userId:", userId);
                } catch (error) {
                    console.error("Error storing userId:", error);
                }

                if (ApiToken) {
                    await updateDoc(userDocRef, { apiToken: ApiToken });
                }
            } else {
                Alert.alert("Invalid credentials. Please try again.");
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
                source={require("../../assets/hifive_logo.png")}
                contentFit="contain"
                transition={1000}
            ></Image>
            {/* Title */}
            <Text style={styles.title}>Work without limits</Text>

            {/* Name Input */}
            <View style={styles.inputContainer}>
                <InputField
                    label="Username"
                    placeholder="Enter your username"
                    value={name}
                    onChangeText={setName}
                />
            </View>
            {/* Password Input */}
            <View style={styles.inputContainer}>
                <InputField
                    label="Password"
                    placeholder="Enter your password"
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
            <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <View style={styles.textContainer}>
                    <Text style={styles.text}>Or</Text>
                </View>
            </View>
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
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        padding: 20,
        backgroundColor: "#F8FAFC",
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
        width: "100%",
    },
    buttonContainer: {
        width: "100%",
    },
    dividerContainer: {
        width: "100%",
        alignItems: "center",
        position: "relative",
        marginVertical: 30,
    },
    divider: {
        width: "100%",
        height: 1,
        backgroundColor: "#a7a7a7",
        position: "relative",
    },
    textContainer: {
        position: "absolute",
        bottom: -13,
        backgroundColor: "#F8FAFC",
        padding: 5,
    },
    text: { color: "black", fontSize: 14, fontWeight: "700" },
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
