"use strict";

const loginForm = document.querySelector("#login-form");
const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const passwordToggle = document.querySelector("#toggle-password");
const message = document.querySelector("#form-message");

// Client-side validation/logic

// Validates the credentials
function validateCredentials(email, password) {
  const errors = [];

  if (email.trim() === "") {
    errors.push("Email is required.");
  } else if (!email.includes("@")) {
    errors.push('Email must contain "@".');
  }

  if (password === "") {
    errors.push("Password is required.");
  } else if (password.length < 8) {
    errors.push("Password must be at least 8 characters.");
  }

  return errors;
}

// Shows or hides password
passwordToggle.addEventListener("click", () => {
  const shouldReveal = passwordInput.type === "password";
  passwordInput.type = shouldReveal ? "text" : "password";
  passwordToggle.textContent = shouldReveal ? "Hide" : "Show";
  passwordToggle.setAttribute("aria-pressed", String(shouldReveal));
});

// Handles field validation and sends them to the server for further validation
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const credentials = {
    email: emailInput.value,
    password: passwordInput.value,
  };
  const errors = validateCredentials(credentials.email, credentials.password);

  if (errors.length > 0) {
    message.textContent = errors.join(" ");
    return;
  }

  message.textContent = "Checking your input...";

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    const result = await response.json();

    if (!response.ok) {
      if (!Array.isArray(result.errors) || result.errors.length === 0) {
        throw new Error("The validation server returned an invalid response.");
      }
      message.textContent = result.errors.join(" ");
      return;
    }

    if (result.valid !== true || typeof result.message !== "string") {
      throw new Error("The validation server returned an invalid response.");
    }
    message.textContent = result.message;
  } catch (error) {
    console.error("Login validation request failed:", error);
    message.textContent =
      "Could not reach the validation server. Start it with `npm start` and try again.";
  }
});