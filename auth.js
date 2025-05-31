// auth.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';

const firebaseConfig = {
   apiKey: "AIzaSyBYSoT1yJgt0upA08gkeZoq-FLI0kmqjYk",
  authDomain: "shopmanager-c9f0b.firebaseapp.com",
  projectId: "shopmanager-c9f0b",
  storageBucket: "shopmanager-c9f0b.firebasestorage.app",
  messagingSenderId: "1029319736818",
  appId: "1:1029319736818:web:bbfb48553e318955ec3f6b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

function signIn(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

function signOut() {
  return firebaseSignOut(auth);
}

export { auth, db, signIn, signOut, onAuthStateChanged };
