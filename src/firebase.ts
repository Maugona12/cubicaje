// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDbg9YQDFKr6gtoSSY7iuyEMWbT2m4OQuk",
  authDomain: "sistema-de-cubicaje.firebaseapp.com",
  projectId: "sistema-de-cubicaje",
  storageBucket: "sistema-de-cubicaje.firebasestorage.app",
  messagingSenderId: "893450989164",
  appId: "1:893450989164:web:80f69480d7f49cec9cb249",
  measurementId: "G-QM1C09BRJE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);