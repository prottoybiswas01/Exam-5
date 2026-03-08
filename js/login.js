const DEFAULT_CONFIG = {
  auth: {
    storageKey: "github_issues_auth",
    demoUsername: "admin",
    demoPassword: "admin123",
  },
};

const appConfig = {
  auth: { ...DEFAULT_CONFIG.auth },
};

const loginForm = document.getElementById("login-form");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const errorText = document.getElementById("auth-error");
const demoUsernameText = document.getElementById("demo-username");
const demoPasswordText = document.getElementById("demo-password");
const demoCard = document.getElementById("demo-card");

function getStorageKey() {
  return appConfig.auth.storageKey || DEFAULT_CONFIG.auth.storageKey;
}

function getDemoUsername() {
  return appConfig.auth.demoUsername || DEFAULT_CONFIG.auth.demoUsername;
}

function getDemoPassword() {
  return appConfig.auth.demoPassword || DEFAULT_CONFIG.auth.demoPassword;
}

async function loadAppConfig() {
  try {
    const response = await fetch("data/app-config.json");
    if (!response.ok) return;

    const payload = await response.json();
    const auth = payload?.auth || {};

    if (typeof auth.storageKey === "string" && auth.storageKey.trim()) {
      appConfig.auth.storageKey = auth.storageKey.trim();
    }

    if (typeof auth.demoUsername === "string" && auth.demoUsername.trim()) {
      appConfig.auth.demoUsername = auth.demoUsername.trim();
    }

    if (typeof auth.demoPassword === "string" && auth.demoPassword) {
      appConfig.auth.demoPassword = auth.demoPassword;
    }
  } catch (error) {
    // Keep defaults if config loading fails.
  }
}

function syncDemoCredentialText() {
  demoUsernameText.textContent = getDemoUsername();
  demoPasswordText.textContent = getDemoPassword();
}

function clearError() {
  errorText.textContent = "";
}

function applyDemoCredentials() {
  usernameInput.value = getDemoUsername();
  passwordInput.value = getDemoPassword();
  clearError();
  usernameInput.focus();
}

function handleLoginSubmit(event) {
  event.preventDefault();

  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  if (username !== getDemoUsername() || password !== getDemoPassword()) {
    errorText.textContent = `Invalid credential. Use ${getDemoUsername()} / ${getDemoPassword()}.`;
    return;
  }

  clearError();
  localStorage.setItem(
    getStorageKey(),
    JSON.stringify({
      username,
      loginAt: new Date().toISOString(),
    })
  );

  window.location.href = "issues.html";
}

async function initialize() {
  await loadAppConfig();
  syncDemoCredentialText();

  if (localStorage.getItem(getStorageKey())) {
    window.location.href = "issues.html";
    return;
  }

  usernameInput.addEventListener("input", clearError);
  passwordInput.addEventListener("input", clearError);

  if (demoCard) {
    demoCard.addEventListener("click", applyDemoCredentials);
    demoCard.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;

      event.preventDefault();
      applyDemoCredentials();
    });
  }

  loginForm.addEventListener("submit", handleLoginSubmit);
}

initialize();
