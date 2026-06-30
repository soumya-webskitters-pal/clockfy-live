import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { durationSeconds, toDateKey } from '../utils/time.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const dataDir = path.resolve(__dirname, '../data');
const projectsPath = path.join(dataDir, 'projects.json');
const entriesPath = path.join(dataDir, 'timeEntries.json');
const usersPath = path.join(dataDir, 'users.json');

const starterUsers = [
  { id: 'admin', name: 'Admin', loginId: 'admin', password: 'admin123', role: 'admin', color: '#111827' },
  { id: 'user-soumya', name: 'Soumya', loginId: 'soumya', password: 'user123', role: 'user', color: '#009688' },
  { id: 'user-vishal', name: 'Vishal', loginId: 'vishal', password: 'user123', role: 'user', color: '#5264d8' },
  { id: 'user-priya', name: 'Priya', loginId: 'priya', password: 'user123', role: 'user', color: '#f59e0b' }
];

const starterProjects = [
  { id: 'project-legend', name: 'Legend Website - Vish Project: Webflow', color: '#009688', favorite: true, pinned: true, updatedAt: new Date().toISOString() },
  { id: 'project-tradeify', name: 'Tradeify - Vish: Webflow', color: '#5264d8', favorite: false, pinned: false, updatedAt: new Date().toISOString() }
];

function sampleEntries() {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const lastWeek = new Date(now);
  lastWeek.setDate(now.getDate() - 5);
  return [
    makeEntry(starterProjects[0], yesterday, '11:09', '19:40', 'Add description'),
    makeEntry(starterProjects[0], yesterday, '15:38', '19:40', 'Add description'),
    makeEntry(starterProjects[0], yesterday, '11:09', '15:13', 'Add description'),
    makeEntry(starterProjects[1], yesterday, '10:50', '11:26', 'Add description'),
    makeEntry(starterProjects[1], lastWeek, '09:56', '12:29', 'Add description')
  ];
}

function makeEntry(project, date, start, end, notes) {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const startTime = new Date(date);
  startTime.setHours(sh, sm, 0, 0);
  const endTime = new Date(date);
  endTime.setHours(eh, em, 0, 0);
  return normalizeEntry({
    id: crypto.randomUUID(),
    projectId: project.id,
    projectName: project.name,
    projectColor: project.color,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    notes
  });
}

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

export function ensureStore() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(usersPath)) writeJson(usersPath, starterUsers);
  if (!fs.existsSync(projectsPath)) writeJson(projectsPath, starterProjects);
  if (!fs.existsSync(entriesPath)) writeJson(entriesPath, sampleEntries());
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

function normalizeUser(user, existingUsers = []) {
  const starter = starterUsers.find((item) => item.id === user.id);
  const safeName = user.name || starter?.name || 'User';
  const loginId = user.loginId || starter?.loginId || safeName;
  return {
    id: user.id || crypto.randomUUID(),
    name: safeName,
    loginId: uniqueLoginId(loginId, existingUsers, user.id),
    password: user.password || starter?.password || 'user123',
    role: user.role || 'user',
    color: user.color || starter?.color || '#25baeb',
    createdAt: user.createdAt || new Date().toISOString()
  };
}

function publicUser(user) {
  const { password, ...rest } = normalizeUser(user);
  return rest;
}

function normalizeUsers(users) {
  const normalized = [];
  const seenLoginIds = new Set();
  for (const user of users) {
    const next = normalizeUser(user, normalized);
    const loginKey = next.loginId.toLowerCase();
    if (seenLoginIds.has(loginKey)) continue;
    seenLoginIds.add(loginKey);
    normalized.push(next);
  }
  return normalized;
}

export function getUsers(includeCredentials = false) {
  ensureStore();
  const users = normalizeUsers(readJson(usersPath, starterUsers));
  writeJson(usersPath, users);
  return includeCredentials ? users : users.map((user) => {
    const { password, ...rest } = user;
    return rest;
  });
}

export function saveUsers(users) {
  const normalized = normalizeUsers(users);
  writeJson(usersPath, normalized);
  return normalized;
}

function generatePassword() {
  return `Clockfy-${Math.random().toString(36).slice(2, 8)}${Math.floor(10 + Math.random() * 90)}`;
}

export function projectNameKey(name) {
  return String(name || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

export function createUser({ name }) {
  const users = getUsers(true);
  const cleanName = String(name || '').trim();
  if (!cleanName) {
    const err = new Error('User name is required');
    err.status = 400;
    throw err;
  }
  const password = generatePassword();
  const loginId = uniqueLoginId(cleanName, users);
  const palette = ['#009688', '#5264d8', '#f59e0b', '#10b981', '#ef4444', '#25baeb'];
  const user = normalizeUser({
    id: crypto.randomUUID(),
    name: cleanName,
    loginId,
    password,
    role: 'user',
    color: palette[users.length % palette.length],
    createdAt: new Date().toISOString()
  }, users);
  saveUsers([...users, user]);
  return { user: publicUser(user), credential: { loginId: user.loginId, password } };
}

export function updateUserPassword(id, password) {
  const cleanPassword = String(password || '').trim();
  if (cleanPassword.length < 4) {
    const err = new Error('Password must be at least 4 characters');
    err.status = 400;
    throw err;
  }
  const users = getUsers(true);
  const user = users.find((item) => item.id === id);
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  user.password = cleanPassword;
  saveUsers(users);
  return publicUser(user);
}

export function deleteUser(id) {
  const users = getUsers(true);
  const user = users.find((item) => item.id === id);
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  if (user.role === 'admin') {
    const err = new Error('Admin user cannot be removed');
    err.status = 400;
    throw err;
  }
  saveUsers(users.filter((item) => item.id !== id));
  saveEntries(getEntries().filter((entry) => entry.userId !== id));
  return { deleted: true, id };
}

export function authenticateUser(loginId, password) {
  const cleanLoginId = String(loginId || '').trim().toLowerCase();
  const cleanPassword = String(password || '').trim();
  const user = getUsers(true).find((item) => {
    const loginMatches = item.loginId?.toLowerCase() === cleanLoginId;
    return loginMatches && item.password === cleanPassword;
  });
  return user ? publicUser(user) : null;
}

export function getProjects() {
  ensureStore();
  const projects = normalizeProjects(readJson(projectsPath, []));
  writeJson(projectsPath, projects);
  return projects;
}

export function saveProjects(projects) {
  const normalized = normalizeProjects(projects);
  writeJson(projectsPath, normalized);
  return normalized;
}

function normalizeProjects(projects) {
  const seenNames = new Set();
  const normalized = [];
  for (const project of projects) {
    if (!project?.name) continue;
    const key = projectNameKey(project.name);
    if (seenNames.has(key)) continue;
    seenNames.add(key);
    normalized.push({
      id: project.id || crypto.randomUUID(),
      name: String(project.name).trim().replace(/\s+/g, ' '),
      color: project.color || '#25baeb',
      favorite: Boolean(project.favorite),
      pinned: Boolean(project.pinned),
      updatedAt: project.updatedAt || new Date().toISOString()
    });
  }
  return normalized;
}

export function getEntries() {
  ensureStore();
  return readJson(entriesPath, []).map(normalizeEntry);
}

export function saveEntries(entries) {
  const normalized = entries.map(normalizeEntry);
  writeJson(entriesPath, normalized);
  return normalized;
}

export function normalizeEntry(entry) {
  const endTime = entry.endTime || new Date().toISOString();
  const startTime = entry.startTime || endTime;
  const users = getUsers(true);
  const fallbackUser = users.find((user) => user.role === 'user') || starterUsers[1];
  const user = users.find((item) => item.id === entry.userId) || fallbackUser;
  return {
    id: entry.id || crypto.randomUUID(),
    userId: user.id,
    userName: entry.userName || user.name,
    projectId: entry.projectId,
    projectName: entry.projectName,
    projectColor: entry.projectColor || '#25baeb',
    startTime,
    endTime,
    duration: durationSeconds(startTime, endTime),
    date: entry.date || toDateKey(startTime),
    notes: entry.notes || '',
    updatedAt: new Date().toISOString()
  };
}

export function mergeData(payload) {
  const currentProjects = getProjects();
  const currentEntries = getEntries();
  const projectMap = new Map(currentProjects.map((item) => [item.id, item]));
  const entryMap = new Map(currentEntries.map((item) => [item.id, item]));

  for (const project of payload.projects || []) {
    if (project?.id && project?.name) projectMap.set(project.id, { ...projectMap.get(project.id), ...project, updatedAt: new Date().toISOString() });
  }
  for (const entry of payload.entries || payload.timeEntries || []) {
    if (entry?.id && entry?.projectId) entryMap.set(entry.id, normalizeEntry(entry));
  }

  return {
    users: getUsers(),
    projects: saveProjects([...projectMap.values()]),
    entries: saveEntries([...entryMap.values()])
  };
}

export function restoreData(payload) {
  const projects = Array.isArray(payload.projects) ? payload.projects : [];
  const entries = Array.isArray(payload.entries) ? payload.entries : payload.timeEntries || [];
  saveProjects(projects);
  saveEntries(entries);
  return { users: getUsers(), projects: getProjects(), entries: getEntries() };
}
