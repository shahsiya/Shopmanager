import { auth, db } from './firebase-config.js';
import {
  signOut,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';

const ordersContainer = document.getElementById('ordersContainer');
const logoutBtn = document.getElementById('logoutBtn');
const addOrderForm = document.getElementById('addOrderForm');

// Авторизация
onAuthStateChanged(auth, user => {
  if (!user || !user.email.includes('admin')) {
    signOut(auth).then(() => {
      window.location.href = 'login.html';
    });
  } else {
    loadAllOrders();
  }
});

// Загрузка заказов
async function loadAllOrders() {
  ordersContainer.innerHTML = '<h2>Загрузка заказов...</h2>';
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
      ordersContainer.innerHTML = '<p>Нет заказов</p>';
      return;
    }

    ordersContainer.innerHTML = '<h2>Все заказы</h2>';
    allOrders.forEach(order => {
      const div = document.createElement('div');
      div.className = 'order-card';
      div.innerHTML = `
        <p><b>ID:</b> ${order.id}</p>
        <p><b>Клиент:</b> ${order.clientEmail}</p>
        <p><b>Продукт:</b> ${order.product}</p>
        <p><b>Имя:</b> ${order.clientName}</p>
        <p><b>Адрес:</b> ${order.deliveryAdres}</p>
        <p><b>Цена:</b> ${order.price}</p>
        <p><b>Статус:</b> <input type="text" id="statusInput-${order.id}" value="${order.status || ''}" /></p>
        <button data-action="update" data-id="${order.id}" data-email="${order.clientEmail}">Обновить статус</button>
        <button data-action="delete" data-id="${order.id}" data-email="${order.clientEmail}">Удалить</button>
      `;
      ordersContainer.appendChild(div);
    });
  } catch (err) {
    ordersContainer.innerHTML = '<p>Ошибка при загрузке заказов</p>';
    console.error(err);
  }
}

// Добавление заказа
addOrderForm.addEventListener('submit', async e => {
  e.preventDefault();
  const formData = new FormData(addOrderForm);
  const email = formData.get('email');
  const clientName = formData.get('clientName');
  const deliveryAdres = formData.get('deliveryAdres');
  const product = formData.get('product');
  const price = formData.get('price');
  const status = formData.get('status') || 'Новый';

  try {
    const orderRef = collection(db, 'clients', email, 'orders');
    await addDoc(orderRef, {
      clientName,
      deliveryAdres,
      product,
      price,
      status,
      createdAt: serverTimestamp()
    });
    alert('Заказ добавлен');
    addOrderForm.reset();
    loadAllOrders();
  } catch (err) {
    alert('Ошибка добавления заказа');
    console.error(err);
  }
});

// Обработка обновления и удаления
ordersContainer.addEventListener('click', async (e) => {
  const target = e.target;
  const action = target.dataset.action;
  if (!action) return;

  const orderId = target.dataset.id;
  const clientEmail = target.dataset.email;
  const orderRef = doc(db, 'clients', clientEmail, 'orders', orderId);

  if (action === 'update') {
    const input = document.getElementById(`statusInput-${orderId}`);
    const newStatus = input?.value.trim();
    if (!newStatus) return alert('Введите статус');
    try {
      await updateDoc(orderRef, { status: newStatus });
      alert('Статус обновлён');
      loadAllOrders();
    } catch (err) {
      alert('Ошибка обновления');
      console.error(err);
    }
  }

  if (action === 'delete') {
    if (!confirm('Удалить заказ?')) return;
    try {
      await deleteDoc(orderRef);
      alert('Заказ удалён');
      loadAllOrders();
    } catch (err) {
      alert('Ошибка удаления');
      console.error(err);
    }
  }
});

// Выход
logoutBtn.addEventListener('click', () => {
  signOut(auth).then(() => window.location.href = 'login.html');
});
