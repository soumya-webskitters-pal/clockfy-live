import { Router } from 'express';
import { createProject, deleteProject, listProjects, updateProject } from '../controllers/projectsController.js';

const router = Router();
router.get('/', listProjects);
router.post('/', createProject);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

export default router;
