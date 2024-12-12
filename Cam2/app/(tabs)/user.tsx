import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";


const UserScreen = () => {
    const [info, useInfo] = useState();

    const getUser = async () => {
        const userId = await AsyncStorage.getItem("userId");
        if (!userId) {
            console.error("User ID is missing from AsyncStorage.");
            return;
        }

        // lên firebase lấy thông tin về 
        // setInfo 
    };

    return (
        <View>
            <Text>
                {/* {info.name} */}
                Lorem ipsum, dolor sit amet consectetur adipisicing elit. Ut
                soluta sequi velit minima laudantium perferendis asperiores qui
                odio iusto praesentium iure, ratione mollitia nesciunt,
                inventore, quia ipsam doloremque tenetur commodi.
            </Text>
        </View>
    );
};

export default UserScreen;

const styles = StyleSheet.create({});
