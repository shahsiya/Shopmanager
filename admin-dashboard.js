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
onAuthStateChanged(auth, async user => {
  if (!user || !user.email.includes('admin')) {
    signOut(auth).then(() => window.location.href = 'login.html');
    return;
  }

  try {
    const userDoc = await getDoc(doc(db, 'users', user.email));
    if (!userDoc.exists()) {
      throw new Error('Пользователь не найден');
    }

    const data = userDoc.data();
    const now = new Date();
    const endDate = data.subscriptionEnds?.toDate ? data.subscriptionEnds.toDate() : new Date(data.subscriptionEnds);

    if (now > endDate) {
      alert('Срок подписки истёк');
      signOut(auth).then(() => window.location.href = 'subscribe.html');
      return;
    }

    loadAllOrders();
  } catch (err) {
    console.error('Ошибка проверки подписки:', err);
    signOut(auth).then(() => window.location.href = 'subscribe.html');
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
  <div class="order-header" style="position: relative; padding-right: 120px;">
    <h3>Заказ: ${order.id}</h3>
    <span class="order-status" style="
      position: absolute;
      top: 0;
      right: 0;
      background-color: #28a745;
      color: white;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 0.9em;
      font-weight: 600;
      text-transform: capitalize;
    ">
      ${order.status || 'Неизвестно'}
    </span>
  </div>
  <p><b>Клиент:</b> ${order.clientEmail}</p>
  <p><b>Описание:</b> ${order.product || 'Нет данных'}</p>
  <p><b>Имя Клиента:</b> ${order.clientName || 'Нет данных'}</p>
  <p><b>Адрес:</b> ${order.deliveryAdres || 'Нет данных'}</p>
  <p><b>Цена:</b> ${order.price || 'Нет данных'}</p>
  <p><b>Дата создания:</b> ${order.createdAt?.toDate().toLocaleString() || 'Неизвестно'}</p>
  <div>
    <input id="statusInput-${order.id}" type="text" value="${order.status || ''}" placeholder="Обновить статус" />
    <button data-action="update" data-id="${order.id}" data-email="${order.clientEmail}">Обновить статус</button>
    <button data-action="delete" data-id="${order.id}" data-email="${order.clientEmail}">Удалить заказ</button>
  </div>
  <div style="margin-top: 8px;">
    <input id="trackingInput-${order.id}" type="text" value="${order.trackingNumber || ''}" placeholder="Введите трек номер" />
    <button data-action="updateTracking" data-id="${order.id}" data-email="${order.clientEmail}">Обновить трек номер</button>
  </div>
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
  const trackingNumber = formData.get('trackingNumber') || '';

  try {
    const orderRef = collection(db, 'clients', email, 'orders');
    await addDoc(orderRef, {
      clientName,
      deliveryAdres,
      product,
      price,
      status,
      trackingNumber,
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

  if (action === 'updateTracking') {
    const input = document.getElementById(`trackingInput-${orderId}`);
    const newTracking = input?.value.trim();
    if (!newTracking) return alert('Введите трек номер');
    try {
      await updateDoc(orderRef, { trackingNumber: newTracking });
      alert('Трек номер обновлён');
      loadAllOrders();
    } catch (err) {
      alert('Ошибка обновления трек номера');
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
