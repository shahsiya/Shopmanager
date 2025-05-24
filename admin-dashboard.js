import { auth, db } from './auth.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import {
  collection,
  collectionGroup,
  getDocs,
  doc,
  updateDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";


const container = document.getElementById("ordersAdminContainer");
const logoutBtn = document.getElementById("logoutBtn");

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "login.html";
});

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  if (!user.email.includes("admin")) {
    alert("Доступ запрещён");
    await signOut(auth);
    window.location.href = "login.html";
    return;
  }

  const subSnap = await getDoc(doc(db, "subscriptions", user.email));
  const now = new Date();
  if (!subSnap.exists() || !subSnap.data().active || subSnap.data().expiresAt.toDate() < now) {
    alert("Доступ администратора ограничен. Подписка недействительна.");
    await signOut(auth);
    window.location.href = "subscribe.html";
    return;
  }

  import { collectionGroup } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const snapshot = await getDocs(collectionGroup(db, "orders"));

  container.innerHTML = "";

  snapshot.forEach((docSnap) => {
    const order = docSnap.data();
    const div = document.createElement("div");
    div.className = "adminOrderCard";
    div.innerHTML = `
      <h3>Заказ №${docSnap.id}</h3>
      <p><strong>Email клиента:</strong> ${order.userEmail}</p>
      <p><strong>Товар:</strong> ${order.product}</p>
      <p>
        <strong>Статус:</strong>
        <select data-id="${docSnap.id}">
          <option value="В обработке" ${order.status === "В обработке" ? "selected" : ""}>В обработке</option>
          <option value="Отправлен" ${order.status === "Отправлен" ? "selected" : ""}>Отправлен</option>
          <option value="Доставлен" ${order.status === "Доставлен" ? "selected" : ""}>Доставлен</option>
          <option value="Отменён" ${order.status === "Отменён" ? "selected" : ""}>Отменён</option>
        </select>
      </p>
    `;
    container.appendChild(div);
  });

  container.addEventListener("change", async (e) => {
    if (e.target.tagName === "SELECT") {
      const id = e.target.dataset.id;
      const newStatus = e.target.value;
      try {
        await updateDoc(doc(db, "orders", id), { status: newStatus });
        alert("Статус обновлён.");
      } catch (error) {
        alert("Ошибка при обновлении статуса: " + error.message);
      }
    }
  });
});
