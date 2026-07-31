const GITHUB_USER = 'aiboqiao6';
const API_BASE = 'https://api.github.com';
const CONTRIBUTIONS_API = `https://github-contributions-api.jogruber.de/v4/${GITHUB_USER}?y=last`;

const languageColors = {
  'C++': '#f19f8f',
  QML: '#8ac7ad',
  CSS: '#8daee8',
  JavaScript: '#e5cc74',
  HTML: '#e49876'
};

const projectPriority = [
  'macdowsOS-Tool',
  'macdowsOS-Files',
  'macdowsOS-Tool-ButtonChanger'
];

const elements = {
  contributionGrid: document.querySelector('#contributionGrid'),
  contributionTotal: document.querySelector('#contributionTotal'),
  githubStatus: document.querySelector('#githubStatus'),
  lastActivity: document.querySelector('#lastActivity'),
  profileContributions: document.querySelector('#profileContributions'),
  profileFollowers: document.querySelector('#profileFollowers'),
  profileNumbers: document.querySelector('#profileNumbers'),
  profileRepos: document.querySelector('#profileRepos'),
  githubPanel: document.querySelector('#github'),
  projectList: document.querySelector('#projectList'),
  projectsPanel: document.querySelector('#projects'),
  topLanguage: document.querySelector('#topLanguage')
};

function setupNavigation() {
  const links = [...document.querySelectorAll('.top-nav-link')];
  const getVisibleSections = () => [...document.querySelectorAll('#home, #about, #github, #projects, #contact')]
    .filter((section) => !section.hidden && section.getClientRects().length > 0);
  let navigationLockUntil = 0;
  const setActive = (id) => {
    links.forEach((link) => {
      const isActive = link.hash === `#${id}`;
      link.classList.toggle('is-active', isActive);
      if (isActive) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  };

  links.forEach((link) => link.addEventListener('click', () => {
    navigationLockUntil = window.performance.now() + 1000;
    setActive(link.hash.slice(1));
  }));
  let scrollFrame = 0;
  const updateFromScroll = () => {
    scrollFrame = 0;
    if (window.performance.now() < navigationLockUntil) return;
    const sections = getVisibleSections();
    if (!sections.length) return;
    const marker = window.innerHeight * 0.3;
    let current = sections[0];
    sections.forEach((section) => {
      if (section.getBoundingClientRect().top <= marker) current = section;
    });
    setActive(current.id);
  };
  window.addEventListener('scroll', () => {
    if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateFromScroll);
  }, { passive: true });

  const content = document.querySelector('.personal-layout');
  if (content) {
    const visibilityObserver = new MutationObserver(updateFromScroll);
    visibilityObserver.observe(content, {
      subtree: true,
      attributes: true,
      attributeFilter: ['hidden']
    });
  }
  updateFromScroll();
}

async function fetchJson(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/vnd.github+json' },
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    window.clearTimeout(timeout);
  }
}

function renderContributionCells(contributions) {
  if (!elements.contributionGrid) return;
  const safeItems = Array.isArray(contributions) ? contributions.slice(-371) : [];
  if (!safeItems.length) {
    elements.contributionGrid.replaceChildren();
    return;
  }
  const fragment = document.createDocumentFragment();

  for (let index = 0; index < 371; index += 1) {
    const item = safeItems[index];
    const level = Number.isInteger(item?.level) ? Math.min(4, Math.max(0, item.level)) : 0;
    const cell = document.createElement('span');
    cell.className = 'contribution-cell';
    cell.dataset.level = String(level);
    if (typeof item?.date === 'string') {
      const count = Number.isFinite(item.count) ? item.count : 0;
      cell.title = `${item.date} · ${count} 次贡献`;
    }
    fragment.appendChild(cell);
  }

  elements.contributionGrid.replaceChildren(fragment);
}

function formatUpdateDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '近期更新';
  return `更新于 ${date.getMonth() + 1}月${date.getDate()}日`;
}

function validRepository(repo) {
  return repo && typeof repo.name === 'string' && typeof repo.html_url === 'string' &&
    repo.html_url.startsWith(`https://github.com/${GITHUB_USER}/`);
}

function createProjectCard(repo, index) {
  const link = document.createElement('a');
  link.className = 'project-card';
  link.href = repo.html_url;
  link.target = '_blank';
  link.rel = 'noreferrer';

  const number = document.createElement('span');
  number.className = 'project-number';
  number.textContent = String(index + 1).padStart(2, '0');

  const main = document.createElement('div');
  main.className = 'project-main';
  const name = document.createElement('strong');
  name.textContent = repo.name;
  const description = document.createElement('p');
  description.textContent = typeof repo.description === 'string' && repo.description.trim()
    ? repo.description.trim()
    : '公开开源项目';

  const meta = document.createElement('div');
  meta.className = 'project-meta';
  const language = document.createElement('span');
  const dot = document.createElement('i');
  dot.className = 'language-dot';
  const languageName = typeof repo.language === 'string' ? repo.language : '未标注';
  dot.style.backgroundColor = languageColors[languageName] || '#9ba8b6';
  language.append(dot, document.createTextNode(languageName));
  const stars = document.createElement('span');
  stars.textContent = `★ ${Number.isFinite(repo.stargazers_count) ? repo.stargazers_count : 0}`;
  const updated = document.createElement('span');
  updated.textContent = formatUpdateDate(repo.updated_at);
  meta.append(language, stars, updated);
  main.append(name, description, meta);

  const arrow = document.createElement('span');
  arrow.className = 'project-arrow';
  arrow.textContent = '↗';
  link.append(number, main, arrow);
  return link;
}

function renderProjects(repositories) {
  if (!elements.projectList) return;
  if (!Array.isArray(repositories) || !repositories.length) {
    elements.projectList.replaceChildren();
    if (elements.projectsPanel) elements.projectsPanel.hidden = true;
    return;
  }
  const safeRepositories = repositories.filter(validRepository);
  const sorted = [...safeRepositories].sort((a, b) => {
    const aPriority = projectPriority.indexOf(a.name);
    const bPriority = projectPriority.indexOf(b.name);
    if (aPriority !== -1 || bPriority !== -1) {
      return (aPriority === -1 ? 99 : aPriority) - (bPriority === -1 ? 99 : bPriority);
    }
    return (b.stargazers_count || 0) - (a.stargazers_count || 0);
  });
  const cards = sorted.slice(0, 3).map(createProjectCard);
  if (cards.length) {
    elements.projectList.replaceChildren(...cards);
    if (elements.projectsPanel) elements.projectsPanel.hidden = false;
  } else {
    renderProjects(null);
  }

  const languageCounts = safeRepositories.reduce((counts, repo) => {
    if (typeof repo.language === 'string') counts.set(repo.language, (counts.get(repo.language) || 0) + 1);
    return counts;
  }, new Map());
  const languages = [...languageCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([name]) => name);
  if (elements.topLanguage && languages.length) elements.topLanguage.textContent = languages.join(' / ');
}

async function syncGitHubData() {
  const results = await Promise.allSettled([
    fetchJson(`${API_BASE}/users/${GITHUB_USER}`),
    fetchJson(`${API_BASE}/users/${GITHUB_USER}/repos?per_page=100&sort=updated`),
    fetchJson(`${API_BASE}/users/${GITHUB_USER}/events/public?per_page=10`),
    fetchJson(CONTRIBUTIONS_API)
  ]);

  const [profileResult, reposResult, eventsResult, contributionsResult] = results;

  if (profileResult.status === 'fulfilled' && profileResult.value && typeof profileResult.value === 'object') {
    const profile = profileResult.value;
    const hasProfileData = Number.isFinite(profile.public_repos) || Number.isFinite(profile.followers);
    if (Number.isFinite(profile.public_repos) && elements.profileRepos) elements.profileRepos.textContent = profile.public_repos;
    if (Number.isFinite(profile.followers) && elements.profileFollowers) elements.profileFollowers.textContent = profile.followers;
    if (hasProfileData && elements.profileNumbers) elements.profileNumbers.hidden = false;
  }

  if (reposResult.status === 'fulfilled') renderProjects(reposResult.value);
  else renderProjects(null);

  if (eventsResult.status === 'fulfilled' && Array.isArray(eventsResult.value) && eventsResult.value[0]?.created_at) {
    const eventDate = new Date(eventsResult.value[0].created_at);
    if (!Number.isNaN(eventDate.getTime()) && elements.lastActivity) {
      elements.lastActivity.textContent = new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit'
      }).format(eventDate).replaceAll('/', '.');
      if (elements.githubPanel) elements.githubPanel.hidden = false;
    }
  }

  if (contributionsResult.status === 'fulfilled') {
    const data = contributionsResult.value;
    const total = Number(data?.total?.lastYear);
    if (Number.isFinite(total) && Array.isArray(data?.contributions)) {
      if (elements.contributionTotal) elements.contributionTotal.textContent = total;
      if (elements.profileContributions) elements.profileContributions.textContent = total;
      if (elements.githubPanel) elements.githubPanel.hidden = false;
    }
    renderContributionCells(data?.contributions);
  } else {
    renderContributionCells([]);
  }

  const failedCount = results.filter((result) => result.status === 'rejected').length;
  if (elements.githubStatus) elements.githubStatus.textContent = '';
  if (failedCount > 0) {
    console.warn('[GitHub sync] Some public endpoints were unavailable.', { failedCount });
  }
}

function setupCursorGlow() {
  const glow = document.querySelector('#cursorGlow');
  if (!glow || !window.matchMedia('(pointer: fine)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let frame = 0;
  let x = -1000;
  let y = -1000;
  const render = () => {
    frame = 0;
    glow.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    glow.style.opacity = '1';
  };
  document.addEventListener('pointermove', (event) => {
    x = event.clientX;
    y = event.clientY;
    if (!frame) frame = window.requestAnimationFrame(render);
  }, { passive: true });
  document.documentElement.addEventListener('mouseleave', () => { glow.style.opacity = '0'; });
}

setupNavigation();
setupCursorGlow();
renderContributionCells([]);
syncGitHubData().catch((error) => {
  if (elements.githubStatus) elements.githubStatus.textContent = '';
  if (elements.githubPanel) elements.githubPanel.hidden = true;
  if (elements.projectsPanel) elements.projectsPanel.hidden = true;
  if (elements.profileNumbers) elements.profileNumbers.hidden = true;
  renderProjects(null);
  renderContributionCells([]);
  console.warn('[GitHub sync] Unable to refresh public data.', { message: error.message });
});
window.setInterval(() => {
  syncGitHubData().catch((error) => console.warn('[GitHub sync] Refresh failed.', { message: error.message }));
}, 300000);
