// client-dashboard.js

import {
  auth,
  db,
  onAuthStateChanged,
  signOut
} from './auth.js';

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const ordersContainer = document.getElementById('ordersContainer');
const userEmailSpan = document.getElementById('userEmail');
const logoutBtn = document.getElementById('logoutBtn');

logoutBtn.addEventListener('click', async () => {
  await signOut();
  window.location.href = 'login.html';
});

onAuthStateChanged(async user => {
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  userEmailSpan.textContent = user.email;

  try {
    const ordersDocRef = doc(db, 'clients', user.email, 'orders', '1'); // Заказ №1
    const orderSnap = await getDoc(ordersDocRef);

    ordersContainer.innerHTML = '';

    if (!orderSnap.exists()) {
      ordersContainer.innerHTML = '<p>У вас пока нет заказов.</p>';
      return;
    }

    const order = orderSnap.data();
    const div = document.createElement('div');
    div.className = 'order-card';

    const statusIcons = {
      'в обработке': '🕓',
      'отправлен': '📦',
      'доставлен': '✅',
      'отменён': '❌'
    };

    div.innerHTML = `
      <div class="order-header">
        <h3>Заказ №1</h3>
        <span class="order-status">${statusIcons[order.status?.toLowerCase()] || ''} ${order.status}</span>
      </div>
      <p><strong>Товар:</strong> ${order.product || 'Не указан'}</p>
      ${order.price ? `<p><strong>Цена:</strong> ${order.price}₴</p>` : ''}
      ${order.address ? `<p><strong>Адрес:</strong> ${order.address}</p>` : ''}
      <p><strong>Дата:</strong> ${order.createdAt?.toDate().toLocaleString() || 'Не указана'}</p>
    `;

    ordersContainer.appendChild(div);

  } catch (error) {
    console.error('Ошибка при загрузке заказа:', error);
    ordersContainer.innerHTML = '<p>Ошибка загрузки заказов.</p>';
  }
});
