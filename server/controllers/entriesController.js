import { getEntries, getProjects, getUsers, normalizeEntry, saveEntries } from '../services/store.js';

export function listEntries(_req, res) {
  res.json(getEntries().sort((a, b) => new Date(b.startTime) - new Date(a.startTime)));
}

export function createEntry(req, res) {
  const project = getProjects().find((item) => item.id === req.body.projectId);
  if (!project) return res.status(400).json({ message: 'Valid project is required' });
  const user = getUsers().find((item) => item.id === req.body.userId);
  if (!user || user.role !== 'user') return res.status(400).json({ message: 'Valid user is required' });
  if (!req.body.startTime || !req.body.endTime) return res.status(400).json({ message: 'Start and end time are required' });
  const entry = normalizeEntry({
    ...req.body,
    userName: user.name,
    projectName: project.name,
    projectColor: project.color
  });
  saveEntries([entry, ...getEntries()]);
  res.status(201).json(entry);
}

export function updateEntry(req, res) {
  if (req.body?.actorRole !== 'admin') return res.status(403).json({ message: 'Only admin can modify time entries' });
  const entries = getEntries();
  const entry = entries.find((item) => item.id === req.params.id);
  if (!entry) return res.status(404).json({ message: 'Entry not found' });
  const project = req.body.projectId ? getProjects().find((item) => item.id === req.body.projectId) : null;
  const next = normalizeEntry({
    ...entry,
    ...req.body,
    projectName: project?.name || req.body.projectName || entry.projectName,
    projectColor: project?.color || req.body.projectColor || entry.projectColor
  });
  saveEntries(entries.map((item) => (item.id === next.id ? next : item)));
  res.json(next);
}

export function deleteEntry(req, res) {
  if (req.query?.actorRole !== 'admin') return res.status(403).json({ message: 'Only admin can delete time entries' });
  saveEntries(getEntries().filter((item) => item.id !== req.params.id));
  res.status(204).end();
}
