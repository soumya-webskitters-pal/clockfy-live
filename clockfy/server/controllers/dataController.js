import { getEntries, getProjects, getUsers, mergeData, restoreData } from '../services/store.js';

export function exportData(_req, res) {
  res.json({ exportedAt: new Date().toISOString(), users: getUsers(), projects: getProjects(), entries: getEntries() });
}

export function importData(req, res) {
  res.json(mergeData(req.body || {}));
}

export function restore(req, res) {
  res.json(restoreData(req.body || {}));
}
