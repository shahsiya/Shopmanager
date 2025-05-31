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
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL
} from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js';

const logoutBtn         = document.getElementById('logoutBtn');
const productForm       = document.getElementById('productForm');
const productsContainer = document.getElementById('productsContainer');
const saveBtn           = document.getElementById('saveBtn');
const cancelBtn         = document.getElementById('cancelBtn');
const fileInput         = document.getElementById('productImageFile');

const storage = getStorage();
let editId = null;
let existingImageUrl = '';

// 1. Авторизация: пускаем только, если email содержит "admin"
onAuthStateChanged(auth, user => {
  if (!user || !user.email.includes('admin')) {
    signOut(auth).then(() => window.location.href = 'login.html');
    return;
  }
  loadProducts();
});

// 2. Выход
logoutBtn.addEventListener('click', () => {
  signOut(auth).then(() => window.location.href = 'login.html');
});

// 3. Загрузка списка товаров
async function loadProducts() {
  productsContainer.innerHTML = '<p>Загрузка...</p>';
  try {
    const snapshot = await getDocs(collection(db, 'products'));
    productsContainer.innerHTML = '';
    if (snapshot.empty) {
      productsContainer.innerHTML = '<p>Нет товаров.</p>';
      return;
    }
    snapshot.forEach(docSnap => {
      const p = docSnap.data();
      const div = document.createElement('div');
      div.className = 'product-card';
      div.innerHTML = `
        <h3>${p.name}</h3>
        <p><b>SKU:</b> ${p.sku}</p>
        <p><b>Цена:</b> ${p.price} ₽</p>
        <p><b>В наличии:</b> ${p.stock} шт.</p>
        ${p.imageUrl ? `<img src="${p.imageUrl}" width="100" style="display:block; margin-top:8px;">` : ''}
        <button data-id="${docSnap.id}" data-action="edit">Редактировать</button>
        <button data-id="${docSnap.id}" data-action="delete">Удалить</button>
      `;
      productsContainer.appendChild(div);
    });
  } catch (e) {
    console.error('Ошибка loadProducts:', e);
    productsContainer.innerHTML = `<p>Ошибка: ${e.message}</p>`;
  }
}

// 4. Обработчик кликов «Редактировать» / «Удалить»
productsContainer.addEventListener('click', async e => {
  const id = e.target.dataset.id;
  const action = e.target.dataset.action;
  if (!id || !action) return;

  const ref = doc(db, 'products', id);

  if (action === 'delete') {
    if (!confirm('Удалить товар?')) return;
    try {
      await deleteDoc(ref);
      loadProducts();
    } catch (err) {
      console.error('Ошибка deleteDoc:', err);
      alert('Ошибка при удалении товара');
    }
  }

  if (action === 'edit') {
    try {
      const snap = await getDoc(ref);
      if (!snap.exists()) throw new Error('Товар не найден');
      const data = snap.data();
      existingImageUrl = data.imageUrl || '';
      // Заполняем форму
      document.getElementById('productId').value    = id;
      document.getElementById('productName').value  = data.name;
      document.getElementById('productSKU').value   = data.sku;
      document.getElementById('productPrice').value = data.price;
      document.getElementById('productStock').value = data.stock;
      // Скрыть файл, но сохраним старый URL:
      saveBtn.textContent = 'Обновить';
      cancelBtn.style.display = 'inline';
      editId = id;
    } catch (err) {
      console.error('Ошибка getDoc при редактировании:', err);
      alert('Ошибка при загрузке товара для редактирования');
    }
  }
});

// 5. Отмена редактирования
cancelBtn.addEventListener('click', () => {
  productForm.reset();
  editId = null;
  existingImageUrl = '';
  saveBtn.textContent = 'Сохранить';
  cancelBtn.style.display = 'none';
});

// 6. Добавление / Обновление товара
productForm.addEventListener('submit', async e => {
  e.preventDefault();
  const name  = document.getElementById('productName').value.trim();
  const sku   = document.getElementById('productSKU').value.trim();
  const price = parseFloat(document.getElementById('productPrice').value);
  const stock = parseInt(document.getElementById('productStock').value, 10);

  if (!name || !sku || isNaN(price) || isNaN(stock)) {
    return alert('Пожалуйста, заполните все обязательные поля корректно');
  }

  // 6.1. Попробуем загрузить файл, если он выбран
  let imageUrl = existingImageUrl; // по умолчанию — старый URL
  const file = fileInput.files[0];
  if (file) {
    console.log('Начинаем загрузку файла:', file.name);
    try {
      const imgRef = storageRef(storage, `products/${Date.now()}_${file.name}`);
      await uploadBytes(imgRef, file);
      imageUrl = await getDownloadURL(imgRef);
      console.log('Файл загружен, URL:', imageUrl);
    } catch (uploadErr) {
      console.error('Ошибка uploadBytes/getDownloadURL:', uploadErr);
      alert('Не удалось загрузить картинку');
      return;
    }
  } else {
    console.log('Файл не выбран, используем existingImageUrl:', existingImageUrl);
  }

  // 6.2. Сохраняем в Firestore
  const item = {
    name,
    sku,
    price,
    stock,
    imageUrl: imageUrl || '',
    updatedAt: serverTimestamp()
  };

  try {
    if (editId) {
      // Обновление существующей записи
      await updateDoc(doc(db, 'products', editId), item);
      console.log('Товар обновлён:', editId);
    } else {
      // Добавление нового товара
      await addDoc(collection(db, 'products'), {
        ...item,
        createdAt: serverTimestamp()
      });
      console.log('Новый товар добавлен');
    }
    productForm.reset();
    editId = null;
    existingImageUrl = '';
    saveBtn.textContent = 'Сохранить';
    cancelBtn.style.display = 'none';
    loadProducts();
  } catch (err) {
    console.error('Ошибка addDoc/updateDoc:', err);
    alert('Ошибка при сохранении товара');
  }
});
