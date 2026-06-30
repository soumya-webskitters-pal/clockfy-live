const headers = { 'Content-Type': 'application/json' };

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(path, { headers, ...options });
  } catch {
    throw new Error('Cannot reach backend API. Make sure the server is running on port 4000.');
  }
  if (response.status === 204) return null;
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { message: text || 'Invalid API response' };
  }
  if (!response.ok) throw new Error(data?.message || text || 'Request failed');
  return data;
}

export const api = {
  getProjects: () => request('/api/projects'),
  getUsers: () => request('/api/users'),
  login: (payload) => request('/api/users/login', { method: 'POST', body: JSON.stringify(payload) }),
  createUser: (payload) => request('/api/users', { method: 'POST', body: JSON.stringify(payload) }),
  updateUserPassword: (id, payload) => request(`/api/users/${id}/password`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteUser: (id) => request(`/api/users/${id}`, { method: 'DELETE' }),
  createProject: (payload) => request('/api/projects', { method: 'POST', body: JSON.stringify(payload) }),
  updateProject: (id, payload) => request(`/api/projects/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteProject: (id) => request(`/api/projects/${id}`, { method: 'DELETE' }),
  getEntries: () => request('/api/entries'),
  createEntry: (payload) => request('/api/entries', { method: 'POST', body: JSON.stringify(payload) }),
  updateEntry: (id, payload) => request(`/api/entries/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteEntry: (id, actorRole) => request(`/api/entries/${id}?actorRole=${encodeURIComponent(actorRole || '')}`, { method: 'DELETE' }),
  getDashboard: () => request('/api/dashboard'),
  exportData: () => request('/api/export'),
  importData: (payload) => request('/api/import', { method: 'POST', body: JSON.stringify(payload) }),
  restoreData: (payload) => request('/api/restore', { method: 'POST', body: JSON.stringify(payload) })
};
