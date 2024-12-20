import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Swiper from "react-native-swiper";
import EditStudentModal from "../../components/EditStudentModel";
import ListNotification from "../../components/ListNotification";
import useFetchStudents from "../../hooks/useFetchStudents";

const HomeScreen = () => {
    const {
        students,
        fetchStudents,
        loading,
        error,
        editModalStates,
        setEditModalStates,
    } = useFetchStudents();

    if (loading) {
        return <Text>Đang tải...</Text>;
    }

    if (error) {
        return <Text>Lỗi: {error}</Text>;
    }

    const toggleEditModal = (studentId: string, isVisible: boolean) => {
        setEditModalStates((prevStates) => ({
            ...prevStates,
            [studentId]: isVisible,
        }));
    };

    return (
        <View style={styles.container}>
            <Swiper
                style={styles.wrapper}
                showsButtons={true}
                showsPagination={true}
                paginationStyle={{
                    bottom: 10,
                }}
                dotStyle={{
                    backgroundColor: "rgba(255,165,0,0.3)",
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    marginHorizontal: 3,
                }}
                activeDotStyle={{
                    backgroundColor: "#6C63FF",
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    marginHorizontal: 3,
                }}
                nextButton={<Text style={styles.buttonText}>›</Text>} // Custom next button
                prevButton={<Text style={styles.buttonText}>‹</Text>}
            >
                {students.map((item) => (
                    <TouchableOpacity
                        style={styles.container1}
                        onPress={() => toggleEditModal(item.id, true)}
                        key={item.id}
                    >
                        <View style={styles.studentItem}>
                            <View style={styles.studentInfo}>
                                {item.imageUrl && (
                                    <Image
                                        source={{ uri: item.imageUrl }}
                                        style={styles.studentImage}
                                    />
                                )}
                            </View>
                            <View style={styles.schoolInfo}>
                                <Text style={styles.title}>
                                    Thông tin học sinh
                                </Text>
                                <Text style={styles.studentText}>
                                    Tên: {item.name}
                                </Text>
                                <Text style={styles.studentText}>
                                    Tuổi: {item.age}
                                </Text>
                                <Text style={styles.studentText}>
                                    Địa chỉ: {item.address}
                                </Text>
                                <Text style={styles.studentText}>
                                    Trường: {item.school}
                                </Text>
                            </View>
                        </View>
                        {/* Edit modal */}
                        <EditStudentModal
                            visible={
                                (editModalStates as { [key: string]: boolean })[
                                    item.id
                                ]
                            }
                            onClose={() => toggleEditModal(item.id, false)}
                            studentId={item.id}
                            refreshStudents={fetchStudents}
                        />
                    </TouchableOpacity>
                ))}
            </Swiper>

            <View style={styles.container2}>
                <Text style={styles.smallTitle}>Thông báo</Text>
                <ListNotification />
            </View>
        </View>
    );
};

export default HomeScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fffffb",
        gap: 10,
        padding: 16,
    },
    container1: {
        backgroundColor: "#EDEAFF",
        flex: 1,
        borderRadius: 40,
        padding: 10,
        height: "auto",
        marginTop: 20,
    },
    wrapper: {},
    buttonText: {
        color: "#6C63FF",
        fontSize: 44,
        fontWeight: "bold",
    },
    studentItem: {
        flex: 1,
        gap: 20,
        flexDirection: "row",
        alignItems: "center",
    },
    studentInfo: {},
    studentImage: {
        width: 140,
        height: 140,
        borderRadius: 100,
    },
    schoolInfo: {},
    title: {
        fontSize: 20,
        fontWeight: "500",
        color: "#000",
        marginBottom: 12,
    },
    studentText: {
        fontSize: 16,
        color: "#000",
    },
    container2: {
        paddingTop: 20,
        height: "60%",
    },
    smallTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#000"
    },
});
