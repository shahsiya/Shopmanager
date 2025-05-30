import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js';
import {
  getFirestore, collection, addDoc, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';
import {
  getAuth, onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';

// 🔧 Настройки Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBYSoT1yJgt0upA08gkeZoq-FLI0kmqjYk",
  authDomain: "shopmanager-c9f0b.firebaseapp.com",
  projectId: "shopmanager-c9f0b",
  storageBucket: "shopmanager-c9f0b.appspot.com",
  messagingSenderId: "1029319736818",
  appId: "1:1029319736818:web:bbfb48553e318955ec3f6b
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const products = [
  { name: "Товар 1", description: "Описание товара 1" },
  { name: "Товар 2", description: "Описание товара 2" },
  { name: "Товар 3", description: "Описание товара 3" }
];

const productList = document.getElementById('productList');

products.forEach(product => {
  const div = document.createElement('div');
  div.className = 'product';
  div.innerHTML = `
    <h3>${product.name}</h3>
    <p>${product.description}</p>
    <button>Оформить заказ</button>
  `;

  div.querySelector('button').addEventListener('click', () => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        alert("Пожалуйста, войдите в систему");
        window.location.href = "login.html";
        return;
      }

      try {
        await addDoc(collection(db, 'clients', user.email, 'orders'), {
          product: product.name,
          status: 'Ожидает обработки',
          createdAt: serverTimestamp()
        });
        alert("Заказ успешно оформлен!");
        window.location.href = 'client-dashboard.html';
      } catch (error) {
        console.error("Ошибка при оформлении заказа", error);
        alert("Ошибка при заказе");
      }
    });
  });

  productList.appendChild(div);
});
