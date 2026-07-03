const AIRTABLE_BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID || 'appLFfeTpwkYcWOrn';
const AIRTABLE_TOKEN = import.meta.env.VITE_AIRTABLE_TOKEN || '';
const AIRTABLE_API = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`;

const TABLES = {
  users: 'Users',
  projects: 'Projects',
  entries: 'Time Entries',
  clients: 'Clients'
};

const starterUsers = [
  { id: 'admin', name: 'Admin', loginId: 'admin', password: 'admin123', role: 'admin', color: '#111827' },
  { id: 'user-soumya', name: 'Soumya', loginId: 'soumya', password: 'user123', role: 'user', color: '#009688' },
  { id: 'user-vishal', name: 'Vishal', loginId: 'vishal', password: 'user123', role: 'user', color: '#5264d8' },
  { id: 'user-priya', name: 'Priya', loginId: 'priya', password: 'user123', role: 'user', color: '#f59e0b' }
];

const starterProjects = [
  { id: 'project-legend', name: 'Legend Website - Vish Project: Webflow', color: '#009688', favorite: true, pinned: true },
  { id: 'project-tradeify', name: 'Tradeify - Vish: Webflow', color: '#5264d8', favorite: false, pinned: false }
];

const timeEditorRoles = new Set(['admin', 'super-user']);

let usersSeedPromise = null;
let projectsSeedPromise = null;

function requireToken() {
  if (!AIRTABLE_TOKEN) {
    throw new Error('Add VITE_AIRTABLE_TOKEN to clockfy/client/.env to connect Airtable.');
  }
}

function airtableUrl(tableName, recordId = '') {
  const [name, query = ''] = tableName.split('?');
  const encodedTable = encodeURIComponent(name);
  const suffix = query ? `?${query}` : '';
  return `${AIRTABLE_API}/${encodedTable}${recordId ? `/${recordId}` : ''}${suffix}`;
}

async function airtableRequest(tableName, options = {}, recordId = '') {
  requireToken();
  const response = await fetch(airtableUrl(tableName, recordId), {
    ...options,
    headers: {
      Authorization: `Bearer ${AIRTABLE_TOKEN}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(data?.error?.message || data?.message || 'Airtable request failed');
  }
  return data;
}

async function listRecords(tableName) {
  const records = [];
  let offset = '';
  do {
    const query = offset ? `?offset=${encodeURIComponent(offset)}` : '';
    const data = await airtableRequest(`${tableName}${query}`);
    records.push(...(data.records || []));
    offset = data.offset || '';
  } while (offset);
  return records;
}

async function createRecord(tableName, fields) {
  const data = await airtableRequest(tableName, {
    method: 'POST',
    body: JSON.stringify({ fields })
  });
  return data;
}

async function updateRecord(tableName, recordId, fields) {
  const data = await airtableRequest(tableName, {
    method: 'PATCH',
    body: JSON.stringify({ fields })
  }, recordId);
  return data;
}

async function deleteRecord(tableName, recordId) {
  await airtableRequest(tableName, { method: 'DELETE' }, recordId);
}

function durationSeconds(startTime, endTime) {
  if (!startTime || !endTime) return 0;
  return Math.max(0, Math.round((new Date(endTime) - new Date(startTime)) / 1000));
}

function toDateKey(value = new Date()) {
  return new Date(value).toISOString().slice(0, 10);
}

function weekStart() {
  const date = new Date();
  const day = date.getDay();
  date.setDate(date.getDate() - day + (day === 0 ? -6 : 1));
  date.setHours(0, 0, 0, 0);
  return date;
}

function monthStart() {
  const date = new Date();
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
}

function projectNameKey(name) {
  return String(name || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function clientNameKey(name) {
  return String(name || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function normalizeSubtasks(subtasks) {
  const values = Array.isArray(subtasks)
    ? subtasks
    : String(subtasks || '')
      .split(/\n|,/);
  const seen = new Set();
  return values
    .map((item) => String(item || '').trim().replace(/\s+/g, ' '))
    .filter(Boolean)
    .filter((item) => {
      const key = item.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function duplicateSubtaskName(subtasks) {
  const seen = new Set();
  const values = Array.isArray(subtasks)
    ? subtasks
    : String(subtasks || '')
      .split(/\n|,/);
  for (const item of values) {
    const key = String(item || '').trim().replace(/\s+/g, ' ').toLowerCase();
    if (!key) continue;
    if (seen.has(key)) return key;
    seen.add(key);
  }
  return '';
}

function parseSubtasks(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return normalizeSubtasks(parsed);
  } catch {
    return normalizeSubtasks(value);
  }
}

function slugifyLoginId(value) {
  return String(value || 'user')
    .trim()
    .toLowerCase()
    .replace(/@.*$/, '')
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .slice(0, 28) || 'user';
}

function uniqueLoginId(baseValue, users, currentId) {
  const base = slugifyLoginId(baseValue);
  const used = new Set(
    users
      .filter((user) => user.id !== currentId)
      .map((user) => String(user.loginId || '').toLowerCase())
  );
  let candidate = base;
  let count = 2;
  while (used.has(candidate.toLowerCase())) {
    candidate = `${base}${count}`;
    count += 1;
  }
  return candidate;
}

function randomId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function randomPassword() {
  return `Clockfy-${Math.random().toString(36).slice(2, 8)}${Math.floor(10 + Math.random() * 90)}`;
}

function normalizeUser(user, existingUsers = []) {
  const safeName = user.name || 'User';
  const loginId = user.loginId || safeName;
  return {
    id: user.id || randomId('user'),
    recordId: user.recordId || null,
    name: safeName,
    loginId: uniqueLoginId(loginId, existingUsers, user.id),
    password: user.password || 'user123',
    role: user.role || 'user',
    color: user.color || '#25baeb',
    createdAt: user.createdAt || new Date().toISOString()
  };
}

function userFromRecord(record) {
  const fields = record.fields || {};
  return normalizeUser({
    id: fields['User ID'] || record.id,
    recordId: record.id,
    name: fields.Name,
    loginId: fields['Login ID'],
    password: fields.Password,
    role: fields.Role,
    color: fields.Color,
    createdAt: fields['Created At']
  });
}

function userToFields(user) {
  return {
    Name: user.name,
    'User ID': user.id,
    'Login ID': user.loginId,
    Password: user.password,
    Role: user.role,
    Color: user.color,
    'Created At': user.createdAt
  };
}

function uniqueUsers(users) {
  const seen = new Set();
  return users.filter((user) => {
    const key = `${user.id}:${user.loginId}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeProject(project) {
  return {
    id: project.id || randomId('project'),
    recordId: project.recordId || null,
    name: String(project.name || 'Untitled project').trim().replace(/\s+/g, ' '),
    clientId: project.clientId || '',
    clientName: project.clientName || '',
    subtasks: normalizeSubtasks(project.subtasks),
    color: project.color || '#25baeb',
    favorite: Boolean(project.favorite),
    pinned: Boolean(project.pinned),
    updatedAt: project.updatedAt || new Date().toISOString()
  };
}

function projectFromRecord(record) {
  const fields = record.fields || {};
  return normalizeProject({
    id: fields['Project ID'] || record.id,
    recordId: record.id,
    name: fields.Name,
    clientId: fields['Client ID'],
    clientName: fields['Client Name'],
    subtasks: parseSubtasks(fields.Subtasks),
    color: fields.Color,
    favorite: fields.Favorite,
    pinned: fields.Pinned,
    updatedAt: fields['Updated At']
  });
}

function projectToFields(project) {
  return {
    Name: project.name,
    'Project ID': project.id,
    'Client ID': project.clientId || '',
    'Client Name': project.clientName || '',
    Subtasks: JSON.stringify(project.subtasks || []),
    Color: project.color,
    Favorite: project.favorite,
    Pinned: project.pinned,
    'Updated At': project.updatedAt
  };
}

function normalizeClient(client) {
  return {
    id: client.id || randomId('client'),
    recordId: client.recordId || null,
    name: String(client.name || 'Untitled client').trim().replace(/\s+/g, ' '),
    updatedAt: client.updatedAt || new Date().toISOString()
  };
}

function clientFromRecord(record) {
  const fields = record.fields || {};
  return normalizeClient({
    id: fields['Client ID'] || record.id,
    recordId: record.id,
    name: fields.Name,
    updatedAt: fields['Updated At']
  });
}

function clientToFields(client) {
  return {
    Name: client.name,
    'Client ID': client.id,
    'Updated At': client.updatedAt
  };
}

function uniqueClients(clients) {
  const seen = new Set();
  return clients.filter((client) => {
    const key = `${client.id}:${clientNameKey(client.name)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function uniqueProjects(projects) {
  const seen = new Set();
  return projects.filter((project) => {
    const key = `${project.id}:${projectNameKey(project.name)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeEntry(entry) {
  const startTime = entry.startTime || new Date().toISOString();
  const endTime = entry.endTime || '';
  return {
    id: entry.id || randomId('entry'),
    recordId: entry.recordId || null,
    userId: entry.userId,
    userName: entry.userName || '',
    projectId: entry.projectId,
    projectName: entry.projectName || '',
    projectColor: entry.projectColor || '#25baeb',
    startTime,
    endTime,
    duration: Number.isFinite(Number(entry.duration)) ? Number(entry.duration) : durationSeconds(startTime, endTime),
    date: entry.date || toDateKey(startTime),
    notes: entry.notes || '',
    status: entry.status || (endTime ? 'stopped' : 'running'),
    updatedAt: entry.updatedAt || new Date().toISOString()
  };
}

function entryFromRecord(record) {
  const fields = record.fields || {};
  return normalizeEntry({
    id: fields['Entry ID'] || record.id,
    recordId: record.id,
    userId: fields['User ID'],
    userName: fields['User Name'],
    projectId: fields['Project ID'],
    projectName: fields['Project Name'],
    projectColor: fields['Project Color'],
    startTime: fields['Start Time'],
    endTime: fields['End Time'],
    duration: fields.Duration,
    date: fields.Date,
    notes: fields.Notes,
    status: fields.Status,
    updatedAt: fields['Updated At']
  });
}

function entryToFields(entry) {
  return {
    Name: `${entry.projectName || 'Timer'} - ${entry.userName || 'User'} - ${entry.date}`,
    'Entry ID': entry.id,
    'User ID': entry.userId,
    'User Name': entry.userName,
    'Project ID': entry.projectId,
    'Project Name': entry.projectName,
    'Project Color': entry.projectColor,
    'Start Time': entry.startTime,
    'End Time': entry.endTime || null,
    Duration: entry.duration,
    Date: entry.date,
    Notes: entry.notes,
    Status: entry.status,
    'Updated At': entry.updatedAt
  };
}

async function getUsers() {
  const users = uniqueUsers((await listRecords(TABLES.users)).map(userFromRecord));
  if (users.length) return users;
  usersSeedPromise ||= Promise.all(starterUsers.map((user) => createRecord(TABLES.users, userToFields(normalizeUser(user)))));
  await usersSeedPromise;
  usersSeedPromise = null;
  return uniqueUsers((await listRecords(TABLES.users)).map(userFromRecord));
}

async function getProjects() {
  const projects = uniqueProjects((await listRecords(TABLES.projects)).map(projectFromRecord));
  if (projects.length) return projects;
  const now = new Date().toISOString();
  projectsSeedPromise ||= Promise.all(starterProjects.map((project) => createRecord(TABLES.projects, projectToFields(normalizeProject({ ...project, updatedAt: now })))));
  await projectsSeedPromise;
  projectsSeedPromise = null;
  return uniqueProjects((await listRecords(TABLES.projects)).map(projectFromRecord));
}

async function getClients() {
  return uniqueClients((await listRecords(TABLES.clients)).map(clientFromRecord))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function getEntries() {
  return (await listRecords(TABLES.entries))
    .map(entryFromRecord)
    .sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
}

function sum(entries) {
  return entries.reduce((total, entry) => total + Number(entry.duration || 0), 0);
}

function buildSeries(entries, days) {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - index));
    const key = toDateKey(date);
    return { date: key, total: sum(entries.filter((entry) => entry.date === key)) };
  });
}

async function getDashboard() {
  const [entries, projects] = await Promise.all([getEntries(), getProjects()]);
  const today = toDateKey();
  const week = weekStart();
  const month = monthStart();
  return {
    todayTotal: sum(entries.filter((entry) => entry.date === today)),
    weekTotal: sum(entries.filter((entry) => new Date(entry.startTime) >= week)),
    monthTotal: sum(entries.filter((entry) => new Date(entry.startTime) >= month)),
    totalProjects: projects.length,
    weeklySeries: buildSeries(entries, 7),
    monthlySeries: buildSeries(entries, 30)
  };
}

async function login({ loginId, password }) {
  const cleanLoginId = String(loginId || '').trim().toLowerCase();
  const cleanPassword = String(password || '').trim();
  const user = (await getUsers()).find((item) => (
    item.loginId.toLowerCase() === cleanLoginId && item.password === cleanPassword
  ));
  if (!user) throw new Error('Invalid login ID or password');
  return user;
}

async function createUser({ name }) {
  const cleanName = String(name || '').trim();
  if (!cleanName) throw new Error('User name is required');
  const users = await getUsers();
  const password = randomPassword();
  const palette = ['#009688', '#5264d8', '#f59e0b', '#10b981', '#ef4444', '#25baeb'];
  const user = normalizeUser({
    id: randomId('user'),
    name: cleanName,
    loginId: uniqueLoginId(cleanName, users),
    password,
    role: 'user',
    color: palette[users.length % palette.length],
    createdAt: new Date().toISOString()
  }, users);
  await createRecord(TABLES.users, userToFields(user));
  return { user, credential: { loginId: user.loginId, password } };
}

async function updateUserPassword(id, payload) {
  const cleanPassword = String(payload?.password || '').trim();
  if (cleanPassword.length < 4) throw new Error('Password must be at least 4 characters');
  const user = (await getUsers()).find((item) => item.id === id);
  if (!user?.recordId) throw new Error('User not found');
  const next = { ...user, password: cleanPassword };
  await updateRecord(TABLES.users, user.recordId, userToFields(next));
  return next;
}

async function updateUserRole(id, payload) {
  const role = String(payload?.role || 'user').trim() || 'user';
  if (!['user', 'super-user'].includes(role)) throw new Error('Valid role is required');
  const user = (await getUsers()).find((item) => item.id === id);
  if (!user?.recordId) throw new Error('User not found');
  if (user.role === 'admin') throw new Error('Admin role cannot be changed here');
  const next = { ...user, role };
  await updateRecord(TABLES.users, user.recordId, userToFields(next));
  return next;
}

async function deleteUser(id) {
  const users = await getUsers();
  const user = users.find((item) => item.id === id);
  if (!user?.recordId) throw new Error('User not found');
  if (user.role === 'admin') throw new Error('Admin user cannot be removed');
  const entries = await getEntries();
  await Promise.all(entries.filter((entry) => entry.userId === id && entry.recordId).map((entry) => deleteRecord(TABLES.entries, entry.recordId)));
  await deleteRecord(TABLES.users, user.recordId);
  return { deleted: true, id };
}

async function createProject(payload) {
  const name = String(payload.name || '').trim();
  if (!name) throw new Error('Project name is required');
  if (!payload.clientId) throw new Error('Client name is required');
  if (duplicateSubtaskName(payload.subtasks)) throw new Error('Subtask name already exists');
  const subtasks = normalizeSubtasks(payload.subtasks);
  if (!subtasks.length) throw new Error('At least one subtask is required');
  const [projects, clients] = await Promise.all([getProjects(), getClients()]);
  const existing = projects.find((project) => projectNameKey(project.name) === projectNameKey(name));
  if (existing) return existing;
  const client = payload.clientId ? clients.find((item) => item.id === payload.clientId) : null;
  if (!client) throw new Error('Valid client is required');
  const project = normalizeProject({
    id: randomId('project'),
    name,
    clientId: client?.id || '',
    clientName: client?.name || '',
    subtasks,
    color: payload.color || '#25baeb',
    favorite: Boolean(payload.favorite),
    pinned: Boolean(payload.pinned),
    updatedAt: new Date().toISOString()
  });
  const record = await createRecord(TABLES.projects, projectToFields(project));
  return projectFromRecord(record);
}

async function updateProject(id, payload) {
  const [projects, clients] = await Promise.all([getProjects(), getClients()]);
  const project = projects.find((item) => item.id === id);
  if (!project?.recordId) throw new Error('Project not found');
  const nextName = payload.name?.trim() || project.name;
  const duplicate = projects.find((item) => item.id !== project.id && projectNameKey(item.name) === projectNameKey(nextName));
  if (duplicate) throw new Error('Project name already exists');
  const client = payload.clientId ? clients.find((item) => item.id === payload.clientId) : null;
  if (payload.subtasks !== undefined && duplicateSubtaskName(payload.subtasks)) throw new Error('Subtask name already exists');
  const subtasks = payload.subtasks !== undefined ? normalizeSubtasks(payload.subtasks) : project.subtasks;
  if (payload.clientId !== undefined && !client) throw new Error('Valid client is required');
  if (!subtasks.length) throw new Error('At least one subtask is required');
  const next = normalizeProject({
    ...project,
    name: nextName,
    clientId: payload.clientId !== undefined ? client?.id || '' : project.clientId,
    clientName: payload.clientId !== undefined ? client?.name || '' : project.clientName,
    subtasks,
    color: payload.color || project.color,
    favorite: payload.favorite ?? project.favorite,
    pinned: payload.pinned ?? project.pinned,
    updatedAt: new Date().toISOString()
  });
  await updateRecord(TABLES.projects, project.recordId, projectToFields(next));
  const entries = await getEntries();
  await Promise.all(entries
    .filter((entry) => entry.projectId === project.id && entry.recordId)
    .map((entry) => updateRecord(TABLES.entries, entry.recordId, entryToFields(normalizeEntry({
      ...entry,
      projectName: next.name,
      projectColor: next.color,
      updatedAt: new Date().toISOString()
    })))));
  return next;
}

async function deleteProject(id) {
  const project = (await getProjects()).find((item) => item.id === id);
  if (!project?.recordId) throw new Error('Project not found');
  const entries = await getEntries();
  await Promise.all(entries.filter((entry) => entry.projectId === id && entry.recordId).map((entry) => deleteRecord(TABLES.entries, entry.recordId)));
  await deleteRecord(TABLES.projects, project.recordId);
}

async function createClient(payload) {
  const name = String(payload.name || '').trim();
  if (!name) throw new Error('Client name is required');
  const clients = await getClients();
  const existing = clients.find((client) => clientNameKey(client.name) === clientNameKey(name));
  if (existing) throw new Error('Client name already exists');
  const client = normalizeClient({
    id: randomId('client'),
    name,
    updatedAt: new Date().toISOString()
  });
  const record = await createRecord(TABLES.clients, clientToFields(client));
  return clientFromRecord(record);
}

async function updateClient(id, payload) {
  const clients = await getClients();
  const client = clients.find((item) => item.id === id);
  if (!client?.recordId) throw new Error('Client not found');
  const name = String(payload.name || '').trim();
  if (!name) throw new Error('Client name is required');
  const duplicate = clients.find((item) => item.id !== id && clientNameKey(item.name) === clientNameKey(name));
  if (duplicate) throw new Error('Client name already exists');
  const next = normalizeClient({ ...client, name, updatedAt: new Date().toISOString() });
  const record = await updateRecord(TABLES.clients, client.recordId, clientToFields(next));
  return clientFromRecord(record);
}

async function deleteClient(id) {
  const client = (await getClients()).find((item) => item.id === id);
  if (!client?.recordId) throw new Error('Client not found');
  await deleteRecord(TABLES.clients, client.recordId);
}

async function createEntry(payload) {
  const [users, projects] = await Promise.all([getUsers(), getProjects()]);
  const user = users.find((item) => item.id === payload.userId);
  const project = projects.find((item) => item.id === payload.projectId);
  if (!user || user.role === 'admin') throw new Error('Valid user is required');
  if (!project) throw new Error('Valid project is required');
  if (!payload.startTime) throw new Error('Start time is required');
  const entry = normalizeEntry({
    ...payload,
    id: randomId('entry'),
    userName: user.name,
    projectName: project.name,
    projectColor: project.color,
    duration: durationSeconds(payload.startTime, payload.endTime),
    status: payload.endTime ? 'stopped' : 'running',
    updatedAt: new Date().toISOString()
  });
  const record = await createRecord(TABLES.entries, entryToFields(entry));
  return entryFromRecord(record);
}

async function updateEntry(id, payload) {
  const entries = await getEntries();
  const entry = entries.find((item) => item.id === id);
  if (!entry?.recordId) throw new Error('Entry not found');
  if (payload.actorRole && !timeEditorRoles.has(payload.actorRole)) throw new Error('Only admin or super-user can modify time entries');
  const project = payload.projectId ? (await getProjects()).find((item) => item.id === payload.projectId) : null;
  const startTime = payload.startTime || entry.startTime;
  const endTime = payload.endTime ?? entry.endTime;
  const next = normalizeEntry({
    ...entry,
    ...payload,
    projectName: project?.name || payload.projectName || entry.projectName,
    projectColor: project?.color || payload.projectColor || entry.projectColor,
    startTime,
    endTime,
    duration: durationSeconds(startTime, endTime),
    status: endTime ? 'stopped' : 'running',
    updatedAt: new Date().toISOString()
  });
  await updateRecord(TABLES.entries, entry.recordId, entryToFields(next));
  return next;
}

async function deleteEntry(id, actorRole) {
  if (!['admin', 'super-user', 'timer'].includes(actorRole)) throw new Error('Only admin or super-user can delete time entries');
  const entry = (await getEntries()).find((item) => item.id === id);
  if (!entry?.recordId) throw new Error('Entry not found');
  await deleteRecord(TABLES.entries, entry.recordId);
}

async function exportData() {
  const [users, projects, entries] = await Promise.all([getUsers(), getProjects(), getEntries()]);
  return { exportedAt: new Date().toISOString(), users, projects, entries };
}

async function importData() {
  throw new Error('JSON import is disabled because Airtable is the source of truth.');
}

async function restoreData() {
  throw new Error('JSON restore is disabled because Airtable is the source of truth.');
}

export const api = {
  getProjects,
  getClients,
  getUsers,
  login,
  createUser,
  updateUserPassword,
  updateUserRole,
  deleteUser,
  createProject,
  updateProject,
  deleteProject,
  createClient,
  updateClient,
  deleteClient,
  getEntries,
  createEntry,
  updateEntry,
  deleteEntry,
  getDashboard,
  exportData,
  importData,
  restoreData
};
