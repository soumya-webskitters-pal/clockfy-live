import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import projectsRouter from './routes/projects.js';
import entriesRouter from './routes/entries.js';
import dashboardRouter from './routes/dashboard.js';
import dataRouter from './routes/data.js';
import usersRouter from './routes/users.js';
import { ensureStore } from './services/store.js';
import { notFound, errorHandler } from './middleware/errors.js';

const app = express();
const port = process.env.PORT || 4000;

ensureStore();

app.use(cors());
app.use(express.json({ limit: '8mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/projects', projectsRouter);
app.use('/api/users', usersRouter);
app.use('/api/entries', entriesRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api', dataRouter);
app.use(notFound);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Clockfy API running on http://localhost:${port}`);
});
