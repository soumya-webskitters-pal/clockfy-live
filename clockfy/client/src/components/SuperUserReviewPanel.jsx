import { ArrowLeft, Search, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { formatClock, formatDuration } from '../utils/time.js';

export default function SuperUserReviewPanel() {
  const { entries, projects, users, currentUser, setActivePage } = useApp();
  const trackableUsers = users.filter((user) => user.role !== 'admin');
  const isAdmin = currentUser?.role === 'admin';
  const [userId, setUserId] = useState('all');
  const [projectId, setProjectId] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [query, setQuery] = useState('');

  const filteredEntries = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((entry) => {
      const matchesUser = userId === 'all' || entry.userId === userId;
      const matchesProject = projectId === 'all' || entry.projectId === projectId;
      const afterStart = !fromDate || entry.date >= fromDate;
      const beforeEnd = !toDate || entry.date <= toDate;
      const matchesQuery = !q || [entry.userName, entry.projectName, entry.notes, entry.date]
        .some((value) => String(value || '').toLowerCase().includes(q));
      return matchesUser && matchesProject && afterStart && beforeEnd && matchesQuery;
    }).sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
  }, [entries, fromDate, projectId, query, toDate, userId]);

  const total = filteredEntries.reduce((sum, entry) => sum + Number(entry.duration || 0), 0);

  return (
    <section className="teamReviewPanel">
      <div className="teamReviewHead">
        <div>
          <span><ShieldCheck size={17} /> {isAdmin ? 'Admin review' : 'Time management'}</span>
          <h2>{isAdmin ? 'All user time' : 'Other user time'}</h2>
        </div>
        <div className="teamReviewActions">
          {!isAdmin && <button type="button" onClick={() => setActivePage('home')}><ArrowLeft size={16} /> My data</button>}
          <strong>{formatDuration(total)}</strong>
        </div>
      </div>
      <div className="teamReviewFilters">
        <label>
          User
          <select value={userId} onChange={(event) => setUserId(event.target.value)}>
            <option value="all">All users</option>
            {trackableUsers.map((user) => <option value={user.id} key={user.id}>{user.name}</option>)}
          </select>
        </label>
        <label>
          Project
          <select value={projectId} onChange={(event) => setProjectId(event.target.value)}>
            <option value="all">All projects</option>
            {projects.map((project) => <option value={project.id} key={project.id}>{project.name}</option>)}
          </select>
        </label>
        <label>
          From
          <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
        </label>
        <label>
          To
          <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
        </label>
        <label className="teamReviewSearch">
          Search
          <span>
            <Search size={16} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Project, note, date" />
          </span>
        </label>
      </div>
      <div className="teamReviewTable">
        <div className="teamReviewTableHead">
          <span>User</span>
          <span>Project</span>
          <span>Date</span>
          <span>Time</span>
          <span>Total</span>
        </div>
        {filteredEntries.map((entry) => (
          <div className="teamReviewRow" key={entry.id}>
            <span>{entry.userName}</span>
            <span><i style={{ background: entry.projectColor }} />{entry.projectName}</span>
            <span>{entry.date}</span>
            <span>{formatClock(entry.startTime)} - {formatClock(entry.endTime)}</span>
            <strong>{formatDuration(entry.duration)}</strong>
          </div>
        ))}
        {!filteredEntries.length && <div className="teamReviewEmpty">No entries match these filters</div>}
      </div>
    </section>
  );
}
