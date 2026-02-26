import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyBMRAZTgndkRp0iWz3QpJWHejhy-t3fJCM",
  authDomain: "project-ab819.firebaseapp.com",
  projectId: "project-ab819",
  storageBucket: "project-ab819.firebasestorage.app",
  messagingSenderId: "517441246898",
  appId: "1:517441246898:web:3a46c26a03938e2b821bab"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const functions = getFunctions(app);