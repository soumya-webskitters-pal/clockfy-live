import { randomUUID } from 'crypto';
import { getEntries, getProjects, projectNameKey, saveEntries, saveProjects } from '../services/store.js';

export function listProjects(_req, res) {
  res.json(getProjects());
}

export function createProject(req, res) {
  const name = String(req.body.name || '').trim();
  if (!name) return res.status(400).json({ message: 'Project name is required' });
  const projects = getProjects();
  const existing = projects.find((project) => projectNameKey(project.name) === projectNameKey(name));
  if (existing) return res.status(200).json(existing);
  const project = {
    id: randomUUID(),
    name,
    color: req.body.color || '#25baeb',
    favorite: Boolean(req.body.favorite),
    pinned: Boolean(req.body.pinned),
    updatedAt: new Date().toISOString()
  };
  saveProjects([project, ...projects]);
  res.status(201).json(project);
}

export function updateProject(req, res) {
  const projects = getProjects();
  const project = projects.find((item) => item.id === req.params.id);
  if (!project) return res.status(404).json({ message: 'Project not found' });
  const nextName = req.body.name?.trim() || project.name;
  const duplicate = projects.find((item) => item.id !== project.id && projectNameKey(item.name) === projectNameKey(nextName));
  if (duplicate) return res.status(409).json({ message: 'Project name already exists' });
  Object.assign(project, {
    name: nextName,
    color: req.body.color || project.color,
    favorite: req.body.favorite ?? project.favorite,
    pinned: req.body.pinned ?? project.pinned,
    updatedAt: new Date().toISOString()
  });
  saveProjects(projects);
  const entries = getEntries().map((entry) => (
    entry.projectId === project.id ? { ...entry, projectName: project.name, projectColor: project.color } : entry
  ));
  saveEntries(entries);
  res.json(project);
}

export function deleteProject(req, res) {
  saveProjects(getProjects().filter((item) => item.id !== req.params.id));
  saveEntries(getEntries().filter((entry) => entry.projectId !== req.params.id));
  res.status(204).end();
}
