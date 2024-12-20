import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { addDoc, collection } from "firebase/firestore";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ActionButton from "../../components/ActionButton";
import InputField from "../../components/InputField";
import { db } from "../../firebase.config";
import useForm from "../../hooks/useForm";

const RegisterPage = () => {
    const {
        name,
        setName,
        password,
        setPassword,
        phone,
        setPhone,
        confirmPassword,
        setConfirmPassword,
    } = useForm();

    const router = useRouter();
    const goToLogin = () => {
        router.push("/login");
    };

    const onSignUpPress = async () => {
        if (!phone || !name || !password || !confirmPassword) {
            Alert.alert("Please enter all required information");
            return;
        }
        if (password != confirmPassword) {
            Alert.alert("Password do not match");
            return;
        }
        try {
            const docRef = await addDoc(collection(db, "user"), {
                name,
                phone,
                password,
                createdAt: new Date().toISOString(),
            });

            Alert.alert("Registration successful");

            router.push("/login");
        } catch (error) {
            console.error("Error adding document: ", error);
            Alert.alert("Registration failed", "Please try again");
        }
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
            {/* Email Input */}
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
            {/* Phone Input */}
            <View style={styles.inputContainer}>
                <InputField
                    label="Phone"
                    placeholder="Enter your number"
                    value={phone}
                    onChangeText={setPhone}
                />
            </View>
            {/* Confirm Pass */}
            <View style={styles.inputContainer}>
                <InputField
                    label="Confirm password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                />
            </View>

            {/* Sign Up Button */}
            <View style={styles.buttonContainer}>
                <ActionButton title="Sign up" onPress={onSignUpPress} />
            </View>
            {/* Sign in */}
            <View style={styles.loginContain}>
                <Text>Already have an account?</Text>
                <TouchableOpacity onPress={goToLogin}>
                    <Text style={styles.loginText}>Login</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#F8FAFC",
        alignItems: "center",
        marginTop: 20,
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
        marginBottom: 50,
    },
    inputContainer: {
        width: "100%",
    },
    buttonContainer: {
        width: "100%",
        marginTop: 16,
    },
    loginContain: {
        flexDirection: "row",
        gap: 3,
        marginTop: 20,
    },
    loginText: {
        color: "blue",
    },
});

export default RegisterPage;
