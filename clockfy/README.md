# Clockfy

Production-ready local time tracking app inspired by Clockify.

## Tech

- React + Vite frontend
- Node.js + Express backend
- Vanilla CSS
- JSON file storage with Node `fs`
- REST API

## Run

Backend:

```bash
cd server
npm install
npm run dev
```

Frontend:

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173`.

## Railway deploy

Deploy this repo as one Railway service from GitHub.

Railway settings:

```bash
Build command: npm run build
Start command: npm start
```

Generate a public domain in Railway after deploy. The Express server serves both the REST API and the built React app in production.

For persistent JSON storage, add a Railway volume mounted at:

```bash
/app/server/data
```

Without a volume, JSON data can reset during redeploys.

## API

- `GET /api/users`
- `POST /api/users`
- `PUT /api/users/:id/password`
- `POST /api/users/login`
- `GET /api/projects`
- `POST /api/projects`
- `PUT /api/projects/:id`
- `DELETE /api/projects/:id`
- `GET /api/entries`
- `POST /api/entries`
- `PUT /api/entries/:id`
- `DELETE /api/entries/:id`
- `GET /api/dashboard`
- `GET /api/export`
- `POST /api/import`
- `POST /api/restore`

Data lives in `server/data/users.json`, `server/data/projects.json`, and `server/data/timeEntries.json`.
