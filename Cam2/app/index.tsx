import { Redirect } from "expo-router";
import React from "react";

// import * as Notifications from 'expo-notifications';
// import * as Device from 'expo-device';
// import { Platform } from 'react-native';

// const getToken = async () => {
//   if (!Device.isDevice) {
//     console.warn('Bạn phải sử dụng thiết bị thật để nhận thông báo đẩy!');
//     return;
//   }

//   const { status: existingStatus } = await Notifications.getPermissionsAsync();
//   let finalStatus = existingStatus;
//   if (existingStatus !== 'granted') {
//     const { status } = await Notifications.requestPermissionsAsync();
//     finalStatus = status;
//   }

//   if (finalStatus !== 'granted') {
//     console.warn('Không thể lấy token vì không được cấp quyền!');
//     return;
//   }

//   const token = (await Notifications.getExpoPushTokenAsync()).data;
//   console.log("FCM Device Token:", token);

//   // Tùy chọn: cấu hình kênh thông báo Android
//   if (Platform.OS === 'android') {
//     await Notifications.setNotificationChannelAsync('default', {
//       name: 'default',
//       importance: Notifications.AndroidImportance.MAX,
//     });
//   }

//   return token;
// };

const Index = () => {
    //   useEffect(() => {
    //     const fetchToken = async () => {
    //       await getToken();
    //     };
    //     fetchToken();
    //   }, []);

    return <Redirect href="/home" />;
};

export default Index;
