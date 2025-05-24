// client-dashboard.js

import { auth, db, signOut } from './auth.js';
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

const ordersContainer = document.getElementById('ordersContainer');
const userEmailSpan = document.getElementById('userEmail');
const logoutBtn = document.getElementById('logoutBtn');

logoutBtn.addEventListener('click', async () => {
  await signOut(auth);
  window.location.href = 'login.html';
});

onAuthStateChanged(auth, async user => {
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  userEmailSpan.textContent = user.email;

  // Здесь используем user.email — если ты именно так хранишь документы,
  // но рекомендую перейти на user.uid (см. ниже)
  const ordersRef = collection(db, 'clients', user.email, 'orders');

  try {
    const snapshot = await getDocs(ordersRef);
    console.log('snapshot size:', snapshot.size);  // Лог количества заказов
    ordersContainer.innerHTML = '';

    if (snapshot.empty) {
      ordersContainer.innerHTML = '<p>У вас пока нет заказов.</p>';
      return;
    }

    snapshot.forEach(docSnap => {
      const order = docSnap.data();
      console.log('Order data:', order); // Лог данных заказа
      // Убираем кавычки в начале и конце, если есть
      const cleanProduct = order.product ? order.product.replace(/^"+|"+$/g, '') : 'Не указан';
      console.log('Product field:', cleanProduct); // Лог поля product

      const div = document.createElement('div');
      div.className = 'order-card';
      div.innerHTML = `
        <h3>Заказ №${docSnap.id}</h3>
        <p>Товар: ${cleanProduct}</p>
        <p>Статус: <strong>${order.status || 'Ожидает обработки'}</strong></p>
        <p>Дата заказа: ${order.createdAt?.toDate().toLocaleString() || 'Неизвестно'}</p>
      `;
      ordersContainer.appendChild(div);
    });
  } catch (error) {
    ordersContainer.innerHTML = `<p>Ошибка при загрузке заказов: ${error.message}</p>`;
    console.error(error);
  }
});
