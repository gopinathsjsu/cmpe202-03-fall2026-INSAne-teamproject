const API_URL = `${
  import.meta.env.VITE_API_URL || "http://localhost:5001"
}/api/auth`;

const SESSION_KEY = "rental_app_session";
const TOKEN_KEY = "rental_app_token";

const ALLOWED_ROLES = ["customer", "host", "admin"];

// ==========================================
// DECODE JWT PAYLOAD
// Does not verify JWT signature.
// The backend performs that verification.
// ==========================================
function decodeToken(token) {
  try {
    if (typeof token !== "string") {
      return null;
    }

    const parts = token.split(".");

    if (parts.length !== 3) {
      return null;
    }

    const base64 = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const padded = base64.padEnd(
      Math.ceil(base64.length / 4) * 4,
      "="
    );

    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

// ==========================================
// GET JWT EXPIRATION TIME
// Returns milliseconds since epoch.
// ==========================================
export function getTokenExpirationMs() {
  const token = localStorage.getItem(TOKEN_KEY);

  if (!token) {
    return null;
  }

  const payload = decodeToken(token);

  if (
    !payload ||
    typeof payload.exp !== "number" ||
    !Number.isFinite(payload.exp)
  ) {
    return null;
  }

  return payload.exp * 1000;
}

// ==========================================
// CHECK WHETHER TOKEN IS EXPIRED
// Invalid/malformed tokens count as expired.
// ==========================================
export function isTokenExpired() {
  const expiration = getTokenExpirationMs();

  if (expiration === null) {
    return true;
  }

  return Date.now() >= expiration;
}

// ==========================================
// LOGOUT
// ==========================================
export function logoutUser() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

// ==========================================
// HANDLE API RESPONSES
// ==========================================
async function handleResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message || "Something went wrong."
    );
  }

  return data;
}

// ==========================================
// AUTHENTICATION API REQUEST
// ==========================================
async function authRequest(path, payload) {
  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error(
      "Cannot connect to the backend. Make sure it is running on port 5001."
    );
  }

  return handleResponse(response);
}

// ==========================================
// REGISTER CUSTOMER OR HOST
// ==========================================
export async function registerUser(data) {
  const name = data.name.trim();
  const email = data.email.trim().toLowerCase();
  const password = data.password;
  const role = data.role || "customer";

  if (!["customer", "host"].includes(role)) {
    throw new Error("Invalid registration role.");
  }

  if (!name || !email || password.length < 8) {
    throw new Error(
      "Provide a name, email, and password of at least 8 characters."
    );
  }

  await authRequest("/register", {
    name,
    email,
    password,
    role,
  });

  // Log in after registration.
  return loginUser(email, password);
}

// ==========================================
// LOGIN
// ==========================================
export async function loginUser(email, password) {
  const data = await authRequest("/login", {
    email: email.trim().toLowerCase(),
    password,
  });

  if (!data.token || !data.user) {
    throw new Error(
      "Authentication token or user information missing."
    );
  }

  const expirationPayload = decodeToken(data.token);

  if (
    !expirationPayload ||
    typeof expirationPayload.exp !== "number" ||
    !Number.isFinite(expirationPayload.exp) ||
    Date.now() >= expirationPayload.exp * 1000
  ) {
    throw new Error(
      "The server returned an invalid or expired session."
    );
  }

  const user = data.user;

  if (!ALLOWED_ROLES.includes(user.role)) {
    throw new Error("Invalid account role.");
  }

  const session = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  // Store JWT and session.
  localStorage.setItem(TOKEN_KEY, data.token);

  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify(session)
  );

  return session;
}

// ==========================================
// GET CURRENT USER
// Clear the session if the JWT is expired.
// ==========================================
export function getCurrentUser() {
  const token = localStorage.getItem(TOKEN_KEY);
  const storedSession =
    localStorage.getItem(SESSION_KEY);

  if (!token || !storedSession || isTokenExpired()) {
    logoutUser();
    return null;
  }

  try {
    const user = JSON.parse(storedSession);

    if (
      !user ||
      typeof user !== "object" ||
      !ALLOWED_ROLES.includes(user.role) ||
      !user.id
    ) {
      logoutUser();
      return null;
    }

    return user;
  } catch {
    logoutUser();
    return null;
  }
}

// ==========================================
// GET AUTH TOKEN
// Do not send expired JWTs to the backend.
// ==========================================
export function getAuthToken() {
  const token = localStorage.getItem(TOKEN_KEY);

  if (!token || isTokenExpired()) {
    logoutUser();
    return null;
  }

  return token;
}
