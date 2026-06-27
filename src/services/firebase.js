import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBvOlAP9Bz1mjRM3PqRh0ECUveo2A0rQHs",
  authDomain: "gi-ghalib-intelligence.firebaseapp.com",
  projectId: "gi-ghalib-intelligence",
  storageBucket: "gi-ghalib-intelligence.firebasestorage.app",
  messagingSenderId: "441134247364",
  appId: "1:441134247364:web:3bca99bc07230b2bbbc891",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();