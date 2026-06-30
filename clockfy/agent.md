You are a senior Full Stack Software Engineer and UI/UX designer.

Build a production-ready Time Tracking web application similar to Clockify.

Tech Stack:

- Frontend: React (latest) + Vite
- Backend: Node.js + Express
- Styling: Vanilla CSS (no Tailwind, no Bootstrap)
- Icons: Lucide React
- State Management: React Context + Hooks
- Database: JSON files (no MongoDB or SQL)
- File handling: Node.js fs module
- Communication: REST API

The application should have a professional, modern, minimal UI with smooth animations and excellent performance.

====================================================
APPLICATION FEATURES
====================================================

The application is a Single Page Application (SPA).

Users should be able to:

1. Create Projects

- Add new projects
- Edit project names
- Delete projects
- Assign unique colors
- Display project list in a clean sidebar

2. Track Time

- Select a project
- Click Start button
- Timer begins
- Click Stop
- Save time entry
- user can edit any entry and total time will update accordingly.
- should show day wise total time trackin time.

Only one timer can run at a time.

Each saved entry should include:

- Project ID
- Project Name
- Start Time
- End Time
- Total Duration
- Date
- Notes (optional)

3. Daily History

Display previous records grouped like:

Today
Yesterday
June 12, 2026

Each entry should show:

Project Name
Start Time
End Time
Duration

4. Dashboard

Display cards:

Today's Total Time
This Week
This Month
Total Projects

5. Search

Allow searching history by

- Project name
- Date

6. Filter

Filter by

- Today
- Yesterday
- This Week
- This Month
- Custom Date

7. Timer

Display a large running timer:

00:00:00

Include

Start
Pause
Resume
Stop

8. Recent Projects

Show recently used projects.

9. Editable Entries

Allow editing

Start time
End time
Notes

Automatically recalculate duration.

10. Delete Entries

Allow deleting time records.

====================================================
DATA STORAGE
====================================================

Do NOT use any database.

Instead:

Backend stores data inside JSON files.

Example:

/data/projects.json

/data/timeEntries.json

Use Node.js fs module.

When the application starts:

- Read JSON files
- Create them automatically if missing

Every CRUD operation should immediately update the JSON files.

====================================================
IMPORT / EXPORT
====================================================

Provide buttons:

Export Data

Downloads

time-tracking.json

Import Data

Upload previous JSON

Merge with existing data

====================================================
LOCAL MACHINE STORAGE
====================================================

When the user clicks

"Backup to Computer"

Download JSON.

When the user clicks

"Restore"

Open file picker.

Read JSON.

Restore records.

When the application loads, fetch the saved JSON data through the backend API and display all previous records automatically.

====================================================
REST API
====================================================

Create clean REST APIs.

Projects

GET /api/projects

POST /api/projects

PUT /api/projects/:id

DELETE /api/projects/:id

Entries

GET /api/entries

POST /api/entries

PUT /api/entries/:id

DELETE /api/entries/:id

Dashboard

GET /api/dashboard

====================================================
UI DESIGN
====================================================

Professional minimal SaaS dashboard.

Use:

White background

Light gray panels

Rounded corners (12px)

Soft shadows

Primary color

#25baeb

Accent

#3bf6ea

Font

Inter

Spacing

Generous whitespace

Responsive

Desktop
Tablet
Mobile

Sticky sidebar.

Smooth hover animations.

Smooth transitions.

Modern cards.

Beautiful tables.

No clutter.

====================================================
PERFORMANCE
====================================================

Code splitting

Lazy loading

Memoization

Avoid unnecessary re-renders

Reusable components

Clean architecture

====================================================
PROJECT STRUCTURE
====================================================

client/

components/

pages/

hooks/

context/

services/

utils/

styles/

server/

routes/

controllers/

services/

data/

middleware/

utils/

index.js

====================================================
REACT COMPONENTS
====================================================

Sidebar

Header

ProjectList

ProjectCard

Timer

DashboardCards

HistoryTable

FilterBar

SearchBar

Modal

Button

Input

Card

====================================================
BONUS FEATURES
====================================================

Dark Mode

Ctrl + N → New Project

Toast notifications

Loading skeletons

Confirmation dialogs

Responsive sidebar

CSV export

Weekly chart using Chart.js

Monthly productivity graph

Project color badges

Favorite projects

Pinned projects

====================================================
CODE QUALITY
====================================================

Use:

Functional Components

React Hooks

Reusable APIs

Clean naming

Proper folder separation

Error handling

Validation

Loading states

Empty states

Reusable utility functions

Comments where necessary

====================================================
DELIVERABLES
====================================================

Generate the complete project with:

1. Frontend (React + Vite)
2. Backend (Node.js + Express)
3. Vanilla CSS
4. JSON file database
5. Fully working REST APIs
6. Professional UI
7. Responsive design
8. Import/Export functionality
9. Complete folder structure
10. README.md with installation instructions

The generated project should be fully functional after running:

Frontend:
npm install
npm run dev

Backend:
npm install
npm run dev

No placeholder code.
No pseudo-code.
No incomplete files.

Generate production-quality code with attention to scalability, maintainability, performance, and clean architecture.
