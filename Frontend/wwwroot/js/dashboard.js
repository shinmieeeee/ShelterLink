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
  if (!state.user) {
    try { const s = sessionStorage.getItem('shelterlink_user'); if (s) state.user = JSON.parse(s); } catch(e) {}
  }
  if (!state.user) {
    try {
      const l = localStorage.getItem('shelterlink_user');
      if (l) { state.user = JSON.parse(l); sessionStorage.setItem('shelterlink_user', l); }
    } catch(e) {}
  }
  if (!state.user) { window.location.href = 'login.html'; return false; }
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
    navigateTo(item.dataset.view);
  });
});

function navigateTo(view) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelector(`[data-view="${view}"]`)?.classList.add('active');
  state.currentView = view;
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
      <div class="applications-list">${applicationCard(latestApp)}</div>` : ''}
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
    if (!state.animals.length) state.animals = await api('/api/animal').catch(() => []);
    const species = document.getElementById('filterSpecies')?.value || '';
    const age     = document.getElementById('filterAge')?.value || '';
    const search  = globalSearch.value.toLowerCase();
    const filtered = state.animals.filter(a => {
      const matchSpecies = !species || a.species.toLowerCase().includes(species.toLowerCase());
      const matchAge     = !age    || checkAgeRange(a.age, age);
      const matchSearch  = !search || a.name.toLowerCase().includes(search) || a.species.toLowerCase().includes(search);
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
      <div class="applications-list">
        ${state.applications.length
          ? state.applications.map(applicationCard).join('')
          : emptyState('📋', 'No applications yet', 'Browse animals and submit an application to get started.')}
      </div>
    `;
    attachInterviewActions();
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
    if (state.notifications.length) {
      api(`/api/notifications/markread/${state.user.userId}`, { method: 'PUT' }).catch(() => {});
      notifBadge.hidden = true;
    }

    viewContainer.innerHTML = `
      <h1 class="page-title">Notifications</h1>
      <div class="notif-list">
        ${state.notifications.length
          ? state.notifications.map(n => {
              const parsed = parseNotificationMsg(n.message);
              return `
                <div class="notif-item ${n.isRead ? '' : 'unread'}">
                  <span class="notif-icon">${parsed.icon}</span>
                  <div style="flex:1">
                    <span class="notif-msg">${parsed.html}</span>
                    <div class="notif-time">${formatDate(n.sentAt)}</div>
                  </div>
                </div>`;
            }).join('')
          : emptyState('🔔', 'No notifications', "You're all caught up!")}
      </div>
    `;
  } catch (e) {
    viewContainer.innerHTML = errorState('Could not load notifications.');
  }
}

function parseNotificationMsg(msg) {
  if (!msg) return { icon: '🔔', html: escHtml(msg) };
  if (msg.startsWith('APPROVED:')) {
    const animal = msg.slice(9);
    return {
      icon: '🎉',
      html: `<strong style="color:#22c55e">Application Approved!</strong><br>
             Congratulations! Your adoption application for <strong>${escHtml(animal)}</strong> has been approved!
             Our team will contact you soon to finalize the adoption process. 🐾`
    };
  }
  if (msg.startsWith('REJECTED:')) {
    const parts  = msg.slice(9).split(':');
    const animal = parts[0];
    const reason = parts.slice(1).join(':');
    return {
      icon: '😞',
      html: `<strong style="color:#ef4444">Application Not Approved</strong><br>
             We're sorry — your adoption application for <strong>${escHtml(animal)}</strong> was not approved at this time.<br>
             <em>${escHtml(reason)}</em>`
    };
  }
  if (msg.startsWith('INTERVIEW_SCHEDULED:')) {
    const parts  = msg.slice(20).split(':');
    const animal = parts[0];
    const dt     = new Date(parts[1] + ':' + parts[2]);
    return {
      icon: '📅',
      html: `<strong>Interview Scheduled</strong><br>
             Your interview for the adoption of <strong>${escHtml(animal)}</strong> has been scheduled for
             <strong>${dt.toLocaleString('en-US', {month:'long',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'})}</strong>.
             Go to <em>My Applications</em> to confirm your availability.`
    };
  }
  return { icon: '🔔', html: escHtml(msg) };
}

// ── RENDER: PROFILE ──
function renderProfile() {
  const u = state.user || {};
  viewContainer.innerHTML = `
    <h1 class="page-title">My Profile</h1>
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
        <div style="position:relative;display:flex;align-items:center;">
          <input type="password" id="profilePassword" placeholder="Leave blank to keep current" minlength="6" style="width:100%;padding-right:2.5rem;"/>
          <button type="button" id="togglePasswordBtn" aria-label="Toggle password visibility"
            style="position:absolute;right:0.6rem;background:none;border:none;cursor:pointer;font-size:1.1rem;padding:0;line-height:1;color:var(--text-muted,#888);">
            👁️
          </button>
        </div>
        <small style="color:var(--text-muted,#888);font-size:0.75rem;">Minimum 6 characters if changing</small>
      </div>
      <button class="btn-save" id="saveProfileBtn">Save Changes</button>
    </div>
  `;
  document.getElementById('saveProfileBtn').addEventListener('click', saveProfile);
  document.getElementById('togglePasswordBtn').addEventListener('click', () => {
    const input = document.getElementById('profilePassword');
    const btn   = document.getElementById('togglePasswordBtn');
    input.type  = input.type === 'password' ? 'text' : 'password';
    btn.textContent = input.type === 'password' ? '👁️' : '🙈';
  });
}

async function saveProfile() {
  const name     = document.getElementById('profileName').value.trim();
  const email    = document.getElementById('profileEmail').value.trim();
  const password = document.getElementById('profilePassword').value;
  if (!name || !email) { showToast('Name and email are required.', 'error'); return; }
  if (password && password.length < 6) { showToast('Password must be at least 6 characters.', 'error'); return; }
  try {
    const userId = state.user.userId;
    await api(`/api/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ name, email, password: password || null }),
    });
    state.user.name  = name;
    state.user.email = email;
    sessionStorage.setItem('shelterlink_user', JSON.stringify(state.user));
    localStorage.setItem('shelterlink_user',   JSON.stringify(state.user));
    userNameDisplay.textContent = name;
    showToast('Profile updated!', 'success');
  } catch {
    showToast('Could not save profile.', 'error');
  }
}

// ── ANIMAL CARD ──
function animalCard(a) {
  const emoji = a.species === 'Cat' ? '🐱' : a.species === 'Dog' ? '🐶' : a.species === 'Rabbit' ? '🐰' : '🐾';
  const statusClass = (a.status || 'available').toLowerCase();
  return `
    <div class="animal-card">
      <div class="animal-card-img">
        ${a.photoPath ? `<img src="${escHtml(a.photoPath)}" alt="${escHtml(a.name)}" onerror="this.parentElement.textContent='${emoji}'"/>` : emoji}
      </div>
      <div class="animal-card-body">
        <div class="animal-card-name">${escHtml(a.name)}</div>
        <div class="animal-card-meta">${escHtml(a.species)}${a.breed ? ' · ' + escHtml(a.breed) : ''} · Age: ${a.age < 1 ? Math.round(a.age * 12) + ' mo' : a.age + ' yr/old'}</div>        <div class="status-badge status-${statusClass}">${a.status || 'Available'}</div>
        <button class="btn-details" data-animal-id="${a.animalId}">View Details</button>
      </div>
    </div>`;
}

// ── APPLICATION CARD HTML ──
function applicationCard(app) {
  const steps      = ['Pending', 'UnderReview', 'Approved'];
  const stepLabels = ['Application Submitted', 'Interview Scheduled', 'Decision'];
  const stepIcons  = ['📋', '📅', '✅'];
  const currentStep = app.status === 'Rejected' ? 2 :
                      app.status === 'Approved'  ? 2 :
                      app.status === 'UnderReview' ? 1 : 0;
  // For rejected apps that had an interview scheduled, mark interview step as done
  const interviewWasDone = app.interviewScheduledAt != null;
  const isRejected  = app.status === 'Rejected';
  const isApproved  = app.status === 'Approved';

  // Interview confirmation block
  let interviewBlock = '';
  if (app.status === 'UnderReview' && app.interviewScheduledAt) {
    const dt = new Date(app.interviewScheduledAt);
    const dtStr = dt.toLocaleString('en-US', {weekday:'long',month:'long',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'});
    if (app.adopterConfirmed === true) {
      interviewBlock = `
        <div class="interview-block confirmed">
          <span class="interview-icon">✅</span>
          <div>
            <strong>Interview Confirmed</strong>
            <div>${dtStr}</div>
          </div>
        </div>`;
    } else {
      interviewBlock = `
        <div class="interview-block pending-confirm">
          <span class="interview-icon">📅</span>
          <div style="flex:1">
            <strong>Interview Scheduled</strong>
            <div style="margin-top:0.25rem;font-size:0.9rem;color:#374151">${dtStr}</div>
            <div style="margin-top:0.75rem">
              <button class="btn-confirm-interview" data-app-id="${app.applicationId}">
                I'm Available
              </button>
            </div>
          </div>
        </div>`;
    }
  }

  // Decision message block
  let decisionBlock = '';
  if (isApproved) {
    decisionBlock = `
      <div class="decision-block approved">
        <div class="decision-icon">🎉</div>
        <div>
          <strong>Application Approved!</strong>
          <p>Congratulations! Your adoption application for <strong>${escHtml(app.animal?.name || 'this animal')}</strong> has been approved.
          Our team will contact you soon to finalize the adoption process.</p>
        </div>
      </div>`;
  } else if (isRejected) {
    decisionBlock = `
      <div class="decision-block rejected">
        <div class="decision-icon">😞</div>
        <div>
          <strong>Application Not Approved</strong>
          <p>We're sorry — your application for <strong>${escHtml(app.animal?.name || 'this animal')}</strong> was not approved at this time.
          ${app.rejectionReason ? `<br><br><strong>Reason:</strong> <em>${escHtml(app.rejectionReason)}</em>` : ''}
          <br>Please feel free to browse other animals and apply again.</p>
        </div>
      </div>`;
  }

  return `
    <div class="application-card">
      <div class="app-card-header">
        <div class="app-animal-name">${escHtml(app.animal?.name || 'Animal')} · ${escHtml(app.animal?.species || '')}</div>
        <span class="status-badge status-${(app.status||'pending').toLowerCase()}">${app.status || 'Pending'}</span>
        <div class="app-submitted">Submitted: ${formatDate(app.submittedAt)}</div>
      </div>
      <div class="stepper">
      ${stepLabels.map((label, i) => {
          const isDone = isRejected
            ? (i === 0 || (i === 1 && interviewWasDone))
            : i < currentStep;
          const isCurrent = !isRejected && i === currentStep;
          const isDecision = i === 2;
          return `
          <div class="step ${isRejected && isDecision ? 'rejected-step' : isDone ? 'done' : isCurrent ? 'current' : ''}">
            <div class="step-dot">${isRejected && isDecision ? '✗' : isDone ? '✓' : stepIcons[i]}</div>
            <div class="step-label">${label}</div>
          </div>`;
        }).join('')}
      </div>
      ${interviewBlock}
      ${decisionBlock}
    </div>`;
}

// ── Attach interview confirm/reschedule buttons ──
function attachInterviewActions() {
  document.querySelectorAll('.btn-confirm-interview').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = parseInt(btn.dataset.appId);
      try {
        await api(`/api/applications/${id}/confirm`, { method: 'PUT', body: JSON.stringify({ confirmed: true }) });
        showToast('Interview confirmed! ✅', 'success');
        renderApplications();
      } catch { showToast('Could not confirm interview.', 'error'); }
    });
  });
}

// ── ANIMAL DETAIL MODAL ──
function attachCardEvents() {
  document.querySelectorAll('.btn-details').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      openAnimalModal(parseInt(btn.dataset.animalId));
    });
  });
}

function openAnimalModal(id) {
  const a = state.animals.find(x => x.animalId === id);
  if (!a) return;
  const emoji    = a.species === 'Cat' ? '🐱' : a.species === 'Dog' ? '🐶' : a.species === 'Rabbit' ? '🐰' : '🐾';
  const canApply = a.status === 'Available' && (state.user?.adopterId || state.user?.userId);

  modalContent.innerHTML = `
    <div class="modal-animal-img">
      ${a.photoPath ? `<img src="${escHtml(a.photoPath)}" alt="${escHtml(a.name)}" onerror="this.parentElement.textContent='${emoji}'"/>` : emoji}
    </div>
    <div class="modal-name">${escHtml(a.name)}</div>
    <div class="modal-meta">${escHtml(a.species)} · ${escHtml(a.breed || 'Mixed')} · Age: ${a.age < 1 ? Math.round(a.age * 12) + ' mo' : a.age + ' yr/old'} · <span class="status-badge status-${(a.status||'available').toLowerCase()}">${a.status}</span></div>
    ${a.specialNotes ? `<div class="modal-notes">${escHtml(a.specialNotes)}</div>` : ''}
    <button class="btn-apply" id="applyBtn" ${canApply ? '' : 'disabled'}>
      ${canApply ? '🐾 Apply to Adopt' : a.status !== 'Available' ? 'Not Available' : !state.user ? 'Login to Apply' : 'Profile Incomplete'}
    </button>
  `;
  modalOverlay.hidden = false;
  if (canApply) {
    document.getElementById('applyBtn').addEventListener('click', () => openAdoptionForm(a));
  }
}

// ── ADOPTION APPLICATION FORM (paper-style) ──
function openAdoptionForm(animal) {
  modalOverlay.hidden = true;

  // Create a dedicated full-screen overlay for the form
  const formOverlay = document.createElement('div');
  formOverlay.id = 'adoptionFormOverlay';
  formOverlay.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9999;
    overflow-y:auto;display:flex;justify-content:center;align-items:flex-start;padding:2rem 1rem;
  `;

  const emoji = animal.species === 'Cat' ? '🐱' : animal.species === 'Dog' ? '🐶' : animal.species === 'Rabbit' ? '🐰' : '🐾';

  formOverlay.innerHTML = `
    <div style="
      background:#fff;max-width:700px;width:100%;border-radius:16px;
      box-shadow:0 20px 60px rgba(0,0,0,0.3);font-family:inherit;
    ">
      <!-- Header -->
      <div style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff;padding:2rem;border-radius:16px 16px 0 0;">
        <div style="display:flex;align-items:center;gap:1rem;">
          <div style="font-size:3rem">${emoji}</div>
          <div>
            <h2 style="margin:0;font-size:1.5rem;font-weight:700">Adoption Application</h2>
            <p style="margin:0.25rem 0 0;opacity:0.9">Applying to adopt <strong>${escHtml(animal.name)}</strong> · ${escHtml(animal.species)}</p>
          </div>
        </div>
        <div style="margin-top:1rem;padding:0.75rem;background:rgba(255,255,255,0.15);border-radius:8px;font-size:0.85rem;">
          📋 Please fill out this application completely and honestly. All information will be reviewed by our shelter team.
        </div>
      </div>

      <div style="padding:2rem;">
        <!-- Section 1: Personal Info -->
        <div class="form-section">
          <h3 class="form-section-title">👤 Personal Information</h3>
          <div class="form-row">
            <div class="form-field">
              <label>Full Name <span class="required">*</span></label>
              <input type="text" id="af_fullName" placeholder="Your full name" required/>
            </div>
            <div class="form-field">
              <label>Phone Number <span class="required">*</span></label>
              <input type="tel" id="af_phone" placeholder="+63 xxx xxx xxxx"/>
            </div>
          </div>
          <div class="form-field">
            <label>Complete Address <span class="required">*</span></label>
            <input type="text" id="af_address" placeholder="Street, City, Province, ZIP"/>
          </div>
        </div>

        <!-- Section 2: Living Situation -->
        <div class="form-section">
          <h3 class="form-section-title">🏠 Living Situation</h3>
          <div class="form-row">
            <div class="form-field">
              <label>Housing Type <span class="required">*</span></label>
              <select id="af_housing">
                <option value="">— Select —</option>
                <option value="Own House">Own House</option>
                <option value="Renting House">Renting House</option>
                <option value="Own Condo/Apartment">Own Condo/Apartment</option>
                <option value="Renting Condo/Apartment">Renting Condo/Apartment</option>
                <option value="Living with family">Living with family</option>
              </select>
            </div>
            <div class="form-field">
              <label>Do you have a yard?</label>
              <div class="radio-group">
                <label><input type="radio" name="af_yard" value="yes"/> Yes</label>
                <label><input type="radio" name="af_yard" value="no"/> No</label>
              </div>
            </div>
          </div>
        </div>

        <!-- Section 3: Household -->
        <div class="form-section">
          <h3 class="form-section-title">👨‍👩‍👧 Household Members</h3>
          <div class="form-row">
            <div class="form-field">
              <label>Do you have other pets?</label>
              <div class="radio-group">
                <label><input type="radio" name="af_pets" value="yes" id="af_petsYes"/> Yes</label>
                <label><input type="radio" name="af_pets" value="no"/> No</label>
              </div>
            </div>
            <div class="form-field">
              <label>Do you have children at home?</label>
              <div class="radio-group">
                <label><input type="radio" name="af_children" value="yes" id="af_childrenYes"/> Yes</label>
                <label><input type="radio" name="af_children" value="no"/> No</label>
              </div>
            </div>
          </div>
          <div class="form-field" id="af_petsDetailsField" style="display:none">
            <label>Describe your other pets (species, age, temperament)</label>
            <textarea id="af_petsDetails" rows="2" placeholder="e.g. 1 cat, 3 years old, very calm..."></textarea>
          </div>
          <div class="form-field" id="af_childrenAgesField" style="display:none">
            <label>Ages of children in the household</label>
            <input type="text" id="af_childrenAges" placeholder="e.g. 5, 8, 12"/>
          </div>
        </div>

        <!-- Section 4: About You as an Owner -->
        <div class="form-section">
          <h3 class="form-section-title">💬 About You as a Pet Owner</h3>
          <div class="form-field">
            <label>Why do you want to adopt ${escHtml(animal.name)}? <span class="required">*</span></label>
            <textarea id="af_reason" rows="3" placeholder="Tell us why you'd like to adopt this animal and what makes you a good match..."></textarea>
          </div>
          <div class="form-field">
            <label>Describe your daily routine and how the pet will fit in <span class="required">*</span></label>
            <textarea id="af_routine" rows="3" placeholder="Work schedule, activity level, who else will care for the pet..."></textarea>
          </div>
          <div class="form-field">
            <label>Veterinarian Reference (if you've had pets before)</label>
            <input type="text" id="af_vet" placeholder="Vet clinic name and contact (optional)"/>
          </div>
        </div>

        <!-- Terms -->
        <div class="form-section" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:1.25rem;">
          <h3 class="form-section-title" style="color:#166534;">📜 Terms & Commitment</h3>
          <ul style="color:#166534;font-size:0.9rem;line-height:1.8;margin:0 0 1rem 1.2rem;">
            <li>I commit to providing proper food, shelter, veterinary care, and love for this animal.</li>
            <li>I understand the shelter may conduct an interview before finalizing the adoption.</li>
            <li>I agree to inform the shelter if I can no longer care for the animal.</li>
            <li>I understand that providing false information may result in application rejection.</li>
          </ul>
          <label style="display:flex;align-items:center;gap:0.75rem;cursor:pointer;font-weight:600;color:#166534;">
            <input type="checkbox" id="af_agree" style="width:1.2rem;height:1.2rem;accent-color:#16a34a;"/>
            I have read and agree to the terms above <span class="required">*</span>
          </label>
        </div>

        <!-- Buttons -->
        <div style="display:flex;gap:1rem;margin-top:1.5rem;justify-content:flex-end;flex-wrap:wrap;">
          <button id="af_cancelBtn" style="
            padding:0.75rem 1.5rem;border-radius:8px;border:1.5px solid #d1d5db;
            background:#fff;cursor:pointer;font-size:1rem;font-weight:500;color:#374151;
          ">Cancel</button>
          <button id="af_submitBtn" style="
            padding:0.75rem 2rem;border-radius:8px;border:none;
            background:linear-gradient(135deg,#3b82f6,#8b5cf6);
            color:#fff;cursor:pointer;font-size:1rem;font-weight:600;
            box-shadow:0 4px 12px rgba(59,130,246,0.4);
          ">🐾 Submit Application</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(formOverlay);

  // Pre-fill known user data
  const u = state.user || {};
  if (u.name)  document.getElementById('af_fullName').value = u.name;

  // Add form-section styles if not present
  injectFormStyles();

  // Toggle conditional fields
  document.getElementById('af_petsYes').addEventListener('change', () => {
    document.getElementById('af_petsDetailsField').style.display = 'block';
  });
  document.querySelectorAll('input[name="af_pets"]').forEach(r => {
    if (r.value === 'no') r.addEventListener('change', () => {
      document.getElementById('af_petsDetailsField').style.display = 'none';
    });
  });
  document.getElementById('af_childrenYes').addEventListener('change', () => {
    document.getElementById('af_childrenAgesField').style.display = 'block';
  });
  document.querySelectorAll('input[name="af_children"]').forEach(r => {
    if (r.value === 'no') r.addEventListener('change', () => {
      document.getElementById('af_childrenAgesField').style.display = 'none';
    });
  });

  document.getElementById('af_cancelBtn').addEventListener('click', () => {
    document.body.removeChild(formOverlay);
  });

  document.getElementById('af_submitBtn').addEventListener('click', () => {
    submitAdoptionForm(animal, formOverlay);
  });
}

function injectFormStyles() {
  if (document.getElementById('adoptionFormStyles')) return;
  const style = document.createElement('style');
  style.id = 'adoptionFormStyles';
  style.textContent = `
    .form-section { margin-bottom:1.5rem; }
    .form-section-title { font-size:1rem;font-weight:700;margin:0 0 1rem;color:#374151;display:flex;align-items:center;gap:0.4rem; }
    .form-row { display:grid;grid-template-columns:1fr 1fr;gap:1rem; }
    @media(max-width:500px){.form-row{grid-template-columns:1fr;}}
    .form-field { display:flex;flex-direction:column;gap:0.35rem;margin-bottom:0.85rem; }
    .form-field label { font-size:0.875rem;font-weight:600;color:#374151; }
    .form-field input,.form-field select,.form-field textarea {
      padding:0.6rem 0.85rem;border:1.5px solid #d1d5db;border-radius:8px;
      font-size:0.95rem;font-family:inherit;color:#111827;background:#fff;
      transition:border 0.2s;outline:none;
    }
    .form-field input:focus,.form-field select:focus,.form-field textarea:focus { border-color:#3b82f6; }
    .form-field textarea { resize:vertical; }
    .radio-group { display:flex;gap:1rem;margin-top:0.25rem; }
    .radio-group label { display:flex;align-items:center;gap:0.4rem;font-weight:500;font-size:0.9rem;cursor:pointer; }
    .required { color:#ef4444; }
    .interview-block { display:flex;gap:1rem;align-items:flex-start;padding:1rem;border-radius:10px;margin-top:1rem; }
    .interview-block.pending-confirm { background:#eff6ff;border:1.5px solid #bfdbfe; }
    .interview-block.confirmed { background:#f0fdf4;border:1.5px solid #bbf7d0; }
    .interview-icon { font-size:1.5rem; }
    .btn-confirm-interview {
      display:inline-flex;align-items:center;gap:0.5rem;
      padding:0.6rem 1.4rem;border-radius:10px;border:none;cursor:pointer;
      font-family:'Nunito',sans-serif;font-size:0.88rem;font-weight:700;
      background:var(--accent);color:#fff;
      box-shadow:0 2px 8px rgba(46,158,79,0.3);
      transition:background 0.2s,transform 0.1s,box-shadow 0.15s;
    }
    .btn-confirm-interview::before { content:'✓';font-size:1rem;font-weight:800;line-height:1; }
    .btn-confirm-interview:hover { background:var(--accent-hover);box-shadow:0 4px 12px rgba(46,158,79,0.4);transform:translateY(-1px); }
    .btn-confirm-interview:active { transform:translateY(0);box-shadow:none; }
    .btn-reschedule-interview {
      padding:0.5rem 1rem;border-radius:7px;border:none;cursor:pointer;
      font-size:0.85rem;font-weight:600;background:#f59e0b;color:#fff;
    }
    .decision-block { display:flex;gap:1rem;padding:1.25rem;border-radius:12px;margin-top:1rem;align-items:flex-start; }
    .decision-block.approved { background:#f0fdf4;border:1.5px solid #86efac; }
    .decision-block.rejected { background:#fef2f2;border:1.5px solid #fca5a5; }
    .decision-icon { font-size:2rem;flex-shrink:0; }
    .decision-block strong { font-size:1rem;display:block;margin-bottom:0.3rem; }
    .decision-block.approved strong { color:#166534; }
    .decision-block.rejected strong { color:#991b1b; }
    .decision-block p { margin:0;font-size:0.9rem;line-height:1.6; }
    .step.rejected-step .step-dot { background:#ef4444!important;color:#fff!important; }
  `;
  document.head.appendChild(style);
}

async function submitAdoptionForm(animal, formOverlay) {
  const fullName = document.getElementById('af_fullName').value.trim();
  const phone    = document.getElementById('af_phone').value.trim();
  const address  = document.getElementById('af_address').value.trim();
  const housing  = document.getElementById('af_housing').value;
  const hasYard  = document.querySelector('input[name="af_yard"]:checked')?.value;
  const hasPets  = document.querySelector('input[name="af_pets"]:checked')?.value;
  const hasKids  = document.querySelector('input[name="af_children"]:checked')?.value;
  const reason   = document.getElementById('af_reason').value.trim();
  const routine  = document.getElementById('af_routine').value.trim();
  const agree    = document.getElementById('af_agree').checked;

  // Inline validation — highlight each missing field and scroll to the first one
  const errorStyle = 'border: 2px solid #ef4444 !important; background: #fef2f2 !important;';
  const clearStyle = '';
  let firstError = null;

  function markField(id, isError) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.cssText = isError ? errorStyle : clearStyle;
    if (isError && !firstError) firstError = el;
  }

  markField('af_fullName', !fullName);
  markField('af_phone',    !phone);
  markField('af_address',  !address);
  markField('af_housing',  !housing);
  markField('af_reason',   !reason);
  markField('af_routine',  !routine);

  if (!fullName || !phone || !address || !housing || !reason || !routine) {
    firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    firstError?.focus();
    showToast('Please fill in all required fields (marked with *).', 'error');
    return;
  }
  if (!agree) {
    document.getElementById('af_agree').scrollIntoView({ behavior: 'smooth', block: 'center' });
    showToast('You must agree to the terms before submitting.', 'error');
    return;
  }

  const adopterId = state.user.adopterId ?? state.user.userId;
  const submitBtn = document.getElementById('af_submitBtn');
  submitBtn.disabled = true;
  submitBtn.textContent = '⏳ Submitting…';

  try {
    await api('/api/applications', {
      method: 'POST',
      body: JSON.stringify({
        adopterId,
        animalId:         animal.animalId,
        applicantFullName: fullName,
        applicantAddress:  address,
        applicantPhone:    phone,
        housingType:       housing,
        hasYard:           hasYard === 'yes',
        hasOtherPets:      hasPets === 'yes',
        otherPetsDetails:  document.getElementById('af_petsDetails')?.value.trim() || null,
        hasChildren:       hasKids === 'yes',
        childrenAges:      document.getElementById('af_childrenAges')?.value.trim() || null,
        adoptionReason:    reason,
        dailyRoutine:      routine,
        vetReference:      document.getElementById('af_vet')?.value.trim() || null,
        agreeToTerms:      true,
      }),
    });
    document.body.removeChild(formOverlay);
    showToast('🐾 Application submitted successfully!', 'success');
    state.applications = [];
    if (state.currentView === 'applications') renderApplications();
  } catch (e) {
    submitBtn.disabled = false;
    submitBtn.textContent = '🐾 Submit Application';
    showToast('Could not submit application. ' + e.message, 'error');
  }
}

// ── MODAL CLOSE ──
modalClose.addEventListener('click', () => modalOverlay.hidden = true);
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) modalOverlay.hidden = true; });

// ── SECTION LINKS ──
function attachSectionLinks() {
  document.querySelectorAll('[data-view-link]').forEach(el => {
    el.addEventListener('click', e => { e.preventDefault(); navigateTo(el.dataset.viewLink); });
  });
}

// ── FILTERS & SEARCH ──
document.getElementById('filterSpecies').addEventListener('input', () => { if (state.currentView === 'browse') renderBrowse(); });
document.getElementById('filterAge').addEventListener('change',     () => { if (state.currentView === 'browse') renderBrowse(); });
globalSearch.addEventListener('input', () => {
  if (state.currentView === 'browse') {
    renderBrowse();
  } else if (globalSearch.value.trim().length > 0) {
    navigateTo('browse');
  }
});
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
if (initAuth()) { renderHome(); }