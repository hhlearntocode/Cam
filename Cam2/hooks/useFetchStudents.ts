import AsyncStorage from "@react-native-async-storage/async-storage";
import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../firebase.config";

export interface Student {
    id: string;
    name: string;
    age: number;
    address: string;
    school: string;
    imageUrl?: string;
    userId?: string[];
}

const useFetchStudents = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [editModalStates, setEditModalStates] = useState({});
    const fetchStudents = async () => {
        setLoading(true);
        setError(null);
        try {
            const userId = await AsyncStorage.getItem("userId");
            if (!userId) {
                throw new Error("User ID is missing from AsyncStorage.");
            }

            const querySnapshot = await getDocs(collection(db, "students"));
            const studentsList = querySnapshot.docs
                .map(
                    (doc) =>
                        ({
                            id: doc.id,
                            ...doc.data(),
                        } as Student)
                )
                .filter((student) => student.userId?.includes(userId));

            setStudents(studentsList);

            //PHAN KHAC NHUNG TAM DE VO
            // Create initial modal states for each student
            const initialModalStates: Record<string, boolean> =
                studentsList.reduce((acc, student) => {
                    acc[student.id] = false;
                    return acc;
                }, {} as Record<string, boolean>);

            setEditModalStates(initialModalStates);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    return {
        students,
        fetchStudents,
        loading,
        error,
        setStudents,
        editModalStates,
        setEditModalStates,
    };
};

export default useFetchStudents;
