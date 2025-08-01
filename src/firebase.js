
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
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
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider, signInWithPopup };