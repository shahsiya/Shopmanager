import { auth, db } from './firebase-config.js';
import { signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc
} from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';

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
        <input type="text" id="statusInput-${order.id}" placeholder="Новый статус" />
        <button data-action="update" data-id="${order.id}" data-email="${order.clientEmail}">Обновить статус</button>
        <button data-action="delete" data-id="${order.id}" data-email="${order.clientEmail}">Удалить</button>
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
  const clientName = document.getElementById('clientName').value.trim();
  const adres = document.getElementById('deliveryAdres').value.trim();
  const product = document.getElementById('product').value.trim();
  const price = document.getElementById('price').value.trim();

  if (!email) {
    alert('Введите email клиента');
    return;
  }

  try {
    const ordersRef = collection(db, 'clients', email, 'orders');
    await addDoc(ordersRef, {
      clientName,
      deliveryAdres: adres,
      product,
      price,
      status: 'Новый',
      createdAt: serverTimestamp()
    });

    alert('Заказ успешно добавлен');
    addOrderForm.reset();
    loadAllOrders();
  } catch (error) {
    console.error('Ошибка при добавлении заказа:', error);
    alert('Не удалось добавить заказ: ' + error.message);
  }
});

// Обработка кнопок обновления статуса и удаления
ordersContainer.addEventListener('click', async (e) => {
  const target = e.target;
  const action = target.dataset.action;

  if (!action) return;

  const orderId = target.dataset.id;
  const clientEmail = target.dataset.email;
  const orderRefPath = ['clients', clientEmail, 'orders', orderId];

  if (action === 'update') {
    const statusInput = document.getElementById(`statusInput-${orderId}`);
    const newStatus = statusInput.value.trim();

    if (!newStatus) {
      alert('Введите новый статус');
      return;
    }

    try {
      const orderRef = doc(db, ...orderRefPath);
      await updateDoc(orderRef, { status: newStatus });
      alert('Статус обновлён');
      loadAllOrders();
    } catch (err) {
      alert('Ошибка при обновлении статуса: ' + err.message);
    }

  } else if (action === 'delete') {
    if (!confirm('Удалить этот заказ?')) return;

    try {
      const orderRef = doc(db, ...orderRefPath);
      await deleteDoc(orderRef);
      alert('Заказ удалён');
      loadAllOrders();
    } catch (err) {
      alert('Ошибка при удалении заказа: ' + err.message);
    }
  }
});
