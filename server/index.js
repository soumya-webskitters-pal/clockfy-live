import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import projectsRouter from './routes/projects.js';
import entriesRouter from './routes/entries.js';
import dashboardRouter from './routes/dashboard.js';
import dataRouter from './routes/data.js';
import usersRouter from './routes/users.js';
import { ensureStore } from './services/store.js';
import { notFound, errorHandler } from './middleware/errors.js';

const app = express();
const port = process.env.PORT || 4000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, '../client/dist');

ensureStore();

app.use(cors());
app.use(express.json({ limit: '8mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/projects', projectsRouter);
app.use('/api/users', usersRouter);
app.use('/api/entries', entriesRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api', dataRouter);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(clientDistPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

app.use(notFound);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Clockfy running on port ${port}`);
});
