
const USERS_KEY = "rental_app_users";
const SESSION_KEY = "rental_app_session";

const demoUsers = [
  {
    id: 1,
    name: "Demo Customer",
    email: "customer@demo.com",
    password: "Customer123!",
    role: "customer",
  },
  {
    id: 2,
    name: "Demo Host",
    email: "host@demo.com",
    password: "Host123!",
    role: "host",
  },
  {
    id: 3,
    name: "Demo Admin",
    email: "admin@demo.com",
    password: "Admin123!",
    role: "admin",
  },
];

function getUsers() {
  const stored = localStorage.getItem(USERS_KEY);

  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      localStorage.removeItem(USERS_KEY);
    }
  }

  localStorage.setItem(USERS_KEY, JSON.stringify(demoUsers));
  return demoUsers;
}

export function registerUser(data) {
  const users = getUsers();

  const email = data.email.trim().toLowerCase();

  if (users.some((user) => user.email === email)) {
    throw new Error("An account with this email already exists.");
  }

  if (!["customer", "host"].includes(data.role)) {
    throw new Error("Invalid registration role.");
  }

  const newUser = {
    id: crypto.randomUUID(),
    name: data.name.trim(),
    email,
    password: data.password,
    role: data.role,
  };

  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));

  return loginUser(email, data.password);
}

export function loginUser(email, password) {
  const users = getUsers();

  const user = users.find(
    (account) =>
      account.email === email.trim().toLowerCase() &&
      account.password === password
  );

  if (!user) {
    throw new Error("Invalid email or password.");
  }

  const session = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

export function logoutUser() {
  localStorage.removeItem(SESSION_KEY);
}
