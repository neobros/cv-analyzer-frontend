const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

function notifyAuthExpired(message) {
  clearStoredAuth();

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("auth:logout", {
      detail: { message }
    }));

    if (window.location.hash !== "#/login") {
      window.location.hash = "/login";
    }
  }
}

export function getStoredToken() {
  return localStorage.getItem("token");
}

export function setStoredAuth(auth) {
  localStorage.setItem("token", auth.token);
  localStorage.setItem("user", JSON.stringify(auth.user));
}

export function clearStoredAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function getStoredUser() {
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
}

async function request(path, options = {}) {
  const token = getStoredToken();
  const headers = { ...(options.headers || {}) };

  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    if (response.status === 401) {
      notifyAuthExpired((data && data.message) || "Session expired");
    }

    throw new Error((data && data.message) || "Request failed");
  }

  return data;
}

export function loginRequest(creds) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify(creds)
  });
}

export function fetchAnalyses() {
  return request("/analyses");
}

export function fetchOpenAiUsageMetrics(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return request(`/metrics/openai-usage${query ? `?${query}` : ""}`);
}

export function fetchAnalysisById(id) {
  return request(`/analyses/${id}`);
}

export function createAnalysisRequest(payload) {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value)) {
      formData.append(key, JSON.stringify(value));
      return;
    }
    formData.append(key, value);
  });

  return request("/analyses", {
    method: "POST",
    body: formData
  });
}

export function fetchPartners() {
  return request("/catalog/partners");
}

export function fetchCountries() {
  return request("/catalog/countries");
}

export function createCountryRequest(payload) {
  return request("/catalog/countries", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateCountryRequest(id, payload) {
  return request(`/catalog/countries/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export function fetchUsers() {
  return request("/users");
}

export function createUserRequest(payload) {
  return request("/users", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateUserRequest(id, payload) {
  return request(`/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export function fetchAiSettings() {
  return request("/settings/ai");
}

export function updateAiSettings(payload) {
  return request("/settings/ai", {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}
