import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const HeaderNavigator = () => {
    return (
        <View style={styles.header}>
            <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backButton}
            >
                <Text style={styles.backButtonText}>Quay lại</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: "row",
        alignItems: "center",
        padding: 10,
        backgroundColor: "#121212",
    },
    backButton: {
        marginRight: 20,
        padding: 10,
        backgroundColor: "#007bff",
        borderRadius: 5,
    },
    backButtonText: {
        color: "#fff",
    },
});

export default HeaderNavigator;
