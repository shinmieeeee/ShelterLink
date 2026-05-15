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

// ── Notifications & audit log ──
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
  overview:     { title: 'Overview',                 sub: "Here's what's happening at the shelter today." },
  animals:      { title: '🐾 Animal Management',     sub: 'Add, edit, or remove animals from the shelter.' },
  applications: { title: '📋 Adoption Applications', sub: 'Review and manage adoption applications.' },
  notifications:{ title: '🔔 Notifications',         sub: 'System updates and new application alerts.' },
  auditlog:     { title: '📜 Audit Log',              sub: 'All admin actions are recorded here.' },
};

// ── Helper: build fetch options with admin role headers ──
function adminFetchOpts(method = 'GET', body = null) {
  const user = JSON.parse(
    sessionStorage.getItem('shelterlink_user') ||
    localStorage.getItem('shelterlink_user') ||
    'null'
  );
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-User-Role': user?.role || 'Admin',
      'X-User-Id':   String(user?.userId || 0),
    },
  };
  if (body !== null) opts.body = JSON.stringify(body);
  return opts;
}

// ── Helper: write an audit log entry to the database ──
async function persistAuditLog(action, targetId = 0) {
  const user = JSON.parse(
    sessionStorage.getItem('shelterlink_user') ||
    localStorage.getItem('shelterlink_user') ||
    'null'
  );
  if (!user?.userId) return;
  try {
    await fetch(`${API}/api/admin/auditlogs`, {
      ...adminFetchOpts('POST', {
        actorId:  user.userId,
        action,
        targetId,
      }),
    });
  } catch (e) {
    console.warn('Audit log write failed (non-fatal):', e);
  }
}

// ── Init ──
window.addEventListener('DOMContentLoaded', () => {
  loadUser();
  loadData().then(() => loadServerAuditLogs());
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
      fetch(`${API}/api/animal`, adminFetchOpts()),
      fetch(`${API}/api/applications`, adminFetchOpts()),
    ]);

    animals      = animalsRes.ok ? await animalsRes.json() : [];
    applications = appsRes.ok   ? await appsRes.json()    : [];
  } catch (e) {
    console.error('Failed to load data:', e);
    showToast('Could not reach the server.', 'error');
  }

  refreshDashboard();
}

// ── Load server-side audit logs from DB ──
async function loadServerAuditLogs() {
  try {
    const res = await fetch(`${API}/api/admin/auditlogs`, adminFetchOpts());
    if (!res.ok) return;
    const serverLogs = await res.json();
    // Merge server logs in (server logs first, then any in-memory ones from this session)
    auditLogs = serverLogs.map(l => ({
      type: 'tan',
      text: `[${l.actorName}] ${l.action}`,
      time: new Date(l.timestamp).toLocaleString(),
    })).concat(auditLogs);
    renderAuditLogs();
    renderRecentLogs();
  } catch (e) {
    console.warn('Could not load server audit logs:', e);
  }
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
    (!species || a.species.toLowerCase().includes(species.toLowerCase()))
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
      <td>${a.age < 1 ? Math.round(a.age * 12) + ' mo' : a.age + ' yr/old'}</td>      <td>
        <div class="action-group">
          <button class="btn btn-info btn-sm"   onclick="openAnimalModal(${a.animalId})">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="confirmDeleteAnimal(${a.animalId})">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ── Photo upload handler ──
async function handlePhotoSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  const preview   = document.getElementById('aPhotoPreview');
  const icon      = document.getElementById('photoPlaceholderIcon');
  const hint      = document.getElementById('photoUploadHint');
  const photoPath = document.getElementById('aPhotoPath');

  // Show local preview immediately
  const reader = new FileReader();
  reader.onload = e => {
    preview.src = e.target.result;
    preview.style.display = 'block';
    icon.style.display = 'none';
  };
  reader.readAsDataURL(file);

  hint.textContent = '⏳ Uploading…';

  try {
    const formData = new FormData();
    formData.append('photo', file);

    const user = JSON.parse(
      sessionStorage.getItem('shelterlink_user') ||
      localStorage.getItem('shelterlink_user') ||
      'null'
    );
    const res = await fetch(`${API}/api/animal/upload-photo`, {
      method: 'POST',
      headers: {
        'X-User-Role': user?.role || 'Admin',
        'X-User-Id':   String(user?.userId || 0),
      },
      body: formData,
    });

    if (!res.ok) {
      let errMsg = 'Upload failed.';
      try { const err = await res.json(); errMsg = err.message || errMsg; } catch {}
      showToast(errMsg, 'error');
      hint.textContent = '⚠️ Upload failed — click to retry';
      return;
    }

    const data = await res.json();
    photoPath.value = data.photoPath;
    hint.textContent = '✅ Photo uploaded';
  } catch (e) {
    showToast('Could not upload photo.', 'error');
    hint.textContent = '⚠️ Upload failed — click to retry';
  }
}

function resetPhotoUpload() {
  document.getElementById('aPhotoPreview').style.display  = 'none';
  document.getElementById('aPhotoPreview').src            = '';
  document.getElementById('photoPlaceholderIcon').style.display = 'inline';
  document.getElementById('photoUploadHint').textContent  = 'Click to upload a photo';
  document.getElementById('aPhotoPath').value             = '';
  document.getElementById('aPhotoInput').value            = '';
}

function setPhotoPreview(path) {
  if (!path) { resetPhotoUpload(); return; }
  const preview = document.getElementById('aPhotoPreview');
  preview.src   = path;
  preview.style.display = 'block';
  document.getElementById('photoPlaceholderIcon').style.display = 'none';
  document.getElementById('photoUploadHint').textContent = '✅ Photo set — click to change';
  document.getElementById('aPhotoPath').value = path;
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
    document.getElementById('aAge').value = Math.abs(a.age);
    document.getElementById('aAgeUnit').value = a.age < 1 ? 'months' : 'years';    document.getElementById('aStatus').value  = a.status;
    document.getElementById('aGender').value  = a.gender || 'Male';
    document.getElementById('aDesc').value    = a.specialNotes || '';
    setPhotoPreview(a.photoPath || '');
  } else {
    ['aName', 'aBreed', 'aAge', 'aDesc'].forEach(fid => document.getElementById(fid).value = '');
    document.getElementById('aSpecies').value = '';
    document.getElementById('aAgeUnit').value = 'years';
    document.getElementById('aStatus').value  = '';
    document.getElementById('aGender').value  = '';
    resetPhotoUpload();
  }

  openModal('animalModal');
}

async function saveAnimal() {
  const name = document.getElementById('aName').value.trim();
  if (!name) { showToast('Name is required.', 'error'); return; }

  const id = parseInt(document.getElementById('aEditId').value) || 0;

  const val  = parseFloat(document.getElementById('aAge').value) || 0;
  const unit = document.getElementById('aAgeUnit')?.value || 'years';
  const age  = unit === 'months' ? parseFloat((val / 12).toFixed(2)) : val;

  const data = {
    name,
    species:      document.getElementById('aSpecies').value,
    breed:        document.getElementById('aBreed').value.trim(),
    age,
    status:       document.getElementById('aStatus').value,
    gender:       document.getElementById('aGender').value,
    specialNotes: document.getElementById('aDesc').value.trim(),
    photoPath:    document.getElementById('aPhotoPath').value.trim() || null,
  };

  const url    = id ? `${API}/api/animal/${id}` : `${API}/api/animal`;
  const method = id ? 'PUT' : 'POST';

  console.log('Saving animal:', method, url, data); // ← check this in console

  try {
    const res = await fetch(url, adminFetchOpts(method, data));
    console.log('Response status:', res.status); // ← check this too

    if (!res.ok) {
      let errMsg = 'Save failed.';
      try { const err = await res.json(); errMsg = err.message || errMsg; } catch {}
      showToast(errMsg, 'error');
      return;
    }

    const saved  = await res.json();
    const logMsg = id ? `Updated animal "${data.name}".` : `Added new animal "${data.name}".`;
    addLog('tan', logMsg);
    await persistAuditLog(logMsg, saved.animalId ?? id);
    showToast(id ? 'Animal updated!' : 'Animal added!', 'success');
    closeModal('animalModal');
    await loadData();
  } catch (e) {
    console.error('saveAnimal error:', e); // ← this will show the real error
    showToast('Could not reach the server: ' + e.message, 'error');
  }
}

// ── FIXED: deleteAnimal now sends role headers and persists audit log ──
async function deleteAnimal(id) {
  const a = animals.find(x => x.animalId === id);
  try {
    const res = await fetch(`${API}/api/animal/${id}`, adminFetchOpts('DELETE'));
    if (!res.ok) {
      let errMsg = 'Delete failed.';
      try { const err = await res.json(); errMsg = err.message || errMsg; } catch {}
      showToast(errMsg, 'error');
      return;
    }
    const logMsg = `Removed animal "${a?.name || '#' + id}".`;
    addLog('red', logMsg);
    await persistAuditLog(logMsg, id);
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
    appTableBody.innerHTML = `<tr><td colspan="6">${emptyState('📋', 'No applications found', 'Try adjusting your filters.')}</td></tr>`;
    return;
  }

  appTableBody.innerHTML = filtered.map(app => {
    const rescheduleTag = app.rescheduleRequested
      ? `<span style="font-size:0.75rem;background:#fef3c7;color:#92400e;padding:2px 6px;border-radius:4px;margin-left:4px;">🔄 Reschedule Requested</span>` : '';
    const confirmedTag = app.adopterConfirmed === true
      ? `<span style="font-size:0.75rem;background:#dcfce7;color:#166534;padding:2px 6px;border-radius:4px;margin-left:4px;">✅ Confirmed</span>` : '';

    return `
    <tr>
      <td><b>${appApplicantName(app)}</b></td>
      <td>${app.animal?.name || '—'}</td>
      <td>
        <span class="badge ${badgeClass(app.status)}">${app.status}</span>
        ${rescheduleTag}${confirmedTag}
      </td>
      <td>${formatDate(app.submittedAt)}</td>
      <td>
        ${app.interviewScheduledAt
          ? `<span style="font-size:0.82rem">${formatDate(app.interviewScheduledAt)}</span>`
          : '<span style="color:var(--text-light);font-size:0.8rem">—</span>'}
      </td>
      <td>
        <div class="action-group">
          <button class="btn btn-info btn-sm" onclick="viewApplicationForm(${app.applicationId})">📋 View</button>
          ${app.status === 'Pending' || (app.status === 'UnderReview' && app.rescheduleRequested) ? `
            <button class="btn btn-sm" style="background:#6366f1;color:#fff;" onclick="openScheduleInterview(${app.applicationId})">📅 Schedule</button>
          ` : ''}
          ${app.status === 'UnderReview' && !app.rescheduleRequested ? `
            <button class="btn btn-sm" style="background:#6366f1;color:#fff;" onclick="openScheduleInterview(${app.applicationId})">📅 Reschedule</button>
          ` : ''}
          ${(app.status === 'UnderReview') ? `
            <button class="btn btn-success btn-sm" onclick="approveApp(${app.applicationId})">✅ Approve</button>
            <button class="btn btn-danger btn-sm"  onclick="openRejectModal(${app.applicationId})">❌ Reject</button>
          ` : ''}
          ${(app.status === 'Pending') ? `
            <button class="btn btn-success btn-sm" onclick="approveApp(${app.applicationId})">✅ Approve</button>
            <button class="btn btn-danger btn-sm"  onclick="openRejectModal(${app.applicationId})">❌ Reject</button>
          ` : ''}
          ${app.status !== 'Pending' && app.status !== 'UnderReview'
            ? `<span style="font-size:0.8rem;color:var(--text-light)">${app.status}</span>` : ''}
        </div>
      </td>
    </tr>`;
  }).join('');
}

// ── View application form answers ──
function viewApplicationForm(id) {
  const app = applications.find(a => a.applicationId === id);
  if (!app) return;
  const name = appApplicantName(app);

  // Helper: always render a field row, show "—" if missing
  const field = (label, val) => `
    <div style="margin-bottom:0.9rem;">
      <div style="font-size:0.72rem;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:0.2rem;">${label}</div>
      <div style="font-size:0.93rem;color:${val != null && val !== '' ? '#111827' : '#d1d5db'};font-style:${val != null && val !== '' ? 'normal' : 'italic'};">${val != null && val !== '' ? escHtml(String(val)) : 'Not provided'}</div>
    </div>`;
  const bool = v => v === true ? '✅ Yes' : v === false ? '❌ No' : null;

  const statusColors = {
    Pending:     { bg:'#fef3c7', color:'#92400e' },
    UnderReview: { bg:'#dbeafe', color:'#1e40af' },
    Approved:    { bg:'#d1fae5', color:'#065f46' },
    Rejected:    { bg:'#fee2e2', color:'#991b1b' },
  };
  const sc = statusColors[app.status] || { bg:'#f3f4f6', color:'#374151' };

  const section = (icon, title, inner) => `
    <div style="background:#f9fafb;border-radius:10px;padding:1rem 1.25rem;margin-bottom:1rem;">
      <div style="font-size:0.8rem;font-weight:700;color:#6366f1;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:0.75rem;">${icon} ${title}</div>
      ${inner}
    </div>`;

  const content = `
    <div style="font-family:inherit;">
      <!-- Hero banner -->
      <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:12px;padding:1.25rem 1.5rem;margin-bottom:1.25rem;color:#fff;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;">
        <div>
          <div style="font-size:1.1rem;font-weight:700;">${escHtml(name)}</div>
          <div style="font-size:0.85rem;opacity:0.85;margin-top:0.2rem;">
            🐾 ${escHtml(app.animal?.name || '—')} · ${escHtml(app.animal?.species || '')}
            &nbsp;·&nbsp; Submitted ${formatDate(app.submittedAt)}
          </div>
        </div>
        <span style="background:${sc.bg};color:${sc.color};font-size:0.8rem;font-weight:700;padding:0.3rem 0.85rem;border-radius:999px;">${app.status}</span>
      </div>

      ${section('👤', 'Personal Information', `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 1.5rem;">
          ${field('Full Name', app.applicantFullName)}
          ${field('Phone', app.applicantPhone)}
        </div>
        ${field('Address', app.applicantAddress)}
      `)}

      ${section('🏠', 'Living Situation', `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 1.5rem;">
          ${field('Housing Type', app.housingType)}
          ${field('Has Yard', bool(app.hasYard))}
        </div>
      `)}

      ${section('👨‍👩‍👧', 'Household', `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 1.5rem;">
          ${field('Has Other Pets', bool(app.hasOtherPets))}
          ${field('Has Children', bool(app.hasChildren))}
        </div>
        ${app.hasOtherPets && app.otherPetsDetails ? field('Other Pets Details', app.otherPetsDetails) : ''}
        ${app.hasChildren  && app.childrenAges     ? field('Children Ages',      app.childrenAges)     : ''}
      `)}

      ${section('💬', 'About the Applicant', `
        ${field('Why they want to adopt', app.adoptionReason)}
        ${field('Daily Routine', app.dailyRoutine)}
        ${field('Vet Reference', app.vetReference)}
        ${field('Agreed to Terms', bool(app.agreeToTerms))}
      `)}

      ${app.status === 'UnderReview' || app.interviewScheduledAt ? section('📅', 'Interview', `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 1.5rem;">
          ${field('Scheduled At', app.interviewScheduledAt ? new Date(app.interviewScheduledAt).toLocaleString() : null)}
          ${field('Adopter Confirmed', app.adopterConfirmed === true ? '✅ Confirmed' : app.adopterConfirmed === false ? '❌ Declined' : '⏳ Awaiting Response')}
        </div>
        ${app.rescheduleRequested ? `<div style="margin-top:0.5rem;background:#fef3c7;color:#92400e;font-size:0.82rem;font-weight:600;padding:0.4rem 0.75rem;border-radius:6px;display:inline-block;">🔄 Reschedule Requested</div>` : ''}
      `) : ''}
    </div>
  `;

  document.querySelector('#appModal .modal-title').textContent = `📋 Application — ${name}`;
  // Wrap content in a scrollable container so the modal stays on-screen
  document.getElementById('appModalContent').innerHTML =
    `<div style="max-height:62vh;overflow-y:auto;padding:1.25rem 1.5rem 0.5rem;">${content}</div>`;
  document.getElementById('appModalActions').innerHTML =
    `<button class="btn btn-ghost" onclick="closeModal('appModal')">Close</button>`;
  openModal('appModal');
}

// ── Interview calendar scheduler ──
function openScheduleInterview(id) {
  const app = applications.find(a => a.applicationId === id);
  if (!app) return;

  // Build calendar modal
  const existingOverlay = document.getElementById('calendarModalOverlay');
  if (existingOverlay) existingOverlay.remove();

  const overlay = document.createElement('div');
  overlay.id = 'calendarModalOverlay';
  overlay.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:9999;display:flex;justify-content:center;align-items:center;`;

  const today = new Date();
  let calYear  = today.getFullYear();
  let calMonth = today.getMonth();

  function buildCalendar() {
    const firstDay  = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    let cells = '';
    for (let i = 0; i < firstDay; i++) cells += `<div></div>`;
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(calYear, calMonth, d);
      const isPast  = dateObj < new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
      const dateStr   = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      cells += `<div class="cal-day ${isPast || isWeekend ? 'cal-disabled' : 'cal-available'}"
                     data-date="${dateStr}" ${isPast || isWeekend ? '' : `onclick="selectCalDay('${dateStr}')"`}>
                  ${d}
                </div>`;
    }

    overlay.innerHTML = `
      <div style="background:#fff;border-radius:16px;width:420px;max-width:95vw;box-shadow:0 20px 60px rgba(0,0,0,0.3);overflow:hidden;">
        <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:1.5rem;">
          <h3 style="margin:0;font-size:1.2rem;">📅 Schedule Interview</h3>
          <p style="margin:0.3rem 0 0;opacity:0.85;font-size:0.9rem;">
            For <strong>${escHtml(appApplicantName(app))}</strong> — ${escHtml(app.animal?.name || '')}
          </p>
        </div>
        <div style="padding:1.25rem;">
          <!-- Month nav -->
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;">
            <button onclick="calNav(-1)" style="border:none;background:#f3f4f6;border-radius:8px;padding:0.4rem 0.75rem;cursor:pointer;font-size:1rem;">‹</button>
            <strong style="font-size:1rem;">${monthNames[calMonth]} ${calYear}</strong>
            <button onclick="calNav(1)"  style="border:none;background:#f3f4f6;border-radius:8px;padding:0.4rem 0.75rem;cursor:pointer;font-size:1rem;">›</button>
          </div>
          <!-- Day-of-week headers -->
          <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-bottom:4px;text-align:center;">
            ${['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => `<div style="font-size:0.75rem;font-weight:600;color:#9ca3af;">${d}</div>`).join('')}
          </div>
          <!-- Calendar grid -->
          <div id="calGrid" style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px;">
            ${cells}
          </div>
          <!-- Time picker (hidden until date selected) -->
          <div id="calTimePicker" style="display:none;margin-top:1rem;">
            <hr style="border:none;border-top:1px solid #e5e7eb;margin-bottom:1rem;"/>
            <div style="font-weight:600;font-size:0.9rem;margin-bottom:0.5rem;">🕐 Select Interview Time</div>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.5rem;" id="timeSlots"></div>
          </div>
          <!-- Selected display -->
          <div id="calSelected" style="margin-top:1rem;display:none;background:#eff6ff;border:1.5px solid #bfdbfe;border-radius:8px;padding:0.75rem;font-size:0.9rem;"></div>
          <!-- Actions -->
          <div style="display:flex;gap:0.75rem;margin-top:1.25rem;justify-content:flex-end;">
            <button onclick="document.getElementById('calendarModalOverlay').remove()" style="padding:0.6rem 1.2rem;border-radius:8px;border:1.5px solid #d1d5db;background:#fff;cursor:pointer;font-weight:500;">Cancel</button>
            <button id="calConfirmBtn" onclick="confirmInterview(${id})" disabled style="padding:0.6rem 1.5rem;border-radius:8px;border:none;background:#6366f1;color:#fff;cursor:pointer;font-weight:600;opacity:0.5;">Confirm Schedule</button>
          </div>
        </div>
      </div>
      <style>
        .cal-day{text-align:center;padding:0.45rem 0.2rem;border-radius:7px;font-size:0.88rem;font-weight:500;}
        .cal-available{cursor:pointer;color:#111827;}
        .cal-available:hover{background:#eff6ff;color:#3b82f6;}
        .cal-disabled{color:#d1d5db;cursor:not-allowed;}
        .cal-selected{background:#6366f1!important;color:#fff!important;border-radius:7px;}
        .time-slot{padding:0.5rem;border-radius:7px;border:1.5px solid #e5e7eb;cursor:pointer;font-size:0.82rem;font-weight:500;text-align:center;transition:all 0.15s;}
        .time-slot:hover{border-color:#6366f1;color:#6366f1;}
        .time-slot.selected{background:#6366f1;color:#fff;border-color:#6366f1;}
      </style>
    `;
  }

  window._calState = { year: calYear, month: calMonth, selectedDate: null, selectedTime: null, appId: id };
  window.calNav = function(dir) {
    window._calState.month += dir;
    if (window._calState.month > 11) { window._calState.month = 0; window._calState.year++; }
    if (window._calState.month < 0)  { window._calState.month = 11; window._calState.year--; }
    calYear  = window._calState.year;
    calMonth = window._calState.month;
    buildCalendar();
  };

  window.selectCalDay = function(dateStr) {
    window._calState.selectedDate = dateStr;
    window._calState.selectedTime = null;
    // Re-render to highlight
    document.querySelectorAll('.cal-day').forEach(d => d.classList.remove('cal-selected'));
    const dayEl = document.querySelector(`.cal-day[data-date="${dateStr}"]`);
    if (dayEl) dayEl.classList.add('cal-selected');

    // Show time slots
    const timePicker = document.getElementById('calTimePicker');
    timePicker.style.display = 'block';
    const slots = ['09:00 AM','10:00 AM','11:00 AM','01:00 PM','02:00 PM','03:00 PM','04:00 PM'];
    document.getElementById('timeSlots').innerHTML = slots.map(t => `
      <div class="time-slot" onclick="selectCalTime('${t}')">${t}</div>
    `).join('');

    document.getElementById('calSelected').style.display = 'none';
    document.getElementById('calConfirmBtn').disabled = true;
    document.getElementById('calConfirmBtn').style.opacity = '0.5';
  };

  window.selectCalTime = function(time) {
    window._calState.selectedTime = time;
    document.querySelectorAll('.time-slot').forEach(t => t.classList.remove('selected'));
    const el = Array.from(document.querySelectorAll('.time-slot')).find(t => t.textContent === time);
    if (el) el.classList.add('selected');

    const d = new Date(window._calState.selectedDate + 'T00:00:00');
    const dayStr = d.toLocaleDateString('en-US', {weekday:'long',month:'long',day:'numeric',year:'numeric'});
    document.getElementById('calSelected').style.display = 'block';
    document.getElementById('calSelected').innerHTML = `📅 <strong>${dayStr}</strong> at <strong>${time}</strong>`;
    document.getElementById('calConfirmBtn').disabled = false;
    document.getElementById('calConfirmBtn').style.opacity = '1';
  };

  window.confirmInterview = async function(appId) {
    const { selectedDate, selectedTime } = window._calState;
    if (!selectedDate || !selectedTime) return;

    // Parse AM/PM time to 24-hour
    const timeParts = selectedTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!timeParts) { showToast('Invalid time selected.', 'error'); return; }
    let hour = parseInt(timeParts[1], 10);
    const minute = timeParts[2];
    const period = timeParts[3].toUpperCase();
    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    const isoStr = `${selectedDate}T${String(hour).padStart(2,'0')}:${minute}:00`;

    try {
      const res = await fetch(`${API}/api/applications/${appId}/interview`, adminFetchOpts('PUT', { ScheduledAt: isoStr }));
      if (!res.ok) { showToast('Could not schedule interview.', 'error'); return; }
      const app = applications.find(a => a.applicationId === appId);
      const logMsg = `Scheduled interview for "${appApplicantName(app)}" on ${selectedDate} at ${selectedTime}.`;
      addLog('tan', logMsg);
      addNotification('📅', logMsg);
      await persistAuditLog(logMsg, appId);
      // Backend already saves INTERVIEW_SCHEDULED notification to DB — no duplicate POST needed
      showToast('Interview scheduled and applicant notified! 📅', 'success');
      document.getElementById('calendarModalOverlay').remove();
      await loadData();
    } catch (e) {
      showToast('Could not reach the server.', 'error');
    }
  };

  buildCalendar();
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

// ── approveApp ──
async function approveApp(id) {
  const app = applications.find(a => a.applicationId === id);
  try {
    const res = await fetch(`${API}/api/applications/${id}/status`, adminFetchOpts('PUT', { status: 'Approved' }));
    if (!res.ok) { showToast('Could not approve application.', 'error'); return; }
    const logMsg = `Approved application from "${appApplicantName(app)}".`;
    addLog('green', logMsg);
    addNotification('✅', `Application from ${appApplicantName(app)} approved.`);
    await persistAuditLog(logMsg, id);
    // Backend already saves APPROVED: notification in UpdateStatus — no duplicate POST needed
    showToast('Application approved! 🎉', 'success');
    await loadData();
  } catch (e) {
    showToast('Could not reach the server.', 'error');
  }
}

// ── openRejectModal — prompts for reason then rejects ──
function openRejectModal(id) {
  const app = applications.find(a => a.applicationId === id);
  document.getElementById('confirmTitle').textContent = '❌ Reject Application';
  document.getElementById('confirmMsg').innerHTML = `
    <p>You are about to reject the application from <strong>${escHtml(appApplicantName(app))}</strong> for <strong>${escHtml(app.animal?.name || 'this animal')}</strong>.</p>
    <div style="margin-top:0.75rem;">
      <label style="font-size:0.875rem;font-weight:600;display:block;margin-bottom:0.4rem;">Reason for Rejection (will be shown to applicant)</label>
      <textarea id="rejectReasonInput" rows="3" style="width:100%;padding:0.6rem;border:1.5px solid #d1d5db;border-radius:8px;font-size:0.9rem;font-family:inherit;resize:vertical;"
        placeholder="e.g. Housing does not meet our requirements for this breed..."></textarea>
    </div>
  `;
  const btn = document.getElementById('confirmOkBtn');
  btn.textContent = 'Confirm Rejection';
  btn.style.background = '#ef4444';
  btn.onclick = async () => {
    const reason = document.getElementById('rejectReasonInput')?.value.trim() || '';
    closeModal('confirmModal');
    btn.style.background = '';
    await rejectApp(id, reason);
  };
  openModal('confirmModal');
}

async function rejectApp(id, rejectionReason = '') {
  const app = applications.find(a => a.applicationId === id);
  try {
    const res = await fetch(`${API}/api/applications/${id}/status`, adminFetchOpts('PUT', { status: 'Rejected', rejectionReason }));
    if (!res.ok) { showToast('Could not reject application.', 'error'); return; }
    const logMsg = `Rejected application from "${appApplicantName(app)}".`;
    addLog('red', logMsg);
    addNotification('❌', `Application from ${appApplicantName(app)} rejected.`);
    await persistAuditLog(logMsg, id);
    // Backend already saves REJECTED: notification in UpdateStatus — no duplicate POST needed
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
  return app.adopter?.user?.name || app.adopter?.user?.email || 'Unknown';
}

function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
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