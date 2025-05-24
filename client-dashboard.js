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
  await signOut();
  window.location.href = 'login.html';
});

// ✅ Правильный способ использования onAuthStateChanged
onAuthStateChanged(auth, async user => {
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  userEmailSpan.textContent = user.email;

  // Путь: clients/{email}/orders
  const ordersRef = collection(db, 'clients', user.email, 'orders');
  const snapshot = await getDocs(ordersRef);
  ordersContainer.innerHTML = '';

  if (snapshot.empty) {
    ordersContainer.innerHTML = '<p>У вас пока нет заказов.</p>';
    return;
  }

  snapshot.forEach(docSnap => {
    const order = docSnap.data();
    const div = document.createElement('div');
    div.className = 'order-card';
    div.innerHTML = `
      <h3>Заказ №${docSnap.id}</h3>
      <p>Товар: ${order.product || 'Не указан'}</p>
      <p>Статус: <strong>${order.status || 'Ожидает обработки'}</strong></p>
      <p>Дата заказа: ${order.createdAt?.toDate().toLocaleString() || 'Неизвестно'}</p>
    `;
    ordersContainer.appendChild(div);
  });
});
