const API_URL = "http://localhost:5001/api/auth";

const SESSION_KEY = "rental_app_session";
const TOKEN_KEY = "rental_app_token";

// ==========================================
// HELPER: Handle API responses
// ==========================================
async function handleResponse(response) {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Something went wrong."
    );
  }

  return data;
}

// ==========================================
// REGISTER USER
// ==========================================
export async function registerUser(data) {
  const email = data.email.trim().toLowerCase();

  if (!["customer", "host"].includes(data.role)) {
    throw new Error("Invalid registration role.");
  }

  const response = await fetch(
    `${API_URL}/register`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: data.name.trim(),
        email,
        password: data.password,
        role: data.role,
      }),
    }
  );

  await handleResponse(response);

  // Log in after successful registration
  return loginUser(email, data.password);
}

// ==========================================
// LOGIN USER
// ==========================================
export async function loginUser(email, password) {
  const response = await fetch(
    `${API_URL}/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
      }),
    }
  );

  const data = await handleResponse(response);

  if (!data.token) {
    throw new Error("Authentication token missing.");
  }

  const user = data.user;

  if (!user) {
    throw new Error("User information missing.");
  }

  const session = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  // Store JWT for protected API requests
  localStorage.setItem(TOKEN_KEY, data.token);

  // Store user session for React components
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify(session)
  );

  return session;
}

// ==========================================
// GET CURRENT USER
// ==========================================
export function getCurrentUser() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
      return null;
    }

    return JSON.parse(
      localStorage.getItem(SESSION_KEY)
    );
  } catch {
    return null;
  }
}

// ==========================================
// GET AUTH TOKEN
// ==========================================
export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

// ==========================================
// LOGOUT USER
// ==========================================
export function logoutUser() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(TOKEN_KEY);
}
