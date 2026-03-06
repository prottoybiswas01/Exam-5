const DEFAULT_CONFIG = {
  auth: {
    storageKey: "github_issues_auth",
  },
  api: {
    baseUrl: "https://phi-lab-server.vercel.app/api/v1/lab",
    localIssuesUrl: "data/issues.json",
  },
};

const appConfig = {
  auth: { ...DEFAULT_CONFIG.auth },
  api: { ...DEFAULT_CONFIG.api },
};

const state = {
  selectedTab: "all",
  query: "",
  allIssues: [],
  sourceIssues: [],
  visibleIssues: [],
};

const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const tabButtons = document.querySelectorAll(".tab-btn");
const logoutButton = document.getElementById("logout-btn");
const issuesGrid = document.getElementById("issues-grid");
const loadingState = document.getElementById("loading-state");
const emptyState = document.getElementById("empty-state");
const summaryText = document.getElementById("summary-text");
const openCountText = document.getElementById("open-count");
const closedCountText = document.getElementById("closed-count");

const modalOverlay = document.getElementById("modal-overlay");
const modalCloseButton = document.getElementById("modal-close");
const modalContent = document.getElementById("modal-content");

function getStorageKey() {
  return appConfig.auth.storageKey || DEFAULT_CONFIG.auth.storageKey;
}

function getApiBase() {
  return appConfig.api.baseUrl || DEFAULT_CONFIG.api.baseUrl;
}

function getLocalIssuesUrl() {
  return appConfig.api.localIssuesUrl || DEFAULT_CONFIG.api.localIssuesUrl;
}

async function loadAppConfig() {
  try {
    const response = await fetch("data/app-config.json");
    if (!response.ok) return;

    const payload = await response.json();
    const auth = payload?.auth || {};
    const api = payload?.api || {};

    if (typeof auth.storageKey === "string" && auth.storageKey.trim()) {
      appConfig.auth.storageKey = auth.storageKey.trim();
    }

    if (typeof api.baseUrl === "string" && api.baseUrl.trim()) {
      appConfig.api.baseUrl = api.baseUrl.trim();
    }

    if (typeof api.localIssuesUrl === "string" && api.localIssuesUrl.trim()) {
      appConfig.api.localIssuesUrl = api.localIssuesUrl.trim();
    }
  } catch (error) {
    // Keep defaults if config loading fails.
  }
}

function ensureAuth() {
  const auth = localStorage.getItem(getStorageKey());

  if (!auth) {
    window.location.href = "index.html";
  }
}

function setLoading(isLoading, label = "Loading issues...") {
  if (isLoading) {
    loadingState.classList.remove("hidden");
    issuesGrid.classList.add("hidden");
    emptyState.classList.add("hidden");
    loadingState.querySelector("p").textContent = label;
    return;
  }

  loadingState.classList.add("hidden");
  issuesGrid.classList.remove("hidden");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(dateText) {
  if (!dateText) return "N/A";

  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) return dateText;

  return date.toLocaleString();
}

function normalizeIssue(issue) {
  const labels = Array.isArray(issue.labels) ? issue.labels : [];
  const status = (issue.status || "open").toLowerCase();

  return {
    ...issue,
    status,
    category: labels[0] || "general",
    labelText: labels.length ? labels.join(", ") : "N/A",
  };
}

function withFallback(value) {
  if (value === undefined || value === null || value === "") return "N/A";
  return value;
}

function extractIssues(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function createSearchBlob(issue) {
  const labels = Array.isArray(issue.labels) ? issue.labels.join(" ") : "";
  return [
    issue.title,
    issue.description,
    issue.author,
    issue.assignee,
    issue.priority,
    issue.status,
    issue.category,
    issue.labelText,
    labels,
  ]
    .map((value) => String(withFallback(value)).toLowerCase())
    .join(" ");
}

function filterIssuesByQuery(issues, query) {
  const keyword = query.trim().toLowerCase();
  if (!keyword) return [...issues];

  return issues.filter((issue) => createSearchBlob(issue).includes(keyword));
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json();
}

async function loadInitialIssues() {
  setLoading(true);

  try {
    const localPayload = await fetchJson(getLocalIssuesUrl());
    const localIssues = extractIssues(localPayload).map(normalizeIssue);
    if (!localIssues.length) {
      throw new Error("Local JSON has no issues");
    }

    state.allIssues = localIssues;
    applyFilters();
  } catch (localError) {
    try {
      const apiPayload = await fetchJson(`${getApiBase()}/issues`);
      state.allIssues = extractIssues(apiPayload).map(normalizeIssue);
      applyFilters();
    } catch (apiError) {
      state.allIssues = [];
      state.sourceIssues = [];
      state.visibleIssues = [];
      renderSummary();
      renderIssues("Unable to load issues. Please try again.");
    }
  } finally {
    setLoading(false);
  }
}

function applyFilters() {
  state.sourceIssues = filterIssuesByQuery(state.allIssues, state.query);

  const selected = state.selectedTab;
  if (selected === "all") {
    state.visibleIssues = [...state.sourceIssues];
  } else {
    state.visibleIssues = state.sourceIssues.filter(
      (issue) => issue.status === selected
    );
  }

  renderSummary();
  renderIssues();
}

function renderSummary() {
  const openCount = state.sourceIssues.filter(
    (issue) => issue.status === "open"
  ).length;
  const closedCount = state.sourceIssues.filter(
    (issue) => issue.status === "closed"
  ).length;

  const issueWord = state.visibleIssues.length === 1 ? "issue" : "issues";
  const scopeText =
    state.selectedTab === "all" ? "all issues" : `${state.selectedTab} issues`;
  const queryText = state.query.trim() ? " from search results" : "";

  summaryText.textContent = `${state.visibleIssues.length} ${issueWord} in ${scopeText}${queryText}`;
  openCountText.textContent = `${openCount} Open`;
  closedCountText.textContent = `${closedCount} Closed`;
}

function renderIssues(customMessage = "") {
  issuesGrid.innerHTML = "";

  if (!state.visibleIssues.length) {
    const message =
      customMessage ||
      (state.query.trim()
        ? "No matching issues found. Try a different keyword."
        : "No issues found for the selected filter.");
    emptyState.textContent = message;
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  state.visibleIssues.forEach((issue) => {
    const card = document.createElement("article");
    const statusClass = issue.status === "closed" ? "status-closed" : "status-open";
    card.className = `issue-card ${statusClass}`;

    const description = String(withFallback(issue.description));
    const shortDescription =
      description.length > 130
        ? `${description.slice(0, 130)}...`
        : description;

    card.innerHTML = `
      <div class="card-head">
        <button class="issue-link" data-issue-id="${issue.id}">
          ${escapeHtml(issue.title)}
        </button>
        <span class="status-badge ${statusClass}">
          ${escapeHtml(issue.status)}
        </span>
      </div>

      <p class="issue-description">${escapeHtml(shortDescription)}</p>

      <div class="meta-grid">
        <p class="meta-item"><span>Status</span>${escapeHtml(issue.status)}</p>
        <p class="meta-item"><span>Category</span>${escapeHtml(issue.category)}</p>
        <p class="meta-item"><span>Author</span>${escapeHtml(withFallback(issue.author))}</p>
        <p class="meta-item"><span>Priority</span>${escapeHtml(withFallback(issue.priority))}</p>
        <p class="meta-item"><span>Label</span>${escapeHtml(issue.labelText)}</p>
        <p class="meta-item"><span>CreatedAt</span>${escapeHtml(
          formatDate(issue.createdAt)
        )}</p>
      </div>

      <div class="card-footer">
        <span class="label-pill">${escapeHtml(issue.labelText)}</span>
        <button class="details-btn" type="button" data-issue-id="${issue.id}">
          View Issue
        </button>
      </div>
    `;

    issuesGrid.append(card);
  });
}

function setActiveTab() {
  tabButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.tab === state.selectedTab);
  });
}

function openModalShell() {
  modalOverlay.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  modalOverlay.classList.add("hidden");
  modalContent.innerHTML = "";
  document.body.style.overflow = "";
}

function renderIssueDetails(issue) {
  const statusClass = issue.status === "closed" ? "status-closed" : "status-open";
  const safeDescription = String(withFallback(issue.description));

  modalContent.innerHTML = `
    <h2>${escapeHtml(issue.title)}</h2>
    <p class="modal-description">${escapeHtml(safeDescription)}</p>

    <div class="modal-grid">
      <div class="modal-item">
        <p>ID</p>
        <p>${escapeHtml(issue.id)}</p>
      </div>
      <div class="modal-item">
        <p>Status</p>
        <p><span class="status-badge ${statusClass}">${escapeHtml(issue.status)}</span></p>
      </div>
      <div class="modal-item">
        <p>Category</p>
        <p>${escapeHtml(issue.category)}</p>
      </div>
      <div class="modal-item">
        <p>Author</p>
        <p>${escapeHtml(withFallback(issue.author))}</p>
      </div>
      <div class="modal-item">
        <p>Assignee</p>
        <p>${escapeHtml(withFallback(issue.assignee))}</p>
      </div>
      <div class="modal-item">
        <p>Priority</p>
        <p>${escapeHtml(withFallback(issue.priority))}</p>
      </div>
      <div class="modal-item">
        <p>Label</p>
        <p>${escapeHtml(issue.labelText)}</p>
      </div>
      <div class="modal-item">
        <p>CreatedAt</p>
        <p>${escapeHtml(formatDate(issue.createdAt))}</p>
      </div>
      <div class="modal-item">
        <p>UpdatedAt</p>
        <p>${escapeHtml(formatDate(issue.updatedAt))}</p>
      </div>
    </div>
  `;
}

async function openIssueModal(issueId) {
  openModalShell();

  modalContent.innerHTML = `
    <div class="modal-loading">
      <div class="spinner" aria-hidden="true"></div>
      <p>Loading issue details...</p>
    </div>
  `;

  const selectedIssue = state.allIssues.find(
    (issue) => String(issue.id) === String(issueId)
  );

  if (selectedIssue) {
    renderIssueDetails(selectedIssue);
    return;
  }

  try {
    const payload = await fetchJson(`${getApiBase()}/issue/${issueId}`);
    const issue = normalizeIssue(payload.data || {});
    renderIssueDetails(issue);
  } catch (error) {
    modalContent.innerHTML = `
      <div class="modal-loading">
        <p>Unable to load issue details right now.</p>
      </div>
    `;
  }
}

function registerEvents() {
  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    state.query = searchInput.value.trim();
    applyFilters();
  });

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const nextTab = button.dataset.tab;
      if (nextTab === state.selectedTab) return;

      state.selectedTab = nextTab;
      setActiveTab();
      applyFilters();
    });
  });

  issuesGrid.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-issue-id]");
    if (!trigger) return;
    openIssueModal(trigger.dataset.issueId);
  });

  logoutButton.addEventListener("click", () => {
    localStorage.removeItem(getStorageKey());
    window.location.href = "index.html";
  });

  modalCloseButton.addEventListener("click", closeModal);

  modalOverlay.addEventListener("click", (event) => {
    if (event.target === modalOverlay) {
      closeModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modalOverlay.classList.contains("hidden")) {
      closeModal();
    }
  });
}

async function initialize() {
  await loadAppConfig();
  ensureAuth();
  registerEvents();
  setActiveTab();
  loadInitialIssues();
}

initialize();
