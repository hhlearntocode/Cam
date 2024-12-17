import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { addDoc, collection } from "firebase/firestore";
import { Alert, StyleSheet, Text, View } from "react-native";
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
                    placeholder="Name"
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
            {/* Phone Input */}
            <View style={styles.inputContainer}>
                <InputField
                    label="Your phone number"
                    placeholder="Phone"
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
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
        marginBottom: 50,
    },
    inputContainer: {
        width: "100%",
        marginBottom: 10,
    },
    buttonContainer: {
        width: "100%",
        marginTop: 16,
    },
});

export default RegisterPage;
