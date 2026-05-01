const adminName        = document.getElementById('adminName');
const welcomeName      = document.getElementById('welcomeName');
const adminAvatar      = document.getElementById('adminAvatar');
const statTotal        = document.getElementById('statTotal');
const statPending      = document.getElementById('statPending');
const statApproved     = document.getElementById('statApproved');
const statRejected     = document.getElementById('statRejected');
const recentAppBody    = document.getElementById('recentAppBody');
const recentLogs       = document.getElementById('recentLogs');
const animalTableBody  = document.getElementById('animalTableBody');
const appTableBody     = document.getElementById('appTableBody');
const notifList        = document.getElementById('notifList');
const notifDot         = document.getElementById('notifDot');
const appNotifDot      = document.getElementById('appNotifDot');
const auditLogList     = document.getElementById('auditLogList');
const toast            = document.getElementById('adminToast');

let animals = [
  {
    id: 1,
    name: 'Buddy',
    species: 'Dog',
    breed: 'Labrador',
    age: '3 years',
    status: 'Available',
    gender: 'Male',
    desc: 'Friendly and energetic.'
  },
  {
    id: 2,
    name: 'Luna',
    species: 'Cat',
    breed: 'Siamese',
    age: '2 years',
    status: 'Available',
    gender: 'Female',
    desc: 'Calm and affectionate.'
  },
  {
    id: 3,
    name: 'Max',
    species: 'Dog',
    breed: 'Golden Retriever',
    age: '5 years',
    status: 'Adopted',
    gender: 'Male',
    desc: 'Great with kids.'
  }
];

let applications = [
  {
    id: 1,
    applicant: 'Shinn',
    animal: 'Buddy',
    email: 'sample@gmail.com',
    notes: 'Has a fenced yard.',
    status: 'Submitted',
    date: '2026-04-28'
  },
  {
    id: 2,
    applicant: 'Shaun',
    animal: 'Luna',
    email: 'sample2@gmail.com',
    notes: 'Responsible owner.',
    status: 'Approved',
    date: '2026-04-27'
  }
];

let notifications = [
  {
    id: 1,
    icon: '📋',
    text: 'New application received.',
    time: '2 hours ago',
    read: false
  }
];

let auditLogs = [
  {
    type: 'green',
    text: 'Admin approved application #2',
    time: 'Apr 27, 2026'
  }
];

let animalIdCounter = 4;
let appIdCounter    = 3;

window.addEventListener('DOMContentLoaded', () => {
  loadUser();
  refreshDashboard();
});

function loadUser() {
  const user =
    JSON.parse(sessionStorage.getItem('shelterlink_user')) ||
    JSON.parse(localStorage.getItem('shelterlink_user')) ||
    null;

  if (!user) return;

  adminName.textContent   = user.name;
  welcomeName.textContent = user.name;
  adminAvatar.textContent = user.name.charAt(0).toUpperCase();
}

function refreshDashboard() {
  updateStats();
  renderRecentApps();
  renderRecentLogs();
  renderAnimals();
  renderApplications();
  renderNotifications();
  renderAuditLogs();
  updateNotificationDots();
}

function showPage(page, btn) {
  document.querySelectorAll('.page').forEach(p => {
    p.classList.remove('active');
  });

  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });

  document.getElementById(`page-${page}`).classList.add('active');

  if (btn) btn.classList.add('active');
}

function updateStats() {
  statTotal.textContent =
    animals.length;

  statPending.textContent =
    applications.filter(a => a.status === 'Submitted').length;

  statApproved.textContent =
    applications.filter(a => a.status === 'Approved').length;

  statRejected.textContent =
    applications.filter(a => a.status === 'Rejected').length;
}

function renderRecentApps() {
  const recent = [...applications].reverse().slice(0, 4);

  if (!recent.length) {
    recentAppBody.innerHTML =
      `<tr><td colspan="4">No applications yet.</td></tr>`;
    return;
  }

  recentAppBody.innerHTML = recent.map(app => `
    <tr>
      <td><b>${app.applicant}</b></td>
      <td>${app.animal}</td>
      <td>
        <span class="badge ${badgeClass(app.status)}">
          ${app.status}
        </span>
      </td>
      <td>${app.date}</td>
    </tr>
  `).join('');
}

function renderRecentLogs() {
  const logs = auditLogs.slice(0, 3);

  if (!logs.length) {
    recentLogs.innerHTML = `No activity yet.`;
    return;
  }

  recentLogs.innerHTML = logs.map(log => `
    <div class="log-item">
      <div class="log-dot ${log.type}"></div>
      <div>
        <div class="log-text">${log.text}</div>
        <div class="log-time">${log.time}</div>
      </div>
    </div>
  `).join('');
}

function renderAnimals() {
  if (!animals.length) {
    animalTableBody.innerHTML =
      `<tr><td colspan="6">No animals found.</td></tr>`;
    return;
  }

  animalTableBody.innerHTML = animals.map(animal => `
    <tr>
      <td><b>${animal.name}</b></td>
      <td>${animal.species}</td>
      <td>${animal.breed}</td>
      <td>${animal.age}</td>
      <td>
        <span class="badge ${badgeClass(animal.status)}">
          ${animal.status}
        </span>
      </td>
      <td>
        <button onclick="deleteAnimal(${animal.id})">
          Delete
        </button>
      </td>
    </tr>
  `).join('');
}

function deleteAnimal(id) {
  animals = animals.filter(a => a.id !== id);

  addLog('red', `Animal #${id} removed.`);
  showToast('Animal removed.', 'success');

  refreshDashboard();
}

function renderApplications() {
  if (!applications.length) {
    appTableBody.innerHTML =
      `<tr><td colspan="5">No applications found.</td></tr>`;
    return;
  }

  appTableBody.innerHTML = applications.map(app => `
    <tr>
      <td><b>${app.applicant}</b></td>
      <td>${app.animal}</td>
      <td>
        <span class="badge ${badgeClass(app.status)}">
          ${app.status}
        </span>
      </td>
      <td>${app.date}</td>
      <td>
        <button onclick="approveApp(${app.id})">Approve</button>
        <button onclick="rejectApp(${app.id})">Reject</button>
      </td>
    </tr>
  `).join('');
}

function approveApp(id) {
  const app = applications.find(a => a.id === id);
  if (!app) return;

  app.status = 'Approved';

  addLog('green', `Approved application #${id}`);
  addNotification('✅', `Application approved.`);
  showToast('Application approved!', 'success');

  refreshDashboard();
}

function rejectApp(id) {
  const app = applications.find(a => a.id === id);
  if (!app) return;

  app.status = 'Rejected';

  addLog('red', `Rejected application #${id}`);
  addNotification('❌', `Application rejected.`);
  showToast('Application rejected!', 'error');

  refreshDashboard();
}

function renderNotifications() {
  if (!notifications.length) {
    notifList.innerHTML = `No notifications.`;
    return;
  }

  notifList.innerHTML = notifications.map(n => `
    <div class="notif-item ${n.read ? '' : 'unread'}">
      <div>${n.icon}</div>
      <div>
        <div>${n.text}</div>
        <small>${n.time}</small>
      </div>
    </div>
  `).join('');
}

function addNotification(icon, text) {
  notifications.unshift({
    id: Date.now(),
    icon,
    text,
    time: 'Just now',
    read: false
  });
}

function updateNotificationDots() {
  const unread =
    notifications.filter(n => !n.read).length;

  notifDot.style.display =
    unread ? 'inline-block' : 'none';

  appNotifDot.style.display =
    applications.some(a => a.status === 'Submitted')
      ? 'inline-block'
      : 'none';
}

function renderAuditLogs() {
  if (!auditLogs.length) {
    auditLogList.innerHTML = `No logs available.`;
    return;
  }

  auditLogList.innerHTML = auditLogs.map(log => `
    <div class="log-item">
      <div class="log-dot ${log.type}"></div>
      <div>
        <div>${log.text}</div>
        <small>${log.time}</small>
      </div>
    </div>
  `).join('');
}

function addLog(type, text) {
  auditLogs.unshift({
    type,
    text,
    time: new Date().toLocaleString()
  });
}

let toastTimer;

function showToast(message, type = 'success') {
  toast.textContent = message;
  toast.className   = `toast ${type}`;

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.className = 'toast';
  }, 3000);
}

function badgeClass(status) {
  const map = {
    Available : 'badge-available',
    Adopted   : 'badge-adopted',
    Submitted : 'badge-pending',
    Approved  : 'badge-approved',
    Rejected  : 'badge-rejected'
  };

  return map[status] || '';
}

function logout() {
  sessionStorage.removeItem('shelterlink_user');
  localStorage.removeItem('shelterlink_user');

  showToast('Signing out...', 'success');

  setTimeout(() => {
    window.location.href = '/html/login.html';
  }, 1000);
}