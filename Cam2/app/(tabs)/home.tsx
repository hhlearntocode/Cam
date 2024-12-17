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
                showsPagination={false}
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
                                <View style={styles.profile}>
                                    <Text style={styles.title}>Học sinh</Text>
                                    <Text style={styles.studentText}>
                                        Tên: {item.name}
                                    </Text>
                                    <Text style={styles.studentText}>
                                        Tuổi: {item.age}
                                    </Text>
                                    <Text style={styles.studentText}>
                                        Địa chỉ: {item.address}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.schoolInfo}>
                                <Text style={styles.title}>Trường học</Text>
                                <Text style={styles.studentText}>
                                    Tên: {item.school}
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
        backgroundColor: "#ffffff",
        padding: 20,
        gap: 10,
    },
    container1: {
        backgroundColor: "#ECEBDE",
        flex: 1,
        borderRadius: 40,
        paddingHorizontal: 20,
        paddingTop: 20,
        height: "auto",
    },
    wrapper: {},
    profile: {},
    studentItem: {
        flex: 1,
        gap: 10,
    },
    studentInfo: {
        flexDirection: "row",
        gap: 20,
    },
    studentImage: {
        width: 140,
        height: 140,
        borderRadius: 100,
    },
    schoolInfo: {},
    title: {
        fontSize: 24,
        fontWeight: "500",
    },
    studentText: {
        fontSize: 16,
        color: "#000",
    },
    container2: {
        gap: 10,
        height: "60%",
    },
    smallTitle: {
        fontSize: 20,
        fontWeight: "bold",
    },
});
