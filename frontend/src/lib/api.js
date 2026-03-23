export function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("userEmail");
}

export function getAuthHeaders(extraHeaders = {}) {
  const token = localStorage.getItem("token");

  return {
    ...extraHeaders,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function authenticatedFetch(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: getAuthHeaders(options.headers || {}),
  });

  if (response.status === 401 || response.status === 403) {
    clearAuth();
    window.location.reload();
    throw new Error("Your session expired. Please sign in again.");
  }

  return response;
}

export async function getReminders() {
  const response = await authenticatedFetch("/api/reminders");
  if (!response.ok) {
    throw new Error("Failed to load reminders.");
  }
  return response.json();
}

export async function createReminder(payload) {
  const response = await authenticatedFetch("/api/reminders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to create reminder.");
  }

  return data;
}

export async function updateReminder(id, payload) {
  const response = await authenticatedFetch(`/api/reminders/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to update reminder.");
  }

  return data;
}

export async function deleteReminder(id) {
  const response = await authenticatedFetch(`/api/reminders/${id}`, {
    method: "DELETE",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to delete reminder.");
  }

  return data;
}