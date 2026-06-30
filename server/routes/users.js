import { Router } from 'express';
import { authenticateUser, createUser, deleteUser, getUsers, updateUserPassword } from '../services/store.js';

const router = Router();
router.get('/', (_req, res) => res.json(getUsers(true)));
router.post('/', (req, res, next) => {
  try {
    res.status(201).json(createUser(req.body || {}));
  } catch (error) {
    next(error);
  }
});
router.put('/:id/password', (req, res, next) => {
  try {
    res.json(updateUserPassword(req.params.id, req.body?.password));
  } catch (error) {
    next(error);
  }
});
router.delete('/:id', (req, res, next) => {
  try {
    res.json(deleteUser(req.params.id));
  } catch (error) {
    next(error);
  }
});
router.post('/login', (req, res) => {
  const user = authenticateUser(req.body?.loginId, req.body?.password);
  if (!user) return res.status(401).json({ message: 'Invalid login ID or password' });
  res.json(user);
});

export default router;
