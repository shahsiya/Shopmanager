import { auth, db, onAuthStateChanged, signOut } from './auth.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const ordersContainer = document.getElementById('ordersContainer');
const userEmailSpan = document.getElementById('userEmail');
const logoutBtn = document.getElementById('logoutBtn');

logoutBtn.addEventListener('click', async () => {
  await signOut();
  window.location.href = 'login.html';
});

onAuthStateChanged(async user => {
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  userEmailSpan.textContent = user.email;

  try {
    const ordersRef = collection(db, 'clients', user.email, 'orders');
    const snapshot = await getDocs(ordersRef);
    ordersContainer.innerHTML = '';

    console.log('Заказы пользователя:', snapshot.docs.map(doc => doc.id)); // Для отладки

    if(snapshot.empty){
      ordersContainer.innerHTML = '<p>У вас пока нет заказов.</p>';
      return;
    }

    snapshot.forEach(docSnap => {
      const order = docSnap.data();
      const div = document.createElement('div');
      div.className = 'order-card';
      div.innerHTML = `
        <h3>Заказ №${docSnap.id}</h3>
        <p>Товар: ${order.product || 'не указано'}</p>
        <p>Статус: <strong>${order.status || 'не указан'}</strong></p>
        <p>Дата заказа: ${order.createdAt ? order.createdAt.toDate().toLocaleString() : 'не указана'}</p>
      `;
      ordersContainer.appendChild(div);
    });
  } catch (error) {
    console.error('Ошибка загрузки заказов:', error);
    ordersContainer.innerHTML = '<p>Ошибка при загрузке заказов.</p>';
  }
});
