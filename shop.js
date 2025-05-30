import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js';
import {
  getFirestore, collection, addDoc, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';
import {
  getAuth, onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';

// 🔧 Настройки Firebase
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
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
