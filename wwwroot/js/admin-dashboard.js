// ── DOM refs ──
const adminNameEl    = document.getElementById('adminName');
const topbarName     = document.getElementById('topbarName');
const topbarAvatar   = document.getElementById('topbarAvatar');
const adminAvatarEl  = document.getElementById('adminAvatar');
const statTotal      = document.getElementById('statTotal');
const statPending    = document.getElementById('statPending');
const statApproved   = document.getElementById('statApproved');
const statRejected   = document.getElementById('statRejected');
const recentAppBody  = document.getElementById('recentAppBody');
const recentLogs     = document.getElementById('recentLogs');
const animalTableBody= document.getElementById('animalTableBody');
const appTableBody   = document.getElementById('appTableBody');
const notifList      = document.getElementById('notifList');
const notifDot       = document.getElementById('notifDot');
const appNotifDot    = document.getElementById('appNotifDot');
const auditLogList   = document.getElementById('auditLogList');

// ── Toast (mirrors dashboard.js pattern) ──
let toastEl = document.createElement('div');
toastEl.className = 'global-toast';
document.body.appendChild(toastEl);
let toastTimer;

function showToast(msg, type = 'success') {
  clearTimeout(toastTimer);
  toastEl.textContent = msg;
  toastEl.className = `global-toast ${type} show`;
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 3000);
}

// ── Sample data (replace with API calls) ──
let animals = [
  { id: 1, name: 'Max',    species: 'Dog', breed: 'Labrador',      age: '3 yrs', gender: 'Male',   status: 'Available', desc: 'Friendly and energetic.' },
  { id: 2, name: 'Luna',   species: 'Cat', breed: 'Siamese',       age: '2 yrs', gender: 'Female', status: 'Available', desc: 'Calm and affectionate.' },
  { id: 3, name: 'Buddy',  species: 'Dog', breed: 'Beagle',        age: '5 yrs', gender: 'Male',   status: 'Adopted',   desc: 'Loves long walks.' },
];

let applications = [
  { id: 1, applicant: 'Maria Santos',  animal: 'Max',  status: 'Submitted', date: '2025-05-01' },
  { id: 2, applicant: 'Juan dela Cruz', animal: 'Luna', status: 'Approved',  date: '2025-04-28' },
  { id: 3, applicant: 'Ana Reyes',     animal: 'Max',  status: 'Rejected',  date: '2025-04-25' },
];

let notifications = [
  { id: 1, icon: '📋', text: 'New application from Maria Santos.', time: '5 mins ago', read: false },
  { id: 2, icon: '✅', text: 'Application #2 approved.',           time: '1 hr ago',   read: true  },
];

let auditLogs = [
  { type: 'green', text: 'Admin approved application #2.',    time: '2025-05-01 10:32 AM' },
  { type: 'red',   text: 'Admin rejected application #3.',    time: '2025-04-28 03:15 PM' },
  { type: 'tan',   text: 'New animal "Max" added.',           time: '2025-04-25 09:00 AM' },
];

// ── Page labels for topbar ──
const pageMeta = {
  overview:     { title: 'Overview',              sub: "Here's what's happening at the shelter today." },
  animals:      { title: '🐾 Animal Management',   sub: 'Add, edit, or remove animals from the shelter.' },
  applications: { title: '📋 Adoption Applications', sub: 'Review and manage adoption applications.' },
  notifications:{ title: '🔔 Notifications',       sub: 'System updates and new application alerts.' },
  auditlog:     { title: '📜 Audit Log',            sub: 'All admin actions are recorded here.' },
};

// ── Init ──
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

  const name = user.name || 'Admin';
  const initial = name.charAt(0).toUpperCase();

  adminNameEl.textContent   = name;
  topbarName.textContent    = name;
  adminAvatarEl.textContent = initial;
  topbarAvatar.textContent  = initial;
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

// ── Navigation ──
function showPage(page, btn) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  document.getElementById(`page-${page}`).classList.add('active');
  if (btn) btn.classList.add('active');

  // Update topbar
  const meta = pageMeta[page] || {};
  document.getElementById('topbarTitle').innerHTML =
    `${meta.title || page}<span>${meta.sub || ''}</span>`;
}

// ── Stats ──
function updateStats() {
  statTotal.textContent    = animals.length;
  statPending.textContent  = applications.filter(a => a.status === 'Submitted').length;
  statApproved.textContent = applications.filter(a => a.status === 'Approved').length;
  statRejected.textContent = applications.filter(a => a.status === 'Rejected').length;
}

// ── Recent Apps (overview) ──
function renderRecentApps() {
  const recent = [...applications].reverse().slice(0, 4);
  if (!recent.length) {
    recentAppBody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--text-light);padding:20px">No applications yet.</td></tr>`;
    return;
  }
  recentAppBody.innerHTML = recent.map(app => `
    <tr>
      <td><b>${app.applicant}</b></td>
      <td>${app.animal}</td>
      <td><span class="badge ${badgeClass(app.status)}">${app.status}</span></td>
      <td>${app.date}</td>
    </tr>
  `).join('');
}

// ── Recent Logs (overview) ──
function renderRecentLogs() {
  const logs = auditLogs.slice(0, 3);
  if (!logs.length) {
    recentLogs.innerHTML = emptyState('📜', 'No activity yet', 'Actions will appear here.');
    return;
  }
  recentLogs.innerHTML = logs.map(logHtml).join('');
}

// ── Animals table ──
function renderAnimals() {
  const q      = (document.getElementById('animalSearch')?.value || '').toLowerCase();
  const status = document.getElementById('animalStatusFilter')?.value || '';
  const species= document.getElementById('animalSpeciesFilter')?.value || '';

  const filtered = animals.filter(a =>
    (!q       || a.name.toLowerCase().includes(q) || a.breed.toLowerCase().includes(q)) &&
    (!status  || a.status  === status) &&
    (!species || a.species === species)
  );

  if (!filtered.length) {
    animalTableBody.innerHTML = `<tr><td colspan="6">${emptyState('🐾', 'No animals found', 'Try adjusting your filters.')}</td></tr>`;
    return;
  }

  animalTableBody.innerHTML = filtered.map(a => `
    <tr>
      <td><b>${a.name}</b></td>
      <td>${a.species}</td>
      <td>${a.breed}</td>
      <td>${a.age}</td>
      <td><span class="badge ${badgeClass(a.status)}">${a.status}</span></td>
      <td>
        <div class="action-group">
          <button class="btn btn-info btn-sm"    onclick="openAnimalModal(${a.id})">Edit</button>
          <button class="btn btn-danger btn-sm"  onclick="confirmDeleteAnimal(${a.id})">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openAnimalModal(id) {
  document.getElementById('animalModalTitle').textContent = id ? 'Edit Animal' : 'Add Animal';
  document.getElementById('aEditId').value = id || '';

  if (id) {
    const a = animals.find(x => x.id === id);
    if (!a) return;
    document.getElementById('aName').value    = a.name;
    document.getElementById('aSpecies').value = a.species;
    document.getElementById('aBreed').value   = a.breed;
    document.getElementById('aAge').value     = a.age;
    document.getElementById('aStatus').value  = a.status;
    document.getElementById('aGender').value  = a.gender;
    document.getElementById('aDesc').value    = a.desc;
  } else {
    ['aName','aBreed','aAge','aDesc'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('aSpecies').value = 'Dog';
    document.getElementById('aStatus').value  = 'Available';
    document.getElementById('aGender').value  = 'Male';
  }

  openModal('animalModal');
}

function saveAnimal() {
  const name = document.getElementById('aName').value.trim();
  if (!name) { showToast('Name is required.', 'error'); return; }

  const id = parseInt(document.getElementById('aEditId').value);

  const data = {
    name,
    species: document.getElementById('aSpecies').value,
    breed:   document.getElementById('aBreed').value.trim(),
    age:     document.getElementById('aAge').value.trim(),
    status:  document.getElementById('aStatus').value,
    gender:  document.getElementById('aGender').value,
    desc:    document.getElementById('aDesc').value.trim(),
  };

  if (id) {
    Object.assign(animals.find(a => a.id === id), data);
    addLog('tan', `Updated animal "${data.name}".`);
    showToast('Animal updated!', 'success');
  } else {
    const newId = Math.max(0, ...animals.map(a => a.id)) + 1;
    animals.push({ id: newId, ...data });
    addLog('tan', `Added new animal "${data.name}".`);
    showToast('Animal added!', 'success');
  }

  closeModal('animalModal');
  refreshDashboard();
}

function confirmDeleteAnimal(id) {
  const a = animals.find(x => x.id === id);
  if (!a) return;
  showConfirm(
    'Remove Animal',
    `Are you sure you want to remove <b>${a.name}</b>? This cannot be undone.`,
    () => deleteAnimal(id)
  );
}

function deleteAnimal(id) {
  const a = animals.find(x => x.id === id);
  animals = animals.filter(x => x.id !== id);
  addLog('red', `Removed animal "${a?.name || '#' + id}".`);
  showToast('Animal removed.', 'success');
  refreshDashboard();
}

// ── Applications table ──
function renderApplications() {
  const q      = (document.getElementById('appSearch')?.value || '').toLowerCase();
  const status = document.getElementById('appStatusFilter')?.value || '';

  const filtered = applications.filter(a =>
    (!q      || a.applicant.toLowerCase().includes(q) || a.animal.toLowerCase().includes(q)) &&
    (!status || a.status === status)
  );

  if (!filtered.length) {
    appTableBody.innerHTML = `<tr><td colspan="5">${emptyState('📋', 'No applications found', 'Try adjusting your filters.')}</td></tr>`;
    return;
  }

  appTableBody.innerHTML = filtered.map(app => `
    <tr>
      <td><b>${app.applicant}</b></td>
      <td>${app.animal}</td>
      <td><span class="badge ${badgeClass(app.status)}">${app.status}</span></td>
      <td>${app.date}</td>
      <td>
        <div class="action-group">
          ${app.status === 'Submitted' ? `
            <button class="btn btn-success btn-sm" onclick="approveApp(${app.id})">Approve</button>
            <button class="btn btn-danger btn-sm"  onclick="rejectApp(${app.id})">Reject</button>
          ` : `<span style="font-size:0.8rem;color:var(--text-light)">${app.status}</span>`}
        </div>
      </td>
    </tr>
  `).join('');
}

function approveApp(id) {
  const app = applications.find(a => a.id === id);
  if (!app) return;
  app.status = 'Approved';
  addLog('green', `Approved application from "${app.applicant}".`);
  addNotification('✅', `Application from ${app.applicant} approved.`);
  showToast('Application approved!', 'success');
  refreshDashboard();
}

function rejectApp(id) {
  const app = applications.find(a => a.id === id);
  if (!app) return;
  app.status = 'Rejected';
  addLog('red', `Rejected application from "${app.applicant}".`);
  addNotification('❌', `Application from ${app.applicant} rejected.`);
  showToast('Application rejected.', 'error');
  refreshDashboard();
}

// ── Notifications ──
function renderNotifications() {
  if (!notifications.length) {
    notifList.innerHTML = emptyState('🔔', 'No notifications', 'You\'re all caught up!');
    return;
  }
  notifList.innerHTML = notifications.map(n => `
    <div class="notif-item ${n.read ? '' : 'unread'}">
      <div class="notif-icon">${n.icon}</div>
      <div style="flex:1">
        <div class="notif-msg">${n.text}</div>
        <div class="notif-time">${n.time}</div>
      </div>
    </div>
  `).join('');
}

function addNotification(icon, text) {
  notifications.unshift({ id: Date.now(), icon, text, time: 'Just now', read: false });
}

function markAllRead() {
  notifications.forEach(n => n.read = true);
  renderNotifications();
  updateNotificationDots();
  showToast('All notifications marked as read.', 'success');
}

function updateNotificationDots() {
  const unread = notifications.filter(n => !n.read).length;
  if (unread > 0) {
    notifDot.textContent = unread;
    notifDot.removeAttribute('hidden');
  } else {
    notifDot.setAttribute('hidden', '');
  }

  const pending = applications.filter(a => a.status === 'Submitted').length;
  if (pending > 0) {
    appNotifDot.textContent = pending;
    appNotifDot.removeAttribute('hidden');
  } else {
    appNotifDot.setAttribute('hidden', '');
  }
}

// ── Audit Log ──
function renderAuditLogs() {
  if (!auditLogs.length) {
    auditLogList.innerHTML = emptyState('📜', 'No logs yet', 'Admin actions will appear here.');
    return;
  }
  auditLogList.innerHTML = auditLogs.map(logHtml).join('');
}

function addLog(type, text) {
  auditLogs.unshift({ type, text, time: new Date().toLocaleString() });
}

function clearLogs() {
  showConfirm('Clear Logs', 'Are you sure you want to clear all audit logs?', () => {
    auditLogs = [];
    renderAuditLogs();
    renderRecentLogs();
    showToast('Audit log cleared.', 'success');
  });
}

// ── Modals ──
function openModal(id) {
  document.getElementById(id).classList.add('open');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

function showConfirm(title, msg, onConfirm) {
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmMsg').innerHTML = msg;
  const btn = document.getElementById('confirmOkBtn');
  btn.onclick = () => { closeModal('confirmModal'); onConfirm(); };
  openModal('confirmModal');
}

// Close modals on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});

// ── Helpers ──
function logHtml(log) {
  return `
    <div class="log-item">
      <div class="log-dot ${log.type}"></div>
      <div>
        <div class="log-text">${log.text}</div>
        <div class="log-time">${log.time}</div>
      </div>
    </div>
  `;
}

function emptyState(icon, title, sub) {
  return `
    <div class="empty-state">
      <div class="empty-icon">${icon}</div>
      <h3>${title}</h3>
      <p>${sub}</p>
    </div>
  `;
}

function badgeClass(status) {
  const map = {
    'Available'          : 'badge-available',
    'Adopted'            : 'badge-adopted',
    'Submitted'          : 'badge-pending',
    'Approved'           : 'badge-approved',
    'Rejected'           : 'badge-rejected',
    'Interview Scheduled': 'badge-interview',
    'Home Check'         : 'badge-homecheck',
  };
  return map[status] || '';
}

function logout() {
  sessionStorage.removeItem('shelterlink_user');
  localStorage.removeItem('shelterlink_user');
  showToast('Signing out…', 'success');
  setTimeout(() => { window.location.href = '/html/login.html'; }, 1000);
}