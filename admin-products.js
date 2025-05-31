import { auth, db } from './firebase-config.js';
import {
  getAuth, signOut, onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';
import {
  collection, getDocs, addDoc, doc, getDoc,
  updateDoc, deleteDoc, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';
import {
  getStorage, ref as storageRef, uploadBytes, getDownloadURL
} from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js';

const logoutBtn = document.getElementById('logoutBtn');
const productForm = document.getElementById('productForm');
const productsContainer = document.getElementById('productsContainer');
const saveBtn = document.getElementById('saveBtn');
const cancelBtn = document.getElementById('cancelBtn');
const fileInput = document.getElementById('productImageFile');

const storage = getStorage();
let editId = null;

// Авторизация
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
  const snapshot = await getDocs(collection(db, 'products'));
  productsContainer.innerHTML = '';
  if (snapshot.empty) {
    productsContainer.innerHTML = '<p>Нет товаров.</p>';
    return;
  }
  for (const docSnap of snapshot.docs) {
    const p = docSnap.data();
    const div = document.createElement('div');
    div.className = 'product-card';
    div.innerHTML = `
      <h3>${p.name}</h3>
      <p><b>SKU:</b> ${p.sku}</p>
      <p><b>Цена:</b> ${p.price} ₽</p>
      <p><b>В наличии:</b> ${p.stock} шт.</p>
      ${p.imageUrl ? `<img src="${p.imageUrl}" width="100">` : ''}
      <button data-id="${docSnap.id}" data-action="edit">Редактировать</button>
      <button data-id="${docSnap.id}" data-action="delete">Удалить</button>
    `;
    productsContainer.appendChild(div);
  }
}

// Обработка кликов Edit/Delete
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
    const snap = await getDoc(ref);
    const data = snap.data();
    document.getElementById('productId').value = id;
    document.getElementById('productName').value = data.name;
    document.getElementById('productSKU').value = data.sku;
    document.getElementById('productPrice').value = data.price;
    document.getElementById('productStock').value = data.stock;
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

// Добавление/обновление
productForm.addEventListener('submit', async e => {
  e.preventDefault();
  const name = document.getElementById('productName').value.trim();
  const sku  = document.getElementById('productSKU').value.trim();
  const price = parseFloat(document.getElementById('productPrice').value);
  const stock = parseInt(document.getElementById('productStock').value, 10);

  // Загружаем файл, если выбран
  let imageUrl = '';
  const file = fileInput.files[0];
  if (file) {
    const imgRef = storageRef(storage, `products/${Date.now()}_${file.name}`);
    await uploadBytes(imgRef, file);
    imageUrl = await getDownloadURL(imgRef);
  }

  const item = { name, sku, price, stock, imageUrl, updatedAt: serverTimestamp() };
  if (editId) {
    await updateDoc(doc(db, 'products', editId), item);
  } else {
    await addDoc(collection(db, 'products'), { ...item, createdAt: serverTimestamp() });
  }

  productForm.reset();
  editId = null;
  saveBtn.textContent = 'Сохранить';
  cancelBtn.style.display = 'none';
  loadProducts();
});
