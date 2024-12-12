import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

const getApiToken = async () => {
    let token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas.projectId,
    });
    return token;
}

export default getApiToken;
