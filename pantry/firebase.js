// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.apiKey,
  authDomain: "hspantryapp-fc815.firebaseapp.com",
  projectId: "hspantryapp-fc815",
  storageBucket: "hspantryapp-fc815.appspot.com",
  messagingSenderId: "964027042323",
  appId: "1:964027042323:web:1cf961a182841e8d008de6",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
export { app, firestore };
