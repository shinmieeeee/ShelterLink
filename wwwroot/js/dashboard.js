const state = {
  user: JSON.parse(sessionStorage.getItem('shelterlink_user') || 'null'),
  currentView: 'home',
  animals: [],
  applications: [],
  notifications: [],
};

// ── DOM refs ──
const viewContainer  = document.getElementById('viewContainer');
const userNameDisplay= document.getElementById('userNameDisplay');
const loadingSpinner = document.getElementById('loadingSpinner');
const modalOverlay   = document.getElementById('modalOverlay');
const modalContent   = document.getElementById('modalContent');
const modalClose     = document.getElementById('modalClose');
const notifBadge     = document.getElementById('notifBadge');
const appBadge       = document.getElementById('appBadge');
const browseFilters  = document.getElementById('browseFilters');
const globalSearch   = document.getElementById('globalSearch');

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

// ── Auth guard ──
function initAuth() {
  // Try sessionStorage first
  if (!state.user) {
    try {
      const s = sessionStorage.getItem('shelterlink_user');
      if (s) state.user = JSON.parse(s);
    } catch(e) {}
  }
  // Try localStorage fallback
  if (!state.user) {
    try {
      const l = localStorage.getItem('shelterlink_user');
      if (l) {
        state.user = JSON.parse(l);
        sessionStorage.setItem('shelterlink_user', l);
      }
    } catch(e) {}
  }
  if (!state.user) {
    window.location.href = 'login.html';
    return false;
  }
  userNameDisplay.textContent = state.user.name || state.user.email || 'User';
  return true;
}

// ── API helpers ──
async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

// ── Navigation ──
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    const view = item.dataset.view;
    navigateTo(view);
  });
});

function navigateTo(view) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelector(`[data-view="${view}"]`)?.classList.add('active');
  state.currentView = view;

  // Show/hide browse filters
  browseFilters.style.display = view === 'browse' ? 'flex' : 'none';

  switch (view) {
    case 'home':          renderHome(); break;
    case 'browse':        renderBrowse(); break;
    case 'applications':  renderApplications(); break;
    case 'notifications': renderNotifications(); break;
    case 'profile':       renderProfile(); break;
  }
}

// ── RENDER: HOME ──
async function renderHome() {
  showLoading();
  try {
    const [animals, apps] = await Promise.all([
      api('/api/animal').catch(() => []),
      api(`/api/applications/user/${state.user.adopterId ?? state.user.userId}`).catch(() => []),
    ]);
    state.animals = animals;
    state.applications = apps;

    const featured = animals.filter(a => a.status === 'Available').slice(0, 6);
    const latestApp = apps[0] || null;

    viewContainer.innerHTML = `
      <h1 class="page-title">Welcome back, ${state.user?.name || 'Friend'}! 👋</h1>
      <p class="page-subtitle">Here's what's happening at ShelterLink today.</p>

      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-icon">🐾</div>
          <div>
            <div class="stat-value">${animals.filter(a=>a.status==='Available').length}</div>
            <div class="stat-label">Available Animals</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📋</div>
          <div>
            <div class="stat-value">${apps.length}</div>
            <div class="stat-label">My Applications</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">✅</div>
          <div>
            <div class="stat-value">${apps.filter(a=>a.status==='Approved'||a.status==='Completed').length}</div>
            <div class="stat-label">Approved</div>
          </div>
        </div>
      </div>

      <div class="section-header">
        <h2 class="section-title">Featured Animals for Adoption</h2>
        <a href="#" class="section-link" data-view-link="browse">View All →</a>
      </div>
      <div class="animals-grid" id="featuredGrid">
        ${featured.length ? featured.map(animalCard).join('') : emptyState('🐾', 'No animals yet', 'Check back soon!')}
      </div>

      ${latestApp ? `
      <div class="section-header">
        <h2 class="section-title">My Latest Application</h2>
        <a href="#" class="section-link" data-view-link="applications">View All →</a>
      </div>
      <div class="applications-list">
        ${applicationCard(latestApp)}
      </div>` : ''}
    `;

    attachCardEvents();
    attachSectionLinks();
  } catch (e) {
    viewContainer.innerHTML = errorState('Could not load dashboard data.');
  }
}

// ── RENDER: BROWSE ──
async function renderBrowse() {
  showLoading();
  try {
    if (!state.animals.length) {
      state.animals = await api('/api/animal').catch(() => []);
    }

    const species = document.getElementById('filterSpecies')?.value || '';
    const age     = document.getElementById('filterAge')?.value || '';
    const search  = globalSearch.value.toLowerCase();

    const filtered = state.animals.filter(a => {
      const matchSpecies = !species || a.species.toLowerCase().includes(species.toLowerCase());
      const matchAge = !age || checkAgeRange(a.age, age);
      const matchSearch = !search || a.name.toLowerCase().includes(search) || a.species.toLowerCase().includes(search);
      return matchSpecies && matchAge && matchSearch;
    });

    viewContainer.innerHTML = `
      <h1 class="page-title">Browse Animals</h1>
      <p class="page-subtitle">${filtered.length} animal${filtered.length !== 1 ? 's' : ''} found</p>
      <div class="animals-grid">
        ${filtered.length ? filtered.map(animalCard).join('') : emptyState('🔍', 'No matches', 'Try adjusting your filters.')}
      </div>
    `;

    attachCardEvents();
  } catch (e) {
    viewContainer.innerHTML = errorState('Could not load animals.');
  }
}

function checkAgeRange(age, range) {
  if (range === 'young')  return age <= 2;
  if (range === 'adult')  return age > 2 && age <= 7;
  if (range === 'senior') return age > 7;
  return true;
}

// ── RENDER: APPLICATIONS ──
async function renderApplications() {
  showLoading();
  try {
    const adopterId = state.user.adopterId ?? state.user.userId;
    state.applications = await api(`/api/applications/user/${adopterId}`).catch(() => []);

    viewContainer.innerHTML = `
      <h1 class="page-title">My Applications</h1>
      <p class="page-subtitle">Track the status of your adoption applications.</p>
      <div class="applications-list">
        ${state.applications.length
          ? state.applications.map(applicationCard).join('')
          : emptyState('📋', 'No applications yet', 'Browse animals and submit an application to get started.')}
      </div>
    `;
  } catch (e) {
    viewContainer.innerHTML = errorState('Could not load applications.');
  }
}

// ── RENDER: NOTIFICATIONS ──
async function renderNotifications() {
  showLoading();
  try {
    if (state.user?.userId) {
      state.notifications = await api(`/api/notifications/${state.user.userId}`).catch(() => []);
    }

    // Mark all read
    if (state.notifications.length) {
      api(`/api/notifications/markread/${state.user.userId}`, { method: 'PUT' }).catch(() => {});
      notifBadge.hidden = true;
    }

    viewContainer.innerHTML = `
      <h1 class="page-title">Notifications</h1>
      <p class="page-subtitle">Stay updated on your applications and shelter news.</p>
      <div class="notif-list">
        ${state.notifications.length
          ? state.notifications.map(n => `
            <div class="notif-item ${n.isRead ? '' : 'unread'}">
              <span class="notif-icon">${n.isRead ? '📩' : '🔔'}</span>
              <span class="notif-msg">${escHtml(n.message)}</span>
              <span class="notif-time">${formatDate(n.sentAt)}</span>
            </div>`).join('')
          : emptyState('🔔', 'No notifications', "You're all caught up!")}
      </div>
    `;
  } catch (e) {
    viewContainer.innerHTML = errorState('Could not load notifications.');
  }
}

// ── RENDER: PROFILE ──
function renderProfile() {
  const u = state.user || {};
  viewContainer.innerHTML = `
    <h1 class="page-title">My Profile</h1>
    <p class="page-subtitle">Update your personal information.</p>
    <div class="profile-card">
      <div class="profile-avatar-area">
        <div class="profile-avatar-big">🐾</div>
        <div class="profile-name-role">
          <div class="name">${escHtml(u.name || 'User')}</div>
          <div class="role">${escHtml(u.role || 'Adopter')}</div>
        </div>
      </div>

      <div class="form-field">
        <label>Full Name</label>
        <input type="text" id="profileName" value="${escHtml(u.name || '')}"/>
      </div>
      <div class="form-field">
        <label>Email</label>
        <input type="email" id="profileEmail" value="${escHtml(u.email || '')}"/>
      </div>
      <div class="form-field">
        <label>New Password</label>
        <input type="password" id="profilePassword" placeholder="Leave blank to keep current" minlength="6"/>
        <small style="color: var(--text-muted, #888); font-size: 0.75rem;">Minimum 6 characters if changing</small>
      </div>

      <button class="btn-save" id="saveProfileBtn">Save Changes</button>
    </div>
  `;

  document.getElementById('saveProfileBtn').addEventListener('click', saveProfile);
}

async function saveProfile() {
  const name     = document.getElementById('profileName').value.trim();
  const email    = document.getElementById('profileEmail').value.trim();
  const password = document.getElementById('profilePassword').value;

  if (!name || !email) { showToast('Name and email are required.', 'error'); return; }
  if (password && password.length < 6) { showToast('Password must be at least 6 characters.', 'error'); return; }

  const payload = { name, email };
  if (password) payload.password = password;

  try {
    const updated = await api(`/api/users/${state.user.userId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    state.user = { ...state.user, ...updated };
    sessionStorage.setItem('shelterlink_user', JSON.stringify(state.user));
    localStorage.setItem('shelterlink_user', JSON.stringify(state.user));
    userNameDisplay.textContent = state.user.name;
    showToast('Profile updated!', 'success');
  } catch {
    showToast('Could not save profile.', 'error');
  }
}

// ── ANIMAL CARD HTML ──
function animalCard(a) {
  const statusClass = (a.status || 'available').toLowerCase().replace(' ', '');
  const emoji = a.species === 'Cat' ? '🐱' : a.species === 'Dog' ? '🐶' : a.species === 'Rabbit' ? '🐰' : '🐾';
  return `
    <div class="animal-card" data-animal-id="${a.animalId}">
      <div class="animal-card-img">
        ${a.photoPath ? `<img src="${escHtml(a.photoPath)}" alt="${escHtml(a.name)}" onerror="this.parentElement.textContent='${emoji}'"/>` : emoji}
      </div>
      <div class="animal-card-body">
        <div class="animal-card-name">${escHtml(a.name)}</div>
        <div class="animal-card-meta">${escHtml(a.species)}${a.breed ? ' · ' + escHtml(a.breed) : ''} · Age: ${a.age}</div>
        <div class="status-badge status-${statusClass}">${a.status || 'Available'}</div>
        <button class="btn-details" data-animal-id="${a.animalId}">View Details</button>
      </div>
    </div>`;
}

// ── APPLICATION CARD HTML ──
function applicationCard(app) {
  const steps = ['Pending', 'UnderReview', 'Approved', 'Completed'];
  const stepLabels = ['Application Submitted', 'Interview Scheduled', 'Home Check', 'Approved'];
  const currentStep = steps.indexOf(app.status);

  return `
    <div class="application-card">
      <div class="app-card-header">
        <div class="app-animal-name">${escHtml(app.animal?.name || 'Animal')} · ${escHtml(app.animal?.species || '')}</div>
        <span class="status-badge status-${(app.status||'pending').toLowerCase()}">${app.status || 'Pending'}</span>
        <div class="app-submitted">Submitted: ${formatDate(app.submittedAt)}</div>
      </div>
      <div class="stepper">
        ${stepLabels.map((label, i) => `
          <div class="step ${i < currentStep ? 'done' : i === currentStep ? 'current' : ''}">
            <div class="step-dot">${i < currentStep ? '✓' : i + 1}</div>
            <div class="step-label">${label}</div>
          </div>`).join('')}
      </div>
    </div>`;
}

// ── ANIMAL DETAIL MODAL ──
function attachCardEvents() {
  document.querySelectorAll('.btn-details').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id = parseInt(btn.dataset.animalId);
      openAnimalModal(id);
    });
  });
}

function openAnimalModal(id) {
  const a = state.animals.find(x => x.animalId === id);
  if (!a) return;

  const emoji = a.species === 'Cat' ? '🐱' : a.species === 'Dog' ? '🐶' : a.species === 'Rabbit' ? '🐰' : '🐾';
  const canApply = a.status === 'Available' && (state.user?.adopterId || state.user?.userId);

  modalContent.innerHTML = `
    <div class="modal-animal-img">
      ${a.photoPath ? `<img src="${escHtml(a.photoPath)}" alt="${escHtml(a.name)}" onerror="this.parentElement.textContent='${emoji}'"/>` : emoji}
    </div>
    <div class="modal-name">${escHtml(a.name)}</div>
    <div class="modal-meta">${escHtml(a.species)} · ${escHtml(a.breed || 'Mixed')} · Age: ${a.age} · <span class="status-badge status-${(a.status||'available').toLowerCase()}">${a.status}</span></div>
    ${a.specialNotes ? `<div class="modal-notes">${escHtml(a.specialNotes)}</div>` : ''}
    <button class="btn-apply" id="applyBtn" ${canApply ? '' : 'disabled'}>
      ${canApply ? '🐾 Apply to Adopt' : a.status !== 'Available' ? 'Not Available' : !state.user ? 'Login to Apply' : 'Profile Incomplete'}
    </button>
  `;

  modalOverlay.hidden = false;

  if (canApply) {
    document.getElementById('applyBtn').addEventListener('click', () => submitApplication(a.animalId));
  }
}

async function submitApplication(animalId) {
  try {
    await api('/api/applications', {
      method: 'POST',
      body: JSON.stringify({ adopterId: state.user.adopterId ?? state.user.userId, animalId }),
    });
    showToast('🐾 Application submitted!', 'success');
    modalOverlay.hidden = true;
    state.applications = []; // force refresh
  } catch {
    showToast('Could not submit application.', 'error');
  }
}

// ── MODAL CLOSE ──
modalClose.addEventListener('click', () => modalOverlay.hidden = true);
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) modalOverlay.hidden = true; });

// ── SECTION LINKS ──
function attachSectionLinks() {
  document.querySelectorAll('[data-view-link]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      navigateTo(el.dataset.viewLink);
    });
  });
}

// ── FILTERS & SEARCH ──
document.getElementById('filterSpecies').addEventListener('input', () => { if (state.currentView === 'browse') renderBrowse(); });
document.getElementById('filterAge').addEventListener('change',     () => { if (state.currentView === 'browse') renderBrowse(); });
globalSearch.addEventListener('input', () => { if (state.currentView === 'browse') renderBrowse(); });

// ── LOGOUT ──
document.getElementById('logoutBtn').addEventListener('click', () => {
  sessionStorage.clear();
  localStorage.removeItem('shelterlink_user');
  window.location.href = 'login.html';
});

// ── HELPERS ──
function showLoading() {
  viewContainer.innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;
}

function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function emptyState(icon, title, msg) {
  return `<div class="empty-state"><div class="empty-icon">${icon}</div><h3>${title}</h3><p>${msg}</p></div>`;
}

function errorState(msg) {
  return `<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Something went wrong</h3><p>${msg}</p></div>`;
}

// ── INIT ──
if (initAuth()) {
  renderHome();
}