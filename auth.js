// ВЕРХ auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// Конфигурация Firebase — вставь сюда свои данные
const firebaseConfig = {
  apiKey: "AIzaSyBYSoT1yJgt0upA08gkeZoq-FLI0kmqjYk",
  authDomain: "shopmanager-c9f0b.firebaseapp.com",
  projectId: "shopmanager-c9f0b",
  storageBucket: "shopmanager-c9f0b.appspot.com",
  messagingSenderId: "1029319736818",
  appId: "1:1029319736818:web:bbfb48553e318955ec3f6b"
};

// Инициализация приложения Firebase
const app = initializeApp(firebaseConfig);

// Получаем объекты аутентификации и базы данных
const auth = getAuth(app);
const db = getFirestore(app);

// Экспортируем необходимые функции и объекты для работы с Firebase
export {
  auth,
  db,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
};
