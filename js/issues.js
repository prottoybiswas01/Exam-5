const DEFAULT_CONFIG = {
  auth: {
    storageKey: "github_issues_auth",
  },
  api: {
    baseUrl: "https://phi-lab-server.vercel.app/api/v1/lab",
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
  isLoading: false,
  lastFocusedElement: null,
};

const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const searchSubmitButton = searchForm.querySelector(".search-btn");
const tabButtons = document.querySelectorAll(".tab-btn");
const issuesGrid = document.getElementById("issues-grid");
const loadingState = document.getElementById("loading-state");
const emptyState = document.getElementById("empty-state");
const summaryTotal = document.getElementById("summary-total");
const summaryDescription = document.getElementById("summary-description");
const openCountText = document.getElementById("open-count");
const closedCountText = document.getElementById("closed-count");
const modalOverlay = document.getElementById("modal-overlay");
const modalContent = document.getElementById("modal-content");

function getStorageKey() {
  return appConfig.auth.storageKey || DEFAULT_CONFIG.auth.storageKey;
}

function getApiBase() {
  return appConfig.api.baseUrl || DEFAULT_CONFIG.api.baseUrl;
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
  state.isLoading = isLoading;
  searchForm.setAttribute("aria-busy", String(isLoading));
  searchSubmitButton.disabled = isLoading;
  searchSubmitButton.textContent = label.startsWith("Searching") ? "Searching..." : "Search";

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

function formatCardDate(dateText) {
  if (!dateText) return "N/A";

  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) return dateText;

  return new Intl.DateTimeFormat("en-US", {
    month: "numeric",
    day: "numeric",
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

function getStatusIcon(status) {
  if (status === "closed") {
    return `
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.8"></circle>
        <circle cx="10" cy="10" r="2.2" fill="currentColor"></circle>
      </svg>
    `;
  }

  return `
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.8"></circle>
      <path
        d="M10 6V10L12.7 12"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      ></path>
    </svg>
  `;
}

function getLabelIcon(label) {
  const slug = toSlug(label);

  if (slug === "bug") {
    return `
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path
          d="M6.4 7.1C6.4 5.1 8 3.5 10 3.5C12 3.5 13.6 5.1 13.6 7.1V12.2C13.6 14.2 12 15.8 10 15.8C8 15.8 6.4 14.2 6.4 12.2V7.1Z"
          stroke="currentColor"
          stroke-width="1.6"
        ></path>
        <path d="M7 6L5.2 4.6M13 6L14.8 4.6M6 9H4M16 9H14M6.3 12.2L4.8 13.4M13.7 12.2L15.2 13.4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"></path>
      </svg>
    `;
  }

  if (slug === "help-wanted") {
    return `
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="6.8" stroke="currentColor" stroke-width="1.6"></circle>
        <path d="M10 6.5V13.5M6.5 10H13.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path>
      </svg>
    `;
  }

  if (slug === "enhancement") {
    return `
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M10 3.8L11.5 8.5L16.2 10L11.5 11.5L10 16.2L8.5 11.5L3.8 10L8.5 8.5L10 3.8Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"></path>
      </svg>
    `;
  }

  if (slug === "documentation") {
    return `
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M6 3.8H11.5L14.2 6.5V16.2H6V3.8Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"></path>
        <path d="M11.2 3.8V6.8H14.2" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"></path>
      </svg>
    `;
  }

  return `
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="6.8" stroke="currentColor" stroke-width="1.6"></circle>
    </svg>
  `;
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
      return `
        <span class="${className} label-tone-${slug}">
          <span class="label-pill-icon">${getLabelIcon(label)}</span>
          <span>${escapeHtml(label)}</span>
        </span>
      `;
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
  const payload = await fetchJson(getIssuesUrl());
  return extractIssues(payload).map(normalizeIssue);
}

async function requestSearchIssues(query) {
  const payload = await fetchJson(getSearchUrl(query));
  return extractIssues(payload).map(normalizeIssue);
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
    const message =
      customMessage ||
      (state.query.trim()
        ? "No matching issues found. Try another keyword."
        : "No issues found for the selected filter.");
    emptyState.textContent = message;
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");
  emptyState.textContent = "";

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
      <div class="card-content">
        <div class="card-topline">
          <span class="status-marker ${statusClass}">
            ${getStatusIcon(issue.status)}
          </span>
          ${renderPriorityPill(issue.priority, "priority-pill priority-pill-small")}
        </div>

        <h2 class="issue-link">${escapeHtml(issue.title)}</h2>
        <p class="issue-description">${escapeHtml(shortDescription)}</p>

        <div class="label-row">
          ${renderLabelPills(issue.labels)}
        </div>
      </div>

      <div class="card-footer">
        <p class="card-meta-text">#${escapeHtml(issue.id)} by ${escapeHtml(
          withFallback(issue.author)
        )}</p>
        <p class="card-meta-text">${escapeHtml(formatCardDate(issue.createdAt))}</p>
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

  if (state.lastFocusedElement && typeof state.lastFocusedElement.focus === "function") {
    state.lastFocusedElement.focus();
  }

  state.lastFocusedElement = null;
}

function getModalFocusableElements() {
  return Array.from(
    modalOverlay.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
  ).filter((element) => !element.disabled && !element.classList.contains("hidden"));
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

    <div class="modal-actions">
      <button type="button" class="modal-action-btn" data-modal-close>Close</button>
    </div>
  `;

  const modalActionButton = modalContent.querySelector("[data-modal-close]");
  if (modalActionButton) {
    modalActionButton.focus();
  }
}

async function openIssueModal(issueId, triggerElement) {
  state.lastFocusedElement = triggerElement || document.activeElement;

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

  searchInput.addEventListener("keydown", async (event) => {
    if (event.key !== "Escape") return;
    if (searchInput.value.trim() === "" && state.query === "") return;

    event.preventDefault();
    searchInput.value = "";

    if (state.query === "") return;

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

    openIssueModal(trigger.dataset.issueId, trigger);
  });

  issuesGrid.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;

    const trigger = event.target.closest(".issue-card[data-issue-id]");
    if (!trigger) return;

    event.preventDefault();
    openIssueModal(trigger.dataset.issueId, trigger);
  });

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

  modalOverlay.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;

    const focusableElements = getModalFocusableElements();
    if (!focusableElements.length) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
      return;
    }

    if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
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
