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

const addProductForm = document.getElementById('addProductForm');
const productList = document.getElementById('productList');

// 🔐 Авторизация — как в твоём коде
onAuthStateChanged(auth, async user => {
  if (!user || !user.email.includes('admin')) {
    await signOut(auth);
    window.location.href = 'login.html';
    return;
  }

  await loadAllOrders();
  await loadAllProducts();
});

// 📦 Загрузка заказов
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

    renderOrders(allOrders);
  } catch (err) {
    ordersContainer.innerHTML = '<p>Ошибка при загрузке заказов</p>';
    console.error(err);
  }
}

// 📄 Отображение заказов
function renderOrders(orders) {
  ordersContainer.innerHTML = '<h2>Все заказы</h2>';
  orders.forEach(order => {
    const div = document.createElement('div');
    div.className = 'order-card';
    div.innerHTML = `
      <h3>Заказ: ${order.id}</h3>
      <p><b>Email:</b> ${order.clientEmail}</p>
      <p><b>Товар:</b> ${order.product || '-'}</p>
      <p><b>Статус:</b> ${order.status || 'Новый'}</p>
      <p><b>Цена:</b> ${order.price || '-'}</p>
    `;
    ordersContainer.appendChild(div);
  });
}

// ➕ Добавление заказа вручную
addOrderForm.addEventListener('submit', async e => {
  e.preventDefault();
  const email = addOrderForm.email.value;
  const product = addOrderForm.product.value;
  const clientName = addOrderForm.clientName.value;
  const deliveryAdres = addOrderForm.deliveryAdres.value;
  const price = addOrderForm.price.value;
  const status = addOrderForm.status.value || 'Новый';

  try {
    await addDoc(collection(db, 'clients', email, 'orders'), {
      product,
      clientName,
      deliveryAdres,
      price,
      status,
      createdAt: serverTimestamp()
    });
    alert('Заказ добавлен');
    addOrderForm.reset();
    await loadAllOrders();
  } catch (err) {
    alert('Ошибка при добавлении заказа');
    console.error(err);
  }
});

// 🛒 Добавление товара
addProductForm.addEventListener('submit', async e => {
  e.preventDefault();
  const title = document.getElementById('productTitle').value;
  const description = document.getElementById('productDescription').value;
  const price = document.getElementById('productPrice').value;

  try {
    await addDoc(collection(db, 'products'), {
      title,
      description,
      price,
      createdAt: serverTimestamp()
    });
    alert('Товар добавлен');
    addProductForm.reset();
    await loadAllProducts();
  } catch (err) {
    alert('Ошибка при добавлении товара');
    console.error(err);
  }
});

// 📦 Загрузка товаров
async function loadAllProducts() {
  productList.innerHTML = '<p>Загрузка...</p>';
  try {
    const snapshot = await getDocs(collection(db, 'products'));
    if (snapshot.empty) {
      productList.innerHTML = '<p>Нет добавленных товаров.</p>';
      return;
    }

    productList.innerHTML = '';
    snapshot.forEach(docSnap => {
      const product = docSnap.data();
      const div = document.createElement('div');
      div.className = 'product-card';
      div.innerHTML = `
        <h4>${product.title}</h4>
        <p>${product.description}</p>
        <p><b>Цена:</b> ${product.price}</p>
      `;
      productList.appendChild(div);
    });
  } catch (err) {
    productList.innerHTML = '<p>Ошибка загрузки товаров.</p>';
    console.error(err);
  }
}

// 🚪 Выход
logoutBtn.addEventListener('click', () => {
  signOut(auth).then(() => {
    window.location.href = 'login.html';
  });
});
