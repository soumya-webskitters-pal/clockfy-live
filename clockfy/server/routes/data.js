import { Router } from 'express';
import { exportData, importData, restore } from '../controllers/dataController.js';

const router = Router();
router.get('/export', exportData);
router.post('/import', importData);
router.post('/restore', restore);

export default router;
