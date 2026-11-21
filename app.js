import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, doc,getDoc, addDoc, Timestamp, query, where, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB5kejZTzzMzFYzHAkIKZaNCPh9PhemBmU",
  authDomain: "gym-management-system-607bc.firebaseapp.com",
  projectId: "gym-management-system-607bc",
  storageBucket: "gym-management-system-607bc.firebasestorage.app",
  messagingSenderId: "489923750349",
  appId: "1:489923750349:web:34c2a871479ef9c0d17c84"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function loadPlans() {
  const snapshot = await getDocs(collection(db, "plans"));
  const list = document.getElementById("plans-list");
  list.innerHTML = "";

  snapshot.forEach((planDoc) => {
    const plan = planDoc.data();
    const item = document.createElement("li");
    item.textContent = plan.name + " - " + plan.durationDays + " days - Rs " + plan.price;

    const btn = document.createElement("button");
    btn.textContent = "Delete";
    btn.style.marginLeft = "10px";
    btn.dataset.type = "plans";
    btn.dataset.id = planDoc.id;
    item.appendChild(btn);

    list.appendChild(item);
  });
}

loadPlans();
function getMembershipStatus(endDate) {
  return endDate >= new Date() ? "Active" : "Expired";
}

async function getNameById(collectionName, id) {
  if (!id) return "None";
  const snap = await getDoc(doc(db, collectionName, id));
  return snap.exists() ? snap.data().name : "Not found";
}
async function loadMembers() {
  const snapshot = await getDocs(collection(db, "members"));
  const trainersSnap = await getDocs(collection(db, "trainers"));
  const body = document.getElementById("members-body");
  body.innerHTML = "";

  for (const memberDoc of snapshot.docs) {
    const m = memberDoc.data();
    const planName = await getNameById("plans", m.planId);
    const start = m.startDate.toDate();
    const end = m.endDate.toDate();
    const status = getMembershipStatus(end);

    let options = '<option value="">No trainer</option>';
    trainersSnap.forEach((t) => {
      const selected = t.id === m.trainerId ? "selected" : "";
      options += `<option value="${t.id}" ${selected}>${t.data().name}</option>`;
    });

    const row = document.createElement("tr");
    row.dataset.name = m.name.toLowerCase();   // new
    row.dataset.status = status;               // new
    row.innerHTML = `
      <td>${m.name}</td>
      <td><select data-action="changetrainer" data-id="${memberDoc.id}">${options}</select></td>
      <td>${planName}</td>
      <td>${start.toLocaleDateString()}</td>
      <td>${end.toLocaleDateString()}</td>
      <td>${status}</td>
      <td>
        <button data-action="renew" data-id="${memberDoc.id}">Renew</button>
        <button data-type="members" data-id="${memberDoc.id}">Delete</button>
      </td>
    `;
    body.appendChild(row);
  }

  applyMemberFilter();   // new
}
loadMembers();
async function fillDropdowns() {
  const planSelect = document.getElementById("m-plan");
  const trainerSelect = document.getElementById("m-trainer");

  const plans = await getDocs(collection(db, "plans"));
  plans.forEach((d) => {
    const option = document.createElement("option");
    option.value = d.id;
    option.textContent = d.data().name;
    option.dataset.days = d.data().durationDays;
    planSelect.appendChild(option);
  });

  trainerSelect.innerHTML = '<option value="">No trainer</option>';
  const trainers = await getDocs(collection(db, "trainers"));
  trainers.forEach((d) => {
    const option = document.createElement("option");
    option.value = d.id;
    option.textContent = d.data().name;
    trainerSelect.appendChild(option);
  });
}

document.getElementById("member-form").addEventListener("submit", async (event) => {
  event.preventDefault();

  const planSelect = document.getElementById("m-plan");
  const trainerId = document.getElementById("m-trainer").value;
  const days = Number(planSelect.selectedOptions[0].dataset.days);

  const start = new Date(document.getElementById("m-start").value);
  const end = new Date(start);
  end.setDate(end.getDate() + days);

  await addDoc(collection(db, "members"), {
    name: document.getElementById("m-name").value,
    phone: document.getElementById("m-phone").value,
    email: document.getElementById("m-email").value,
    trainerId: trainerId === "" ? null : trainerId,
    planId: planSelect.value,
    startDate: Timestamp.fromDate(start),
    endDate: Timestamp.fromDate(end)
  });

  event.target.reset();
  loadMembers();
});

fillDropdowns();
function getPaymentStatus(payment) {
  if (payment.status === "Paid") return "Paid";
  return payment.dueDate.toDate() < new Date() ? "Overdue" : "Pending";
}

async function loadPayments() {
  const snapshot = await getDocs(collection(db, "payments"));
  const body = document.getElementById("payments-body");
  body.innerHTML = "";

  for (const payDoc of snapshot.docs) {
    const p = payDoc.data();
    const memberName = await getNameById("members", p.memberId);
    const planName = await getNameById("plans", p.planId);
    const paidOn = p.paymentDate ? p.paymentDate.toDate().toLocaleDateString() : "-";

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${memberName}</td>
      <td>${planName}</td>
      <td>Rs ${p.amount}</td>
      <td>${p.dueDate.toDate().toLocaleDateString()}</td>
      <td>${paidOn}</td>
      <td>${getPaymentStatus(p)}</td>
      <td>
        ${p.status !== "Paid" ? `<button data-action="markpaid" data-id="${payDoc.id}">Mark Paid</button>` : ""}
        <button data-type="payments" data-id="${payDoc.id}">Delete</button>
      </td>    `;
    body.appendChild(row);
  }
}

function updateAmount() {
  const planSelect = document.getElementById("p-plan");
  const selected = planSelect.selectedOptions[0];
  if (selected) {
    document.getElementById("p-amount").value = selected.dataset.price;
  }
}

async function fillPaymentDropdowns() {
  const memberSelect = document.getElementById("p-member");
  const planSelect = document.getElementById("p-plan");

  const members = await getDocs(collection(db, "members"));
  members.forEach((d) => {
    const option = document.createElement("option");
    option.value = d.id;
    option.textContent = d.data().name;
    memberSelect.appendChild(option);
  });

  const plans = await getDocs(collection(db, "plans"));
  plans.forEach((d) => {
    const option = document.createElement("option");
    option.value = d.id;
    option.textContent = d.data().name;
    option.dataset.price = d.data().price;
    planSelect.appendChild(option);
  });

  planSelect.addEventListener("change", updateAmount);
  updateAmount();
}

document.getElementById("payment-form").addEventListener("submit", async (event) => {
  event.preventDefault();

  const status = document.getElementById("p-status").value;
  const dateValue = document.getElementById("p-date").value;

  let paymentDate = null;
  if (status === "Paid") {
    paymentDate = Timestamp.fromDate(dateValue ? new Date(dateValue) : new Date());
  }

  await addDoc(collection(db, "payments"), {
    memberId: document.getElementById("p-member").value,
    planId: document.getElementById("p-plan").value,
    amount: Number(document.getElementById("p-amount").value),
    dueDate: Timestamp.fromDate(new Date(document.getElementById("p-due").value)),
    paymentDate: paymentDate,
    status: status
  });

  event.target.reset();
  updateAmount();
  loadPayments();
});

loadPayments();
fillPaymentDropdowns();
async function loadTrainers() {
  const snapshot = await getDocs(collection(db, "trainers"));
  const body = document.getElementById("trainers-body");
  body.innerHTML = "";

  for (const trainerDoc of snapshot.docs) {
    const t = trainerDoc.data();

    const q = query(collection(db, "members"), where("trainerId", "==", trainerDoc.id));
    const assigned = await getDocs(q);
    const names = assigned.docs.map((d) => d.data().name);

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${t.name}</td>
      <td>${t.specialization}</td>
      <td>${t.phone}</td>
      <td>${names.length > 0 ? names.join(", ") : "No members yet"}</td>
      <td><button data-type="trainers" data-id="${trainerDoc.id}">Delete</button></td>
    `;
    body.appendChild(row);
  }
}

loadTrainers();
document.getElementById("trainer-form").addEventListener("submit", async (event) => {
  event.preventDefault();

  await addDoc(collection(db, "trainers"), {
    name: document.getElementById("t-name").value,
    phone: document.getElementById("t-phone").value,
    email: document.getElementById("t-email").value,
    specialization: document.getElementById("t-spec").value
  });

  event.target.reset();
  loadTrainers();
});

document.getElementById("plan-form").addEventListener("submit", async (event) => {
  event.preventDefault();

  await addDoc(collection(db, "plans"), {
    name: document.getElementById("pl-name").value,
    durationDays: Number(document.getElementById("pl-days").value),
    price: Number(document.getElementById("pl-price").value)
  });

  event.target.reset();
  loadPlans();
});
document.addEventListener("click", async (event) => {
  const btn = event.target;
  if (btn.tagName !== "BUTTON" || !btn.dataset.type) return;

  const type = btn.dataset.type;
  const id = btn.dataset.id;

  if (!confirm("Delete this record? This cannot be undone.")) return;

  if (type === "plans") {
    const usedByMembers = await getDocs(query(collection(db, "members"), where("planId", "==", id)));
    const usedByPayments = await getDocs(query(collection(db, "payments"), where("planId", "==", id)));
    if (!usedByMembers.empty || !usedByPayments.empty) {
      alert("Cannot delete: members or payments still use this plan.");
      return;
    }
  }

  if (type === "trainers") {
    const assigned = await getDocs(query(collection(db, "members"), where("trainerId", "==", id)));
    for (const m of assigned.docs) {
      await updateDoc(doc(db, "members", m.id), { trainerId: null });
    }
  }

  if (type === "members") {
    const payments = await getDocs(query(collection(db, "payments"), where("memberId", "==", id)));
    for (const p of payments.docs) {
      await deleteDoc(doc(db, "payments", p.id));
    }
  }

  await deleteDoc(doc(db, type, id));

  loadMembers();
  loadPayments();
  loadTrainers();
  loadPlans();
});
document.addEventListener("click", async (event) => {
  const btn = event.target;
  if (btn.dataset.action !== "markpaid") return;

  await updateDoc(doc(db, "payments", btn.dataset.id), {
    status: "Paid",
    paymentDate: Timestamp.fromDate(new Date())
  });

  loadPayments();
});
document.addEventListener("change", async (event) => {
  const select = event.target;
  if (select.dataset.action !== "changetrainer") return;

  await updateDoc(doc(db, "members", select.dataset.id), {
    trainerId: select.value === "" ? null : select.value
  });

  loadTrainers();
});
document.addEventListener("click", async (event) => {
  const btn = event.target;
  if (btn.dataset.action !== "renew") return;

  const memberRef = doc(db, "members", btn.dataset.id);
  const memberSnap = await getDoc(memberRef);
  const m = memberSnap.data();

  const planSnap = await getDoc(doc(db, "plans", m.planId));
  if (!planSnap.exists()) {
    alert("Cannot renew: this member's plan no longer exists.");
    return;
  }
  const plan = planSnap.data();

  if (!confirm("Renew " + m.name + " on the " + plan.name + " plan?")) return;

  const today = new Date();
  const currentEnd = m.endDate.toDate();
  const start = currentEnd > today ? currentEnd : today;
  const end = new Date(start);
  end.setDate(end.getDate() + plan.durationDays);

  const due = new Date();
  due.setDate(due.getDate() + 7);

  await updateDoc(memberRef, {
    startDate: Timestamp.fromDate(start),
    endDate: Timestamp.fromDate(end)
  });

  await addDoc(collection(db, "payments"), {
    memberId: btn.dataset.id,
    planId: m.planId,
    amount: plan.price,
    dueDate: Timestamp.fromDate(due),
    paymentDate: null,
    status: "Pending"
  });

  loadMembers();
  loadPayments();
});
function applyMemberFilter() {
  const text = document.getElementById("member-search").value.toLowerCase();
  const status = document.getElementById("member-filter").value;

  document.querySelectorAll("#members-body tr").forEach((row) => {
    const nameMatches = row.dataset.name.includes(text);
    const statusMatches = status === "all" || row.dataset.status === status;
    row.style.display = nameMatches && statusMatches ? "" : "none";
  });
}

document.getElementById("member-search").addEventListener("input", applyMemberFilter);
document.getElementById("member-filter").addEventListener("change", applyMemberFilter);