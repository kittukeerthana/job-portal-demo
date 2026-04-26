

const API = '';   
let allJobs      = [];
let applications = [];
let currentJobId = null;

async function fetchApplications() {
  const r = await fetch(`${API}/api/applications`);
  applications = await r.json();
  updateBadge();
}

async function postApplication(data) {
  const r = await fetch(`${API}/api/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!r.ok) {
    const err = await r.json();
    throw new Error(err.error || 'Server error');
  }
  return r.json();
}

async function deleteApplicationAPI(id) {
  const r = await fetch(`${API}/api/applications/${id}`, { method: 'DELETE' });
  if (!r.ok) throw new Error('Delete failed');
  return r.json();
}

function showToast(msg, type = 'info') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 3500);
}

function isApplied(jobId) {
  return applications.some(a => a.jobId === jobId);
}

function updateBadge() {
  document.getElementById('app-count-badge').textContent =
    `${applications.length} Applied`;
}

function getRemoteTag(remote) {
  return { Remote:'tag-remote', Onsite:'tag-onsite', Hybrid:'tag-hybrid' }[remote] || 'tag-hybrid';
}

function renderCard(job) {
  const applied = isApplied(job.id);
  return `
    <div class="job-card ${applied ? 'applied' : ''}" data-id="${job.id}">
      <div class="card-top">
        <div class="company-logo" style="background:${job.logoColor}">${job.logo}</div>
        <div class="card-info">
          <div class="job-title">${job.title}</div>
          <div class="company-name">${job.company}</div>
        </div>
        ${applied ? '<span class="applied-badge">✓ Applied</span>' : ''}
      </div>
      <div class="card-tags">
        <span class="tag tag-type">${job.type}</span>
        <span class="tag tag-cat">${job.category}</span>
        <span class="tag ${getRemoteTag(job.remote)}">${job.remote}</span>
      </div>
      <p style="font-size:.85rem;color:var(--ink-soft);line-height:1.55;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${job.description}</p>
      <div class="card-salary">${job.salary} <span>per year</span></div>
      <div class="card-meta">
        <span><i class="fa fa-map-marker-alt"></i> ${job.location}</span>
        <span><i class="fa fa-clock"></i> ${job.type}</span>
      </div>
      <div class="card-footer">
        <span class="posted-time">Posted ${job.posted}</span>
        <button class="btn-apply ${applied ? 'applied-btn' : ''}" data-id="${job.id}" ${applied ? 'disabled' : ''}>
          ${applied ? '✓ Applied' : 'Apply Now'}
        </button>
      </div>
    </div>`;
}

// ── RENDER GRID ────────────────────────────────────────────
function renderGrid(jobs) {
  const grid  = document.getElementById('jobs-grid');
  const empty = document.getElementById('empty-state');
  const count = document.getElementById('result-count');

  if (!jobs.length) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    count.textContent = 'No results found';
    return;
  }
  empty.style.display = 'none';
  count.textContent = `Showing ${jobs.length} job${jobs.length !== 1 ? 's' : ''}`;
  grid.innerHTML = jobs.map(renderCard).join('');

  grid.querySelectorAll('.job-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('.btn-apply')) return;
      openModal(parseInt(card.dataset.id));
    });
  });
  grid.querySelectorAll('.btn-apply:not([disabled])').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      openModal(parseInt(btn.dataset.id));
    });
  });
}

function applyFilters() {
  const q   = document.getElementById('search-input').value.toLowerCase().trim();
  const cat = document.getElementById('filter-category').value;
  const srt = document.getElementById('sort-select').value;

  let jobs = allJobs.filter(j => {
    const mQ = !q || j.title.toLowerCase().includes(q) ||
                     j.company.toLowerCase().includes(q) ||
                     j.category.toLowerCase().includes(q) ||
                     j.description.toLowerCase().includes(q);
    const mC = !cat || j.category === cat;
    return mQ && mC;
  });

  if (srt === 'salary')     jobs.sort((a,b) => b.salaryNum - a.salaryNum);
  else if (srt === 'alpha') jobs.sort((a,b) => a.title.localeCompare(b.title));
  else                      jobs.sort((a,b) => b.postedTs - a.postedTs);

  renderGrid(jobs);
}

function openModal(jobId) {
  const job = allJobs.find(j => j.id === jobId);
  if (!job) return;
  currentJobId = jobId;

  const logo = document.getElementById('modal-logo');
  logo.textContent    = job.logo;
  logo.style.background = job.logoColor;
  logo.style.display    = 'flex';
  logo.style.alignItems = 'center';
  logo.style.justifyContent = 'center';
  logo.style.fontSize = '1.8rem';

  document.getElementById('modal-job-title').textContent = job.title;
  document.getElementById('modal-company').textContent   = `${job.company} · ${job.location} · ${job.remote}`;

  ['f-name','f-email','f-phone','f-link','f-cover'].forEach(id =>
    document.getElementById(id).value = '');
  document.getElementById('f-exp').value      = '';
  document.getElementById('file-name').textContent = '';

  document.getElementById('modal-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  document.body.style.overflow = '';
  currentJobId = null;
}

async function submitApplication() {
  const name  = document.getElementById('f-name').value.trim();
  const email = document.getElementById('f-email').value.trim();
  const exp   = document.getElementById('f-exp').value;
  const cover = document.getElementById('f-cover').value.trim();

  if (!name || !email || !exp || !cover) {
    showToast('Please fill in all required fields.', 'error'); return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showToast('Please enter a valid email address.', 'error'); return;
  }

  const job = allJobs.find(j => j.id === currentJobId);
  const btn = document.getElementById('submit-apply');
  btn.textContent = 'Submitting…';
  btn.disabled    = true;

  try {
    const app = await postApplication({
      jobId:    job.id,
      jobTitle: job.title,
      company:  job.company,
      logo:     job.logo,
      logoColor:job.logoColor,
      location: job.location,
      remote:   job.remote,
      name, email,
      phone: document.getElementById('f-phone').value.trim(),
      exp,
      link:  document.getElementById('f-link').value.trim(),
      cover,
    });
    applications.push(app);
    updateBadge();
    closeModal();
    applyFilters();
    showToast(`🎉 Application submitted to ${job.company}!`, 'success');
  } catch(e) {
    showToast(e.message || 'Submission failed. Please try again.', 'error');
  } finally {
    btn.textContent = 'Submit Application';
    btn.disabled    = false;
  }
}

async function deleteApplication(appId) {
  const app = applications.find(a => a.id === appId);
  if (!app) return;
  if (!confirm(`Withdraw your application to ${app.company} for "${app.jobTitle}"?`)) return;

  try {
    await deleteApplicationAPI(appId);
    applications = applications.filter(a => a.id !== appId);
    updateBadge();
    renderApplications();
    applyFilters();
    showToast(`Application to ${app.company} withdrawn.`, 'info');
  } catch(e) {
    showToast('Could not withdraw. Please try again.', 'error');
  }
}


const STATUS_LABELS = {
  pending:  { label:'Under Review',   cls:'status-pending'  },
  review:   { label:'Shortlisted',    cls:'status-review'   },
  rejected: { label:'Not Selected',   cls:'status-rejected' },
  accepted: { label:'Offer Received', cls:'status-accepted' },
};

function renderApplications() {
  const list  = document.getElementById('apps-list');
  const empty = document.getElementById('apps-empty');

  if (!applications.length) {
    list.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  list.innerHTML = applications.map(app => {
    const s = STATUS_LABELS[app.status] || STATUS_LABELS.pending;
    return `
      <div class="app-card">
        <div class="app-logo" style="background:${app.logoColor}">${app.logo}</div>
        <div class="app-info">
          <div class="app-title">${app.jobTitle}</div>
          <div class="app-company">${app.company} · ${app.location} · ${app.remote}</div>
          <div class="app-meta">
            <span><i class="fa fa-user"></i> ${app.name}</span>
            <span><i class="fa fa-envelope"></i> ${app.email}</span>
            <span><i class="fa fa-calendar"></i> Applied ${app.appliedAt}</span>
          </div>
        </div>
        <span class="app-status ${s.cls}">${s.label}</span>
        <button class="btn-delete" onclick="deleteApplication(${app.id})">
          <i class="fa fa-trash"></i> Withdraw
        </button>
      </div>`;
  }).join('');
}

function showPage(page) {
  const homeSections = document.querySelectorAll('.hero, .listings-section');
  const appsPage     = document.getElementById('applications-page');
  document.querySelectorAll('.nav-link').forEach(l =>
    l.classList.toggle('active', l.dataset.page === page));

  if (page === 'home') {
    homeSections.forEach(s => s.style.display = '');
    appsPage.style.display = 'none';
  } else {
    homeSections.forEach(s => s.style.display = 'none');
    appsPage.style.display = '';
    renderApplications();
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  allJobs = JOBS;

  await fetchApplications();

  applyFilters();

  document.querySelectorAll('.nav-link').forEach(link =>
    link.addEventListener('click', e => { e.preventDefault(); showPage(link.dataset.page); }));

  document.getElementById('search-btn').addEventListener('click', applyFilters);
  document.getElementById('search-input').addEventListener('keydown', e => { if (e.key === 'Enter') applyFilters(); });
  document.getElementById('filter-category').addEventListener('change', applyFilters);
  document.getElementById('sort-select').addEventListener('change', applyFilters);

  document.querySelectorAll('.quick-tag').forEach(btn =>
    btn.addEventListener('click', () => {
      document.getElementById('search-input').value = btn.dataset.q;
      applyFilters();
    }));

  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modal-overlay')) closeModal();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  document.getElementById('submit-apply').addEventListener('click', submitApplication);

  document.getElementById('f-resume').addEventListener('change', function() {
    document.getElementById('file-name').textContent =
      this.files[0] ? `✓ ${this.files[0].name}` : '';
  });
});
