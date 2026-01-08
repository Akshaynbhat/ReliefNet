import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA_smF3KHGA5vSw1eKYpEtH35KVRgeh67o",
  authDomain: "relieflink-cf156.firebaseapp.com",
  projectId: "relieflink-cf156",
  storageBucket: "relieflink-cf156.firebasestorage.app",
  messagingSenderId: "623722579872",
  appId: "1:623722579872:web:c0f957051c6d2611f546c5",
  measurementId: "G-TRBC3YSTCB"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);
export const db = getFirestore(app);