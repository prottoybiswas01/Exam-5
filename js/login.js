const DEMO_CREDENTIALS = {
  username: "admin",
  password: "admin123",
};

const AUTH_KEY = "github_issues_auth";

const loginForm = document.getElementById("login-form");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const errorText = document.getElementById("auth-error");

if (localStorage.getItem(AUTH_KEY)) {
  window.location.href = "issues.html";
}

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  if (
    username !== DEMO_CREDENTIALS.username ||
    password !== DEMO_CREDENTIALS.password
  ) {
    errorText.textContent = "Invalid credential. Use admin / admin123.";
    return;
  }

  localStorage.setItem(
    AUTH_KEY,
    JSON.stringify({
      username,
      loginAt: new Date().toISOString(),
    })
  );

  window.location.href = "issues.html";
});
