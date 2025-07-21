import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBPUk_0uviQBHmhIYQt5KGDk4o7Xlr0REQ",
  authDomain: "anandhotels-eb164.firebaseapp.com",
  projectId: "anandhotels-eb164",
  storageBucket: "anandhotels-eb164.firebasestorage.app",
  messagingSenderId: "142783809369",
  appId: "1:142783809369:web:8d560719d818f870872e48",
  measurementId: "G-MQQDRSY6M2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;