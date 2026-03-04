// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAXNubRG-Sk4xT2X0AUyUWvpowMFCEmHpI",
  authDomain: "pitchperfect-209b3.firebaseapp.com",
  projectId: "pitchperfect-209b3",
  storageBucket: "pitchperfect-209b3.firebasestorage.app",
  messagingSenderId: "487840944049",
  appId: "1:487840944049:web:499288a992f9bb34cf7790",
  measurementId: "G-V2QKB89Y49"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// Export everything needed by the app
export { auth, db, provider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword };