import { auth, db } from './firebase-config.js';
import { signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';
import { collection, getDocs, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';

const ordersContainer = document.getElementById('ordersContainer');
const logoutBtn = document.getElementById('logoutBtn');
const addOrderForm = document.getElementById('addOrderForm');

// Проверка авторизации
onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.href = 'login.html';
  } else {
    if (!user.email.includes('admin')) {
      alert('Доступ запрещён');
      signOut(auth);
      window.location.href = 'login.html';
    } else {
      loadAllOrders();
    }
  }
});

// Загрузка всех заказов
async function loadAllOrders() {
  ordersContainer.innerHTML = '<h2>Все заказы клиентов</h2><p>Загрузка заказов...</p>';
  try {
    const clientsSnapshot = await getDocs(collection(db, 'clients'));
    const allOrders = [];

    for (const clientDoc of clientsSnapshot.docs) {
      const ordersRef = collection(db, 'clients', clientDoc.id, 'orders');
      const ordersSnapshot = await getDocs(ordersRef);

      ordersSnapshot.forEach(orderDoc => {
        allOrders.push({
          id: orderDoc.id,
          clientEmail: clientDoc.id,
          ...orderDoc.data()
        });
      });
    }

    if (allOrders.length === 0) {
      ordersContainer.innerHTML = '<h2>Все заказы клиентов</h2><p>Заказы отсутствуют.</p>';
      return;
    }

    ordersContainer.innerHTML = '<h2>Все заказы клиентов</h2>';
    allOrders.forEach(order => {
      const div = document.createElement('div');
      div.className = 'order-card';
      div.innerHTML = `
        <div class="order-header">
          <h3>Заказ: ${order.id}</h3>
          <span class="order-status">${order.status || 'Неизвестно'}</span>
        </div>
        <p><b>Клиент:</b> ${order.clientEmail}</p>
        <p><b>Описание:</b> ${order.product || 'Нет данных'}</p>
        <p><b>Имя Клиента:</b> ${order.clientName || 'Нет данных'}</p>
        <p><b>Адрес:</b> ${order.deliveryAdres || 'Нет данных'}</p>
        <p><b>Цена:</b> ${order.price || 'Нет данных'}</p>
        <p><b>Дата создания:</b> ${order.createdAt?.toDate().toLocaleString() || 'Неизвестно'}</p>
      `;
      ordersContainer.appendChild(div);
    });
  } catch (error) {
    ordersContainer.innerHTML = `<h2>Все заказы клиентов</h2><p>Ошибка загрузки заказов: ${error.message}</p>`;
  }
}

// Выход
logoutBtn.addEventListener('click', () => {
  signOut(auth).then(() => {
    window.location.href = 'login.html';
  });
});

// Добавление заказа вручную
addOrderForm.addEventListener('submit', async e => {
  e.preventDefault();

  const email = document.getElementById('clientEmail').value.trim();
  const product = document.getElementById('product').value.trim();
  const clientName = document.getElementById('clientName').value.trim();
  const deliveryAdres = document.getElementById('deliveryAdres').value.trim();
  const price = document.getElementById('price').value.trim();
  const status = document.getElementById('status').value.trim() || 'Новый';

  if (!email || !product) {
    alert('Пожалуйста, заполните Email и описание товара');
    return;
  }

  try {
    const ordersRef = collection(db, 'clients', email, 'orders');
    await addDoc(ordersRef, {
      clientName,
      deliveryAdres,
      product,
      price,
      status,
      createdAt: serverTimestamp()
    });

    alert('Заказ успешно добавлен');
    addOrderForm.reset();
    loadAllOrders();  // если есть такая функция для обновления списка
  } catch (error) {
    alert('Ошибка при добавлении заказа: ' + error.message);
  }
});
