import { Router } from 'express';
import { createEntry, deleteEntry, listEntries, updateEntry } from '../controllers/entriesController.js';

const router = Router();
router.get('/', listEntries);
router.post('/', createEntry);
router.put('/:id', updateEntry);
router.delete('/:id', deleteEntry);

export default router;
