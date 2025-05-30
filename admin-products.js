import { auth, db, signOut, onAuthStateChanged } from './auth.js';
import {
  collection, addDoc, getDocs, deleteDoc, doc, updateDoc
} from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';

const adminEmail = 'admin@example.com'; // Заменить на настоящий email админа

const adminEmailSpan = document.getElementById('adminEmail');
const logoutBtn = document.getElementById('logoutBtn');
const productForm = document.getElementById('productForm');
const productsContainer = document.getElementById('productsContainer');

logoutBtn.addEventListener('click', async () => {
  await signOut();
  window.location.href = 'login.html';
});

onAuthStateChanged(auth, async (user) => {
  if (!user || user.email !== adminEmail) {
    alert('Доступ запрещен');
    window.location.href = 'login.html';
    return;
  }

  adminEmailSpan.textContent = user.email;
  await loadProducts();
});

productForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('title').value.trim();
  const description = document.getElementById('description').value.trim();
  const price = parseFloat(document.getElementById('price').value);
  const image = document.getElementById('image').value.trim();

  if (!title || isNaN(price)) return alert('Заполните обязательные поля');

  await addDoc(collection(db, 'products'), {
    title, description, price, image
  });

  productForm.reset();
  await loadProducts();
});

async function loadProducts() {
  productsContainer.innerHTML = 'Загрузка...';
  const snapshot = await getDocs(collection(db, 'products'));

  productsContainer.innerHTML = '';
  snapshot.forEach(docSnap => {
    const product = docSnap.data();
    const div = document.createElement('div');
    div.className = 'product-card';
    div.innerHTML = `
      <h3>${product.title}</h3>
      <p>${product.description || 'Нет описания'}</p>
      <p>Цена: ${product.price}₺</p>
      ${product.image ? `<img src="${product.image}" alt="img" width="100">` : ''}
      <button onclick="deleteProduct('${docSnap.id}')">Удалить</button>
    `;
    productsContainer.appendChild(div);
  });
}

window.deleteProduct = async (id) => {
  if (confirm('Удалить товар?')) {
    await deleteDoc(doc(db, 'products', id));
    await loadProducts();
  }
};
