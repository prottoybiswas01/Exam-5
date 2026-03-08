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
const issuesGrid = document.getElementById("issues-grid");
const loadingState = document.getElementById("loading-state");
const emptyState = document.getElementById("empty-state");
const summaryTotal = document.getElementById("summary-total");
const summaryDescription = document.getElementById("summary-description");
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

function getIssuesUrl() {
  return `${getApiBase()}/issues`;
}

function getSearchUrl(query) {
  return `${getApiBase()}/issues/search?q=${encodeURIComponent(query)}`;
}

function getSingleIssueUrl(issueId) {
  return `${getApiBase()}/issue/${issueId}`;
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
  if (!localStorage.getItem(getStorageKey())) {
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

function withFallback(value) {
  if (value === undefined || value === null || value === "") return "N/A";
  return value;
}

function formatDate(dateText) {
  if (!dateText) return "N/A";

  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) return dateText;

  return date.toLocaleString();
}

function formatCompactDate(dateText) {
  if (!dateText) return "N/A";

  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) return dateText;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function capitalizeWord(value) {
  const text = String(value || "");
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
}

function formatStatusLabel(status, preferPastTense = false) {
  if (status === "open") {
    return preferPastTense ? "Opened" : "Open";
  }

  if (status === "closed") {
    return "Closed";
  }

  return capitalizeWord(status);
}

function toSlug(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeIssue(issue) {
  const labels = Array.isArray(issue.labels) ? issue.labels : [];
  const status = (issue.status || "open").toLowerCase();

  return {
    ...issue,
    status,
    labels,
    category: labels[0] || "general",
    labelText: labels.length ? labels.join(", ") : "N/A",
  };
}

function extractIssues(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function createSearchBlob(issue) {
  return [
    issue.title,
    issue.description,
    issue.author,
    issue.assignee,
    issue.priority,
    issue.status,
    issue.category,
    issue.labelText,
    ...(Array.isArray(issue.labels) ? issue.labels : []),
  ]
    .map((value) => String(withFallback(value)).toLowerCase())
    .join(" ");
}

function filterIssuesByQuery(issues, query) {
  const keyword = query.trim().toLowerCase();
  if (!keyword) return [...issues];

  return issues.filter((issue) => createSearchBlob(issue).includes(keyword));
}

function renderLabelPills(labels, className = "label-pill") {
  const safeLabels = Array.isArray(labels) && labels.length ? labels : ["general"];

  return safeLabels
    .map((label) => {
      const slug = toSlug(label) || "general";
      return `<span class="${className} label-tone-${slug}">${escapeHtml(label)}</span>`;
    })
    .join("");
}

function renderPriorityPill(priority, className = "priority-pill") {
  const safePriority = String(withFallback(priority)).toLowerCase();
  const label = safePriority === "n/a" ? "N/A" : safePriority;
  const slug = label === "N/A" ? "na" : toSlug(label) || "na";

  return `<span class="${className} priority-${slug}">${escapeHtml(label)}</span>`;
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
}

async function requestAllIssues() {
  try {
    const payload = await fetchJson(getIssuesUrl());
    return extractIssues(payload).map(normalizeIssue);
  } catch (apiError) {
    const localPayload = await fetchJson(getLocalIssuesUrl());
    return extractIssues(localPayload).map(normalizeIssue);
  }
}

async function requestSearchIssues(query) {
  try {
    const payload = await fetchJson(getSearchUrl(query));
    return extractIssues(payload).map(normalizeIssue);
  } catch (apiError) {
    const fallbackIssues = state.allIssues.length ? state.allIssues : await requestAllIssues();
    return filterIssuesByQuery(fallbackIssues, query).map(normalizeIssue);
  }
}

function applyFilters() {
  state.sourceIssues = filterIssuesByQuery(state.allIssues, state.query);

  if (state.selectedTab === "all") {
    state.visibleIssues = [...state.sourceIssues];
  } else {
    state.visibleIssues = state.sourceIssues.filter(
      (issue) => issue.status === state.selectedTab
    );
  }

  renderSummary();
  renderIssues();
}

function renderSummary() {
  const openCount = state.sourceIssues.filter((issue) => issue.status === "open").length;
  const closedCount = state.sourceIssues.filter(
    (issue) => issue.status === "closed"
  ).length;
  const visibleCount = state.visibleIssues.length;
  const issueWord = visibleCount === 1 ? "Issue" : "Issues";

  summaryTotal.textContent = `${visibleCount} ${issueWord}`;

  if (state.query.trim()) {
    summaryDescription.textContent = `Showing search results for "${state.query}"`;
  } else if (state.selectedTab === "all") {
    summaryDescription.textContent = "Track and manage your project issues";
  } else {
    summaryDescription.textContent = `Showing ${state.selectedTab} repository issues`;
  }

  openCountText.textContent = `${openCount} Open`;
  closedCountText.textContent = `${closedCount} Closed`;
}

function renderIssues(customMessage = "") {
  issuesGrid.innerHTML = "";

  if (!state.visibleIssues.length) {
    emptyState.textContent =
      customMessage ||
      (state.query.trim()
        ? "No matching issues found. Try another keyword."
        : "No issues found for the selected filter.");
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  state.visibleIssues.forEach((issue) => {
    const card = document.createElement("article");
    const statusClass = issue.status === "closed" ? "status-closed" : "status-open";
    const description = String(withFallback(issue.description));
    const shortDescription =
      description.length > 120 ? `${description.slice(0, 120)}...` : description;

    card.className = `issue-card ${statusClass}`;
    card.dataset.issueId = issue.id;
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `View details for ${issue.title}`);

    card.innerHTML = `
      <div class="card-head">
        <div>
          <p class="issue-number">Issue #${escapeHtml(issue.id)}</p>
          <h2 class="issue-link">${escapeHtml(issue.title)}</h2>
        </div>
        <span class="status-badge ${statusClass}">${escapeHtml(
          formatStatusLabel(issue.status)
        )}</span>
      </div>

      <p class="issue-description">${escapeHtml(shortDescription)}</p>

      <div class="card-meta-line">
        <span>Opened by ${escapeHtml(withFallback(issue.author))}</span>
        <span class="meta-separator" aria-hidden="true">&bull;</span>
        <span>${escapeHtml(formatCompactDate(issue.createdAt))}</span>
      </div>

      <div class="card-footer">
        <div class="label-row">
          ${renderLabelPills(issue.labels)}
        </div>
        <div class="card-trailing">
          ${renderPriorityPill(issue.priority, "priority-pill priority-pill-small")}
          <span class="details-btn">Click to view</span>
        </div>
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
  const author = escapeHtml(withFallback(issue.author));
  const assignee = escapeHtml(withFallback(issue.assignee));
  const description = escapeHtml(String(withFallback(issue.description)));

  modalContent.innerHTML = `
    <div class="modal-hero">
      <p class="modal-kicker">Issue #${escapeHtml(issue.id)}</p>
      <h2 id="modal-title">${escapeHtml(issue.title)}</h2>

      <div class="modal-meta-row">
        <span class="status-badge ${statusClass}">${escapeHtml(
          formatStatusLabel(issue.status, true)
        )}</span>
        <span class="modal-meta-separator" aria-hidden="true">&bull;</span>
        <span>Opened by ${author}</span>
        <span class="modal-meta-separator" aria-hidden="true">&bull;</span>
        <span>${escapeHtml(formatCompactDate(issue.createdAt))}</span>
      </div>

      <div class="modal-label-row">
        ${renderLabelPills(issue.labels, "modal-label-pill")}
      </div>

      <p class="modal-description">${description}</p>
    </div>

    <div class="modal-summary-panel">
      <div class="modal-summary-item">
        <p>Assignee:</p>
        <strong>${assignee}</strong>
      </div>
      <div class="modal-summary-item">
        <p>Priority:</p>
        ${renderPriorityPill(issue.priority)}
      </div>
    </div>

    <div class="modal-grid">
      <div class="modal-item">
        <p>Category</p>
        <p>${escapeHtml(issue.category)}</p>
      </div>
      <div class="modal-item">
        <p>Author</p>
        <p>${author}</p>
      </div>
      <div class="modal-item">
        <p>Labels</p>
        <p>${escapeHtml(issue.labelText)}</p>
      </div>
      <div class="modal-item">
        <p>Created</p>
        <p>${escapeHtml(formatDate(issue.createdAt))}</p>
      </div>
      <div class="modal-item">
        <p>Updated</p>
        <p>${escapeHtml(formatDate(issue.updatedAt))}</p>
      </div>
    </div>

    <div class="modal-actions">
      <button type="button" class="modal-action-btn" data-modal-close>Close</button>
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

  const existingIssue = state.allIssues.find(
    (issue) => String(issue.id) === String(issueId)
  );

  if (existingIssue) {
    renderIssueDetails(existingIssue);
    return;
  }

  try {
    const payload = await fetchJson(getSingleIssueUrl(issueId));
    renderIssueDetails(normalizeIssue(payload?.data || {}));
  } catch (error) {
    modalContent.innerHTML = `
      <div class="modal-loading">
        <p>Unable to load issue details right now.</p>
      </div>
    `;
  }
}

async function loadIssues() {
  const label = state.query.trim()
    ? `Searching issues for "${state.query}"...`
    : "Loading issues...";

  setLoading(true, label);

  try {
    state.allIssues = state.query.trim()
      ? await requestSearchIssues(state.query)
      : await requestAllIssues();

    applyFilters();
  } catch (error) {
    state.allIssues = [];
    state.sourceIssues = [];
    state.visibleIssues = [];
    renderSummary();
    renderIssues("Unable to load issues right now. Please try again.");
  } finally {
    setLoading(false);
  }
}

function registerEvents() {
  searchForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    state.query = searchInput.value.trim();
    await loadIssues();
  });

  searchInput.addEventListener("input", async () => {
    if (searchInput.value.trim() !== "" || state.query === "") return;

    state.query = "";
    await loadIssues();
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
    const trigger = event.target.closest(".issue-card[data-issue-id]");
    if (!trigger) return;

    openIssueModal(trigger.dataset.issueId);
  });

  issuesGrid.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;

    const trigger = event.target.closest(".issue-card[data-issue-id]");
    if (!trigger) return;

    event.preventDefault();
    openIssueModal(trigger.dataset.issueId);
  });

  modalCloseButton.addEventListener("click", closeModal);

  modalOverlay.addEventListener("click", (event) => {
    if (event.target.closest("[data-modal-close]")) {
      closeModal();
      return;
    }

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
  await loadIssues();
}

initialize();
