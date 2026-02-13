import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCid9wQZ2q8_HnrZg0_eBBuzVjvvKwdDlk",
  authDomain: "clawdentials.firebaseapp.com",
  projectId: "clawdentials",
  storageBucket: "clawdentials.firebasestorage.app",
  messagingSenderId: "361527168048",
  appId: "1:361527168048:web:53ef00dd89caafae7231f5",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
