import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js';
import {
  getFirestore, collection, addDoc, getDocs, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';
import {
  getAuth, onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';

// 🔧 Настройки Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBYSoT1yJgt0upA08gkeZoq-FLI0kmqjYk",
  authDomain: "shopmanager-c9f0b.firebaseapp.com",
  projectId: "shopmanager-c9f0b",
  storageBucket: "shopmanager-c9f0b.firebasestorage.app",
  messagingSenderId: "1029319736818",
  appId: "1:1029319736818:web:bbfb48553e318955ec3f6b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const productList = document.getElementById('productList');

async function loadProducts() {
  productList.innerHTML = 'Загрузка товаров...';

  try {
    const querySnapshot = await getDocs(collection(db, 'products'));
    productList.innerHTML = '';

    if (querySnapshot.empty) {
      productList.innerHTML = '<p>Товары отсутствуют.</p>';
      return;
    }

    querySnapshot.forEach(docSnap => {
      const product = docSnap.data();

      const div = document.createElement('div');
      div.className = 'product';
      div.innerHTML = `
        <h3>${product.name}</h3>
        <p>SKU: ${product.sku || ''}</p>
        <p>Цена: ${product.price} ₽</p>
        <p>В наличии: ${product.stock} шт.</p>
        ${product.imageUrl ? `<img src="${product.imageUrl}" width="100" />` : ''}
        <button>Оформить заказ</button>
      `;

      div.querySelector('button').addEventListener('click', () => {
        const user = auth.currentUser;

        if (!user) {
          alert("Пожалуйста, войдите в систему");
          window.location.href = "login.html";
          return;
        }

        addDoc(collection(db, 'clients', user.email, 'orders'), {
          product: product.name,
          status: 'Ожидает обработки',
          createdAt: serverTimestamp()
        }).then(() => {
          alert("Заказ успешно оформлен!");
          window.location.href = 'client-dashboard.html';
        }).catch((error) => {
          console.error("Ошибка при оформлении заказа", error);
          alert("Ошибка при заказе");
        });
      });

      productList.appendChild(div);
    });

  } catch (err) {
    productList.innerHTML = `<p>Ошибка загрузки товаров: ${err.message}</p>`;
    console.error(err);
  }
}

// Запускаем загрузку товаров при загрузке страницы
loadProducts();
