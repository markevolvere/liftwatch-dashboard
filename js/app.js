// LiftWatch Portal - Shared Utilities

let dataCache = null;

// Load data from data.json
async function loadData() {
  if (dataCache) return dataCache;
  const base = window.location.pathname.replace(/\/[^/]*$/, '');
  const response = await fetch(base + '/data.json?v=' + Date.now());
  dataCache = await response.json();
  return dataCache;
}

// Set active nav link
function setActiveNav(page) {
  document.querySelectorAll('nav a').forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href').endsWith(page + '.html') || 
        (page === 'index' && link.getAttribute('href').endsWith('/'))) {
      link.classList.add('active');
    }
  });
}

// Format currency
function formatCurrency(val) {
  if (!val) return '';
  const num = parseFloat(val);
  if (isNaN(num)) return val;
  return '$' + num.toLocaleString();
}

// Format date
function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-AU');
  } catch {
    return dateStr;
  }
}

// Search jobs (client-side)
function searchJobs(jobs, query) {
  if (!query) return jobs;
  const q = query.toLowerCase();
  return jobs.filter(job =>
    job.title.toLowerCase().includes(q) ||
    job.company.toLowerCase().includes(q) ||
    job.location.toLowerCase().includes(q) ||
    job.category.toLowerCase().includes(q)
  );
}

// Filter jobs
function filterJobs(jobs, filters) {
  return jobs.filter(job => {
    if (filters.company && job.company !== filters.company) return false;
    if (filters.category && job.category !== filters.category) return false;
    if (filters.state && job.state !== filters.state) return false;
    if (filters.source && job.source !== filters.source) return false;
    if (filters.status && job.status !== filters.status) return false;
    return true;
  });
}

// Get unique values from jobs
function getUnique(jobs, field) {
  const seen = new Set();
  const values = [];
  jobs.forEach(job => {
    const val = job[field];
    if (val && !seen.has(val)) {
      seen.add(val);
      values.push(val);
    }
  });
  return values.sort();
}

// Pagination
function paginate(items, page, perPage = 50) {
  const start = (page - 1) * perPage;
  const end = start + perPage;
  return {
    items: items.slice(start, end),
    page: page,
    perPage: perPage,
    total: items.length,
    pages: Math.ceil(items.length / perPage)
  };
}

// Build select options
function buildSelect(selectEl, values, defaultValue = '') {
  selectEl.innerHTML = '<option value="">' + selectEl.getAttribute('data-placeholder') + '</option>';
  values.forEach(value => {
    if (value) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      selectEl.appendChild(option);
    }
  });
  if (defaultValue) selectEl.value = defaultValue;
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
  // Get current page from URL
  const path = window.location.pathname;
  let page = 'index';
  if (path.includes('jobs.html')) page = 'jobs';
  else if (path.includes('companies.html')) page = 'companies';
  else if (path.includes('analytics.html')) page = 'analytics';
  else if (path.includes('downloads.html')) page = 'downloads';
  else if (path.includes('methodology.html')) page = 'methodology';
  
  setActiveNav(page);
});
