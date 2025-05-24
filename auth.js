// auth.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// 🔐 Firebase config — замени на свои данные, если нужно
const firebaseConfig = {
  apiKey: "AIzaSyBYSoT1yJgt0upA08gkeZoq-FLI0kmqjYk",
  authDomain: "shopmanager-c9f0b.firebaseapp.com",
  projectId: "shopmanager-c9f0b",
  storageBucket: "shopmanager-c9f0b.appspot.com",
  messagingSenderId: "1029319736818",
  appId: "1:1029319736818:web:bbfb48553e318955ec3f6b"
};

// ⚙️ Initialize Firebase
const app = initializeApp(firebaseConfig);

// 🔒 Auth & Firestore
const auth = getAuth(app);
const db = getFirestore(app);

// ⬅️ Экспорт
export {
  auth,
  db,
  onAuthStateChanged,
  firebaseSignOut as signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
};
