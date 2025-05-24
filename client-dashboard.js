import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';
import { collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';

// Обработчик выхода
const logoutBtn = document.getElementById('logoutBtn');
logoutBtn.addEventListener('click', async () => {
	try {
		await signOut(auth);
		window.location.href = 'login.html';
	} catch (error) {
		console.error('Ошибка выхода:', error);
	}
});

// Проверка авторизации
onAuthStateChanged(auth, async (user) => {
	if (user) {
		document.getElementById('userEmail').textContent = user.email;
		loadUserOrders(user.email);
	} else {
		window.location.href = 'login.html';
	}
});

// Загрузка заказов пользователя
async function loadUserOrders(userEmail) {
	const ordersContainer = document.getElementById('ordersContainer');
	ordersContainer.innerHTML = '';

	try {
		const ordersRef = collection(db, 'orders');
		const q = query(ordersRef, where('email', '==', userEmail));
		const querySnapshot = await getDocs(q);

		if (querySnapshot.empty) {
			ordersContainer.innerHTML = '<p>У вас пока нет заказов.</p>';
			return;
		}

		querySnapshot.forEach((doc) => {
			const order = doc.data();
			const card = document.createElement('div');
			card.className = 'clientOrderCard';

			card.innerHTML = `
				<h3>Заказ №${doc.id}</h3>
				<p><strong>Товар:</strong> ${order.product || 'Не указан'}</p>
				<p><strong>Статус:</strong> ${order.status || 'Ожидает'}</p>
				<p><strong>Дата заказа:</strong> ${order.timestamp?.toDate().toLocaleString() || '—'}</p>
			`;
			ordersContainer.appendChild(card);
		});
	} catch (error) {
		console.error('Ошибка загрузки заказов:', error);
		ordersContainer.innerHTML = '<p>Ошибка загрузки заказов.</p>';
	}
}
