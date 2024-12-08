import { initializeApp, getApps, getApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAEMNMgviATTILTkERnXkRh9F2G5KbWe9w",
  authDomain: "blogapp-cf07c.firebaseapp.com",
  projectId: "blogapp-cf07c",
  storageBucket: "blogapp-cf07c.appspot.com",
  messagingSenderId: "169063014827",
  appId: "1:169063014827:web:4c8c372398999fb535b2ee",
  measurementId: "G-XCGP51N5P1",
};

// Kiểm tra và khởi tạo app
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Khởi tạo Firebase Storage
export const storage = getStorage(app);

export const db = getFirestore(app);
