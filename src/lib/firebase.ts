import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDFUYc9Q88CdcSN83WIHx4ka6x-mVMsLt4",
  authDomain: "other-sandbox.firebaseapp.com",
  projectId: "other-sandbox",
  storageBucket: "other-sandbox.firebasestorage.app",
  messagingSenderId: "396452627667",
  appId: "1:396452627667:web:07d4911f9f5b1915e68026",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
