// auth.js
import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

import {
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// Регистрация пользователя
export async function registerUser(email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);

  // После успешной регистрации создаем документ клиента в Firestore
  const clientDoc = doc(db, "clients", email);
  await setDoc(clientDoc, {
    email,
    createdAt: new Date().toISOString(),
    role: email.includes("admin") ? "admin" : "client"
  });

  return cred;
}

// Вход пользователя
export async function loginUser(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred;
}

// Выход пользователя
export async function signOut() {
  await firebaseSignOut(auth);
}

// Отслеживание авторизации пользователя
export function onAuthStateChanged(callback) {
  firebaseOnAuthStateChanged(auth, callback);
}
