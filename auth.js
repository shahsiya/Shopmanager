// auth.js

// Инициализация Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// Твоя конфигурация Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBYSoT1yJgt0upA08gkeZoq-FLI0kmqjYk",
  authDomain: "shopmanager-c9f0b.firebaseapp.com",
  projectId: "shopmanager-c9f0b",
  storageBucket: "shopmanager-c9f0b.appspot.com",
  messagingSenderId: "1029319736818",
  appId: "1:1029319736818:web:bbfb48553e318955ec3f6b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Экспорт нужных функций и переменных
export {
  auth,
  db,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
};
