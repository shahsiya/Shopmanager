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
  serverTimestamp,
  getDoc
} from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';

const ordersContainer = document.getElementById('ordersContainer');
const logoutBtn = document.getElementById('logoutBtn');
const addOrderForm = document.getElementById('addOrderForm');

// ======== Новое для товаров ========
const productsContainerId = 'productsContainer';

// Функция для загрузки товаров
async function loadProducts() {
  let container = document.getElementById(productsContainerId);
  if (!container) {
    container = document.createElement('div');
    container.id = productsContainerId;
    container.innerHTML = `<h2>Управление товарами</h2>
      <form id="addProductForm">
        <input id="productName" type="text" placeholder="Название товара" required />
        <input id="productPrice" type="number" placeholder="Цена" required />
        <button type="submit">Добавить товар</button>
      </form>
      <div id="productsList"></div>
    `;
    ordersContainer.parentNode.insertBefore(container, ordersContainer.nextSibling);
  }

  const productsList = container.querySelector('#productsList');
  productsList.innerHTML = '<p>Загрузка товаров...</p>';

  try {
    const productsSnapshot = await getDocs(collection(db, 'products'));
    if (productsSnapshot.empty) {
      productsList.innerHTML = '<p>Товары не найдены</p>';
      return;
    }

    productsList.innerHTML = '';
    productsSnapshot.forEach(docSnap => {
      const p = docSnap.data();
      const div = document.createElement('div');
      div.className = 'product-card';
      div.innerHTML = `
        <b>${p.name}</b> — ${p.price} ₽
        <button data-action="edit" data-id="${docSnap.id}">Редактировать</button>
        <button data-action="delete" data-id="${docSnap.id}">Удалить</button>
      `;
      productsList.appendChild(div);
    });

  } catch (error) {
    productsList.innerHTML = `<p>Ошибка загрузки товаров: ${error.message}</p>`;
  }
}

// Обработка добавления товара
async function onAddProduct(e) {
  e.preventDefault();
  const nameInput = document.getElementById('productName');
  const priceInput = document.getElementById('productPrice');
  const name = nameInput.value.trim();
  const price = parseFloat(priceInput.value);

  if (!name || isNaN(price) || price <= 0) {
    alert('Введите корректное название и цену товара');
    return;
  }

  try {
    await addDoc(collection(db, 'products'), { name, price });
    alert('Товар добавлен');
    nameInput.value = '';
    priceInput.value = '';
    await loadProducts();
  } catch (error) {
    alert('Ошибка добавления товара');
    console.error(error);
  }
}

// Обработка кликов по товарам (редактирование/удаление)
async function onProductsListClick(e) {
  const target = e.target;
  if (!target.dataset.action) return;

  const action = target.dataset.action;
  const id = target.dataset.id;
  const productRef = doc(db, 'products', id);

  if (action === 'delete') {
    if (!confirm('Удалить товар?')) return;
    try {
      await deleteDoc(productRef);
      alert('Товар удалён');
      await loadProducts();
    } catch (err) {
      alert('Ошибка удаления товара');
      console.error(err);
    }
  } else if (action === 'edit') {
    const newName = prompt('Введите новое название товара');
    if (!newName) return alert('Название не может быть пустым');
    const newPriceStr = prompt('Введите новую цену товара');
    const newPrice = parseFloat(newPriceStr);
    if (isNaN(newPrice) || newPrice <= 0) return alert('Некорректная цена');

    try {
      await updateDoc(productRef, { name: newName, price: newPrice });
      alert('Товар обновлён');
      await loadProducts();
    } catch (err) {
      alert('Ошибка обновления товара');
      console.error(err);
    }
  }
}

// ======== Существующий код авторизации и заказов (твой оригинальный) ========

// Авторизация
onAuthStateChanged(auth, async user => {
  if (!user || !user.email.includes('admin')) {
    await signOut(auth);
    window.location.href = 'login.html';
    return;
  }

  try {
    const userDoc = await getDoc(doc(db, 'clients', user.email));
    if (!userDoc.exists()) {
      throw new Error('Пользователь не найден');
    }

    const data = userDoc.data();
    const now = new Date();
    const endDate = data.subscriptionEnds?.toDate ? data.subscriptionEnds.toDate() : new Date(data.subscriptionEnds);
    const isSubscriptionExpired = endDate && now > endDate;
    const isSubscriptionInactive = data.subscriptionActive === false;

    if (isSubscriptionExpired || isSubscriptionInactive) {
      alert('Ваша подписка неактивна или истекла.');
      window.location.href = 'subscribe.html';
      return;
    }

    await loadAllOrders();
    await loadProducts(); // загружаем товары после заказов

  } catch (err) {
    console.error('Ошибка проверки подписки:', err);
    await signOut(auth);
    window.location.href = 'subscribe.html';
  }
});

// Загрузка заказов (без изменений)
let allOrders = [];
let currentPage = 1;
const ordersPerPage = 10;

async function loadAllOrders() {
  ordersContainer.innerHTML = '<h2>Загрузка заказов...</h2>';
  try {
    const clientsSnapshot = await getDocs(collection(db, 'clients'));
    allOrders = [];

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

    renderOrders();

  } catch (err) {
    ordersContainer.innerHTML = '<p>Ошибка при загрузке заказов</p>';
    console.error(err);
  }
}

function renderOrders() {
  ordersContainer.innerHTML = '';
  const startIndex = (currentPage - 1) * ordersPerPage;
  const endIndex = startIndex + ordersPerPage;
  const paginatedOrders = allOrders.slice(startIndex, endIndex);

  if (paginatedOrders.length === 0) {
    ordersContainer.innerHTML = '<p>Нет заказов</p>';
    return;
  }

  const title = document.createElement('h2');
  title.textContent = 'Все заказы';
  ordersContainer.appendChild(title);

  paginatedOrders.forEach(order => {
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

  // Кнопки пагинации
  const paginationDiv = document.createElement('div');
  paginationDiv.style.marginTop = '20px';

  if (currentPage > 1) {
    const prevBtn = document.createElement('button');
    prevBtn.textContent = 'Назад';
    prevBtn.onclick = () => {
      currentPage--;
      renderOrders();
    };
    paginationDiv.appendChild(prevBtn);
  }

  if (endIndex < allOrders.length) {
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Вперёд';
    nextBtn.onclick = () => {
      currentPage++;
      renderOrders();
    };
    paginationDiv.appendChild(nextBtn);
  }

  ordersContainer.appendChild(paginationDiv);
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
    await loadAllOrders();
  } catch (err) {
    alert('Ошибка добавления заказа');
    console.error(err);
  }
});

// Обработка обновления и удаления заказов
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
