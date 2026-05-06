// ── DOM refs ──
const adminNameEl     = document.getElementById('adminName');
const topbarName      = document.getElementById('topbarName');
const topbarAvatar    = document.getElementById('topbarAvatar');
const adminAvatarEl   = document.getElementById('adminAvatar');
const statTotal       = document.getElementById('statTotal');
const statPending     = document.getElementById('statPending');
const statApproved    = document.getElementById('statApproved');
const statRejected    = document.getElementById('statRejected');
const recentAppBody   = document.getElementById('recentAppBody');
const recentLogs      = document.getElementById('recentLogs');
const animalTableBody = document.getElementById('animalTableBody');
const appTableBody    = document.getElementById('appTableBody');
const notifList       = document.getElementById('notifList');
const notifDot        = document.getElementById('notifDot');
const appNotifDot     = document.getElementById('appNotifDot');
const auditLogList    = document.getElementById('auditLogList');

// ── API base (same origin — ASP.NET serves both HTML and API) ──
const API = '';

// ── Live data from the backend ──
let animals      = [];
let applications = [];

// ── Notifications & audit log stay in-memory (session only) ──
let notifications = [];
let auditLogs     = [];

// ── Toast ──
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

// ── Page labels for topbar ──
const pageMeta = {
  overview:     { title: 'Overview',                sub: "Here's what's happening at the shelter today." },
  animals:      { title: '🐾 Animal Management',    sub: 'Add, edit, or remove animals from the shelter.' },
  applications: { title: '📋 Adoption Applications', sub: 'Review and manage adoption applications.' },
  notifications:{ title: '🔔 Notifications',        sub: 'System updates and new application alerts.' },
  auditlog:     { title: '📜 Audit Log',             sub: 'All admin actions are recorded here.' },
};

// ── Init ──
window.addEventListener('DOMContentLoaded', () => {
  loadUser();
  loadData();
});

function loadUser() {
  const user =
    JSON.parse(sessionStorage.getItem('shelterlink_user')) ||
    JSON.parse(localStorage.getItem('shelterlink_user')) ||
    null;
  if (!user) return;

  const name    = user.name || 'Admin';
  const initial = name.charAt(0).toUpperCase();

  adminNameEl.textContent   = name;
  topbarName.textContent    = name;
  adminAvatarEl.textContent = initial;
  topbarAvatar.textContent  = initial;
}

// ── Load all data from API then refresh UI ──
async function loadData() {
  try {
    const [animalsRes, appsRes] = await Promise.all([
      fetch(`${API}/api/animal`),
      fetch(`${API}/api/applications`),
    ]);

    animals      = animalsRes.ok      ? await animalsRes.json() : [];
    applications = appsRes.ok         ? await appsRes.json()    : [];
  } catch (e) {
    console.error('Failed to load data:', e);
    showToast('Could not reach the server.', 'error');
  }

  refreshDashboard();
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

  const meta = pageMeta[page] || {};
  document.getElementById('topbarTitle').innerHTML =
    `${meta.title || page}<span id="topbarSub">${meta.sub || ''}</span>`;
}

// ── Stats ──
function updateStats() {
  statTotal.textContent    = animals.length;
  statPending.textContent  = applications.filter(a => a.status === 'Pending').length;
  statApproved.textContent = applications.filter(a => a.status === 'Approved').length;
  statRejected.textContent = applications.filter(a => a.status === 'Rejected').length;
}

// ── Recent Apps (overview) ──
function renderRecentApps() {
  const recent = [...applications].slice(0, 4);
  if (!recent.length) {
    recentAppBody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--text-light);padding:20px">No applications yet.</td></tr>`;
    return;
  }
  recentAppBody.innerHTML = recent.map(app => `
    <tr>
      <td><b>${appApplicantName(app)}</b></td>
      <td>${app.animal?.name || '—'}</td>
      <td><span class="badge ${badgeClass(app.status)}">${app.status}</span></td>
      <td>${formatDate(app.submittedAt)}</td>
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
  const q       = (document.getElementById('animalSearch')?.value || '').toLowerCase();
  const status  = document.getElementById('animalStatusFilter')?.value || '';
  const species = document.getElementById('animalSpeciesFilter')?.value || '';

  const filtered = animals.filter(a =>
    (!q       || a.name.toLowerCase().includes(q) || (a.breed || '').toLowerCase().includes(q)) &&
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
      <td>${a.breed || '—'}</td>
      <td>${a.age}</td>
      <td><span class="badge ${badgeClass(a.status)}">${a.status}</span></td>
      <td>
        <div class="action-group">
          <button class="btn btn-info btn-sm"   onclick="openAnimalModal(${a.animalId})">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="confirmDeleteAnimal(${a.animalId})">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openAnimalModal(id) {
  document.getElementById('animalModalTitle').textContent = id ? 'Edit Animal' : 'Add Animal';
  document.getElementById('aEditId').value = id || '';

  if (id) {
    const a = animals.find(x => x.animalId === id);
    if (!a) return;
    document.getElementById('aName').value    = a.name;
    document.getElementById('aSpecies').value = a.species;
    document.getElementById('aBreed').value   = a.breed || '';
    document.getElementById('aAge').value     = a.age;
    document.getElementById('aStatus').value  = a.status;
    document.getElementById('aGender').value  = a.gender || 'Male';
    document.getElementById('aDesc').value    = a.specialNotes || '';
  } else {
    ['aName', 'aBreed', 'aAge', 'aDesc'].forEach(fid => document.getElementById(fid).value = '');
    document.getElementById('aSpecies').value = 'Dog';
    document.getElementById('aStatus').value  = 'Available';
    document.getElementById('aGender').value  = 'Male';
  }

  openModal('animalModal');
}

async function saveAnimal() {
  const name = document.getElementById('aName').value.trim();
  if (!name) { showToast('Name is required.', 'error'); return; }

  const id = parseInt(document.getElementById('aEditId').value) || 0;

  const data = {
    name,
    species:      document.getElementById('aSpecies').value,
    breed:        document.getElementById('aBreed').value.trim(),
    age:          parseFloat(document.getElementById('aAge').value) || 0,
    status:       document.getElementById('aStatus').value,
    specialNotes: document.getElementById('aDesc').value.trim(),
  };

  const url    = id ? `${API}/api/animal/${id}` : `${API}/api/animal`;
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      showToast(err.message || 'Save failed.', 'error');
      return;
    }

    addLog('tan', id ? `Updated animal "${data.name}".` : `Added new animal "${data.name}".`);
    showToast(id ? 'Animal updated!' : 'Animal added!', 'success');
    closeModal('animalModal');
    await loadData();
  } catch (e) {
    showToast('Could not reach the server.', 'error');
  }
}

function confirmDeleteAnimal(id) {
  const a = animals.find(x => x.animalId === id);
  if (!a) return;
  showConfirm(
    'Remove Animal',
    `Are you sure you want to remove <b>${a.name}</b>? This cannot be undone.`,
    () => deleteAnimal(id)
  );
}

async function deleteAnimal(id) {
  const a = animals.find(x => x.animalId === id);
  try {
    const res = await fetch(`${API}/api/animal/${id}`, { method: 'DELETE' });
    if (!res.ok) { showToast('Delete failed.', 'error'); return; }
    addLog('red', `Removed animal "${a?.name || '#' + id}".`);
    showToast('Animal removed.', 'success');
    await loadData();
  } catch (e) {
    showToast('Could not reach the server.', 'error');
  }
}

// ── Applications table ──
function renderApplications() {
  const q      = (document.getElementById('appSearch')?.value || '').toLowerCase();
  const status = document.getElementById('appStatusFilter')?.value || '';

  const filtered = applications.filter(app => {
    const name   = appApplicantName(app).toLowerCase();
    const animal = (app.animal?.name || '').toLowerCase();
    return (!q || name.includes(q) || animal.includes(q)) &&
           (!status || app.status === status);
  });

  if (!filtered.length) {
    appTableBody.innerHTML = `<tr><td colspan="5">${emptyState('📋', 'No applications found', 'Try adjusting your filters.')}</td></tr>`;
    return;
  }

  appTableBody.innerHTML = filtered.map(app => `
    <tr>
      <td><b>${appApplicantName(app)}</b></td>
      <td>${app.animal?.name || '—'}</td>
      <td><span class="badge ${badgeClass(app.status)}">${app.status}</span></td>
      <td>${formatDate(app.submittedAt)}</td>
      <td>
        <div class="action-group">
          ${app.status === 'Pending' || app.status === 'UnderReview' ? `
            <button class="btn btn-success btn-sm" onclick="approveApp(${app.applicationId})">Approve</button>
            <button class="btn btn-danger btn-sm"  onclick="rejectApp(${app.applicationId})">Reject</button>
          ` : `<span style="font-size:0.8rem;color:var(--text-light)">${app.status}</span>`}
        </div>
      </td>
    </tr>
  `).join('');
}

async function approveApp(id) {
  const app = applications.find(a => a.applicationId === id);
  try {
    const res = await fetch(`${API}/api/applications/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Approved' }),
    });
    if (!res.ok) { showToast('Could not approve application.', 'error'); return; }
    addLog('green', `Approved application from "${appApplicantName(app)}".`);
    addNotification('✅', `Application from ${appApplicantName(app)} approved.`);
    showToast('Application approved!', 'success');
    await loadData();
  } catch (e) {
    showToast('Could not reach the server.', 'error');
  }
}

async function rejectApp(id) {
  const app = applications.find(a => a.applicationId === id);
  try {
    const res = await fetch(`${API}/api/applications/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Rejected' }),
    });
    if (!res.ok) { showToast('Could not reject application.', 'error'); return; }
    addLog('red', `Rejected application from "${appApplicantName(app)}".`);
    addNotification('❌', `Application from ${appApplicantName(app)} rejected.`);
    showToast('Application rejected.', 'error');
    await loadData();
  } catch (e) {
    showToast('Could not reach the server.', 'error');
  }
}

// ── Notifications (in-memory; generated by admin actions) ──
function renderNotifications() {
  if (!notifications.length) {
    notifList.innerHTML = emptyState('🔔', 'No notifications', "You're all caught up!");
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
  updateNotificationDots();
  renderNotifications();
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

  const pending = applications.filter(a => a.status === 'Pending' || a.status === 'UnderReview').length;
  if (pending > 0) {
    appNotifDot.textContent = pending;
    appNotifDot.removeAttribute('hidden');
  } else {
    appNotifDot.setAttribute('hidden', '');
  }
}

// ── Audit Log (in-memory; generated by admin actions this session) ──
function renderAuditLogs() {
  if (!auditLogs.length) {
    auditLogList.innerHTML = emptyState('📜', 'No logs yet', 'Admin actions will appear here.');
    return;
  }
  auditLogList.innerHTML = auditLogs.map(logHtml).join('');
}

function addLog(type, text) {
  auditLogs.unshift({ type, text, time: new Date().toLocaleString() });
  renderAuditLogs();
  renderRecentLogs();
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
function appApplicantName(app) {
  // API returns nested adopter → user → name
  return app.adopter?.user?.name || app.adopter?.user?.email || 'Unknown';
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

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
    'Available'   : 'badge-available',
    'Pending'     : 'badge-pending',
    'Adopted'     : 'badge-adopted',
    'Quarantine'  : 'badge-pending',
    'UnderReview' : 'badge-interview',
    'Approved'    : 'badge-approved',
    'Rejected'    : 'badge-rejected',
    'Completed'   : 'badge-approved',
    'Cancelled'   : 'badge-rejected',
  };
  return map[status] || '';
}

function logout() {
  sessionStorage.removeItem('shelterlink_user');
  localStorage.removeItem('shelterlink_user');
  showToast('Signing out…', 'success');
  setTimeout(() => { window.location.href = '/html/login.html'; }, 1000);
}