import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

const UserScreen = () => {
    const [info, useInfo] = useState();
    return (
        <View>
            <Text>
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
