import { auth, db } from './firebase-config.js';
import {
  getAuth,
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

const logoutBtn = document.getElementById('logoutBtn');
const productForm = document.getElementById('productForm');
const productsContainer = document.getElementById('productsContainer');
const saveBtn = document.getElementById('saveBtn');
const cancelBtn = document.getElementById('cancelBtn');

let editId = null;

// Авторизация: пускаем только админа (как в admin-dashboard)
onAuthStateChanged(auth, user => {
  if (!user || !user.email.includes('admin')) {
    signOut(auth).then(() => window.location.href = 'login.html');
    return;
  }
  loadProducts();
});

// Выход
logoutBtn.addEventListener('click', () => {
  signOut(auth).then(() => window.location.href = 'login.html');
});

// Загрузка товаров
async function loadProducts() {
  productsContainer.innerHTML = '<p>Загрузка...</p>';
  try {
    const snapshot = await getDocs(collection(db, 'products'));
    if (snapshot.empty) {
      productsContainer.innerHTML = '<p>Нет товаров.</p>';
      return;
    }
    productsContainer.innerHTML = '';
    snapshot.forEach(docSnap => {
      const p = docSnap.data();
      const div = document.createElement('div');
      div.className = 'product-card';
      div.innerHTML = `
        <strong>${p.name}</strong> — ${p.price} ₽
        <button data-id="${docSnap.id}" data-action="edit">Редактировать</button>
        <button data-id="${docSnap.id}" data-action="delete">Удалить</button>
      `;
      productsContainer.appendChild(div);
    });
  } catch (e) {
    productsContainer.innerHTML = `<p>Ошибка: ${e.message}</p>`;
  }
}

// Обработка кликов по списку
productsContainer.addEventListener('click', async e => {
  const id = e.target.dataset.id;
  const action = e.target.dataset.action;
  if (!id || !action) return;

  const ref = doc(db, 'products', id);
  if (action === 'delete') {
    if (!confirm('Удалить товар?')) return;
    await deleteDoc(ref);
    loadProducts();
  }
  if (action === 'edit') {
    const snap = await ref.get();
    const data = snap.data();
    document.getElementById('productId').value = id;
    document.getElementById('productName').value = data.name;
    document.getElementById('productPrice').value = data.price;
    saveBtn.textContent = 'Обновить';
    cancelBtn.style.display = 'inline';
    editId = id;
  }
});

// Отмена редактирования
cancelBtn.addEventListener('click', () => {
  productForm.reset();
  editId = null;
  saveBtn.textContent = 'Сохранить';
  cancelBtn.style.display = 'none';
});

// Сохранение (добавить или обновить)
productForm.addEventListener('submit', async e => {
  e.preventDefault();
  const name = document.getElementById('productName').value.trim();
  const price = parseFloat(document.getElementById('productPrice').value);
  if (!name || isNaN(price)) return alert('Заполните поля корректно');

  if (editId) {
    await updateDoc(doc(db, 'products', editId), { name, price });
  } else {
    await addDoc(collection(db, 'products'), { name, price, createdAt: serverTimestamp() });
  }
  productForm.reset();
  editId = null;
  saveBtn.textContent = 'Сохранить';
  cancelBtn.style.display = 'none';
  loadProducts();
});
