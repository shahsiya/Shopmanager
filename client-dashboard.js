import { auth, db } from './firebase-config.js';
import { collection, query, where, getDocs, orderBy } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';

const ordersContainer = document.getElementById('ordersContainer');
const welcomeText = document.getElementById('welcomeText');
const logoutBtn = document.getElementById('logoutBtn');

function formatDate(timestamp) {
  const date = timestamp.toDate();
  return date.toLocaleString('ru-RU', { 
    day: '2-digit', month: '2-digit', year: 'numeric', 
    hour: '2-digit', minute: '2-digit', second: '2-digit' 
  });
}

async function loadOrders(userId) {
  const ordersRef = collection(db, 'users', userId, 'orders');
  const q = query(ordersRef, orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);

  ordersContainer.innerHTML = ''; // очистка перед загрузкой

  if (querySnapshot.empty) {
    ordersContainer.innerHTML = '<p>У вас пока нет заказов.</p>';
    return;
  }

  querySnapshot.forEach(doc => {
    const order = doc.data();

    const orderDate = order.createdAt ? formatDate(order.createdAt) : 'Дата не указана';
    const productName = order.productName || 'Не указан';
    const status = order.status || 'Неизвестно';

    ordersContainer.innerHTML += `
      <div class="order-card">
        <div class="order-header">
          <h3>Заказ №${doc.id}</h3>
          <span class="order-status">${status}</span>
        </div>
        <p><strong>Товар:</strong> ${productName}</p>
        <p><strong>Дата заказа:</strong> ${orderDate}</p>
      </div>
    `;
  });
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    welcomeText.textContent = `Добро пожаловать, ${user.email}`;
    loadOrders(user.uid);
  } else {
    window.location.href = 'login.html'; // если не залогинен — редирект на вход
  }
});

logoutBtn.addEventListener('click', async () => {
  await auth.signOut();
  window.location.href = 'login.html';
});
