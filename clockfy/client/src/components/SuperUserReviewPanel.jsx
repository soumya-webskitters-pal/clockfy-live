import { ArrowLeft, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { formatClock, formatDuration } from '../utils/time.js';
import SearchableFilterSelect from './SearchableFilterSelect.jsx';

const datePresets = [
  { id: 'all', label: 'All dates' },
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'this-week', label: 'This week' },
  { id: 'last-week', label: 'Last week' },
  { id: 'this-month', label: 'This month' }
];

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

function formatReportDate(value) {
  if (!value) return '';
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function shiftDate(value, days) {
  if (!value) return value;
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + days);
  return dateKey(date);
}

function presetRange(preset) {
  const today = new Date();
  const start = new Date(today);
  const end = new Date(today);

  if (preset === 'all') return { from: '', to: '' };
  if (preset === 'today') return { from: dateKey(today), to: dateKey(today) };
  if (preset === 'yesterday') {
    start.setDate(today.getDate() - 1);
    return { from: dateKey(start), to: dateKey(start) };
  }
  if (preset === 'this-week' || preset === 'last-week') {
    const day = today.getDay() || 7;
    start.setDate(today.getDate() - day + 1);
    end.setTime(start.getTime());
    end.setDate(start.getDate() + 6);
    if (preset === 'last-week') {
      start.setDate(start.getDate() - 7);
      end.setDate(end.getDate() - 7);
    }
    return { from: dateKey(start), to: dateKey(end) };
  }
  if (preset === 'this-month') {
    start.setDate(1);
    end.setMonth(today.getMonth() + 1, 0);
    return { from: dateKey(start), to: dateKey(end) };
  }
  return { from: '', to: '' };
}

export default function SuperUserReviewPanel() {
  const { entries, projects, clients, users, currentUser, setActivePage } = useApp();
  const trackableUsers = users.filter((user) => user.role !== 'admin');
  const isAdmin = currentUser?.role === 'admin';
  const [userId, setUserId] = useState('all');
  const [clientId, setClientId] = useState('all');
  const [projectId, setProjectId] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [query, setQuery] = useState('');
  const [datePreset, setDatePreset] = useState('all');
  const [dateMenuOpen, setDateMenuOpen] = useState(false);
  const userOptions = useMemo(() => [
    { value: 'all', label: 'All users' },
    ...trackableUsers.map((user) => ({ value: user.id, label: user.name }))
  ], [trackableUsers]);
  const clientOptions = useMemo(() => [
    { value: 'all', label: 'All clients' },
    ...clients.map((client) => ({ value: client.id, label: client.name }))
  ], [clients]);
  const projectOptions = useMemo(() => [
    { value: 'all', label: 'All projects' },
    ...projects.map((project) => ({ value: project.id, label: project.name }))
  ], [projects]);

  const filteredEntries = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((entry) => {
      const selectedClient = clients.find((client) => client.id === clientId);
      const matchesUser = userId === 'all' || entry.userId === userId;
      const matchesClient = clientId === 'all' || entry.clientId === clientId || (
        selectedClient && entry.clientName?.toLowerCase() === selectedClient.name.toLowerCase()
      );
      const matchesProject = projectId === 'all' || entry.projectId === projectId;
      const afterStart = !fromDate || entry.date >= fromDate;
      const beforeEnd = !toDate || entry.date <= toDate;
      const matchesQuery = !q || [entry.userName, entry.clientName, entry.projectName, entry.subtask, entry.notes, entry.date]
        .some((value) => String(value || '').toLowerCase().includes(q));
      return matchesUser && matchesClient && matchesProject && afterStart && beforeEnd && matchesQuery;
    }).sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
  }, [clients, clientId, entries, fromDate, projectId, query, toDate, userId]);

  const total = filteredEntries.reduce((sum, entry) => sum + Number(entry.duration || 0), 0);
  const dateRangeLabel = fromDate || toDate
    ? `${formatReportDate(fromDate) || 'Any start'} - ${formatReportDate(toDate) || 'Any end'}`
    : 'All dates';

  function moveDateRange(days) {
    setFromDate((value) => shiftDate(value, days));
    setToDate((value) => shiftDate(value, days));
    if (fromDate || toDate) setDatePreset('custom');
  }

  function applyDatePreset(preset) {
    const range = presetRange(preset);
    setFromDate(range.from);
    setToDate(range.to);
    setDatePreset(preset);
    setDateMenuOpen(false);
  }

  function resetFilters() {
    setUserId('all');
    setClientId('all');
    setProjectId('all');
    setFromDate('');
    setToDate('');
    setQuery('');
    setDatePreset('all');
    setDateMenuOpen(false);
  }

  return (
    <section className="teamReviewPanel timeReportPanel">
      <div className="reportToolbar">
        <div className="reportTabs">
          <button type="button" className="reportMenu">Time Report</button>
          <button type="button" className="active">{isAdmin ? 'All user time' : 'Other user time'}</button>
        </div>
        <div className="reportActions">
          {!isAdmin && <button type="button" onClick={() => setActivePage('home')}><ArrowLeft size={16} /> My data</button>}
          <div className="reportDateWrap">
            <button type="button" className="reportDatePicker" onClick={() => setDateMenuOpen((open) => !open)} aria-expanded={dateMenuOpen}>
              <CalendarDays size={17} />
              <span>{dateRangeLabel}</span>
              <ChevronDown size={13} />
            </button>
            {dateMenuOpen && (
              <div className="reportDateMenu">
                {datePresets.map((preset) => (
                  <button
                    type="button"
                    className={datePreset === preset.id ? 'active' : ''}
                    key={preset.id}
                    onClick={() => applyDatePreset(preset.id)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button type="button" className="reportStepButton" onClick={() => moveDateRange(-1)} aria-label="Previous date range"><ChevronLeft size={16} /></button>
          <button type="button" className="reportStepButton" onClick={() => moveDateRange(1)} aria-label="Next date range"><ChevronRight size={16} /></button>
        </div>
      </div>

      <div className="analyticsFilters">
        <label>
          Filter
          <span className="filterStatic">Filter by</span>
        </label>
        <label>
          User
          <SearchableFilterSelect value={userId} options={userOptions} onChange={setUserId} placeholder="Search users" />
        </label>
        <label>
          Client
          <SearchableFilterSelect value={clientId} options={clientOptions} onChange={setClientId} placeholder="Search clients" />
        </label>
        <label>
          Project
          <SearchableFilterSelect value={projectId} options={projectOptions} onChange={setProjectId} placeholder="Search projects" />
        </label>
        <label>
          From
          <input type="date" value={fromDate} onChange={(event) => { setFromDate(event.target.value); setDatePreset('custom'); }} />
        </label>
        <label>
          To
          <input type="date" value={toDate} onChange={(event) => { setToDate(event.target.value); setDatePreset('custom'); }} />
        </label>
        <label className="analyticsSearch">
          Description
          <span>
            <Search size={16} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" />
          </span>
        </label>
        <button type="button" className="applyFilterButton">Apply Filter</button>
        <button type="button" className="resetFilterButton" onClick={resetFilters}>Reset</button>
      </div>
      <div className="teamReviewSummary">
        <span>Total time</span>
        <strong>{formatDuration(total)}</strong>
      </div>
      <div className="teamReviewTable">
        <div className="teamReviewTableHead">
          <span>User</span>
          <span>Client</span>
          <span>Project</span>
          <span>Task</span>
          <span>Description</span>
          <span>Date</span>
          <span>Time</span>
          <span>Total</span>
        </div>
        {filteredEntries.map((entry) => (
          <div className="teamReviewRow" key={entry.id}>
            <span>{entry.userName}</span>
            <span>{entry.clientName || 'No client'}</span>
            <span><i style={{ background: entry.projectColor }} />{entry.projectName}</span>
            <span>{entry.subtask || 'No task'}</span>
            <span>{entry.notes || 'No comments'}</span>
            <span>{entry.date}</span>
            <span>{formatClock(entry.startTime)} - {entry.endTime ? formatClock(entry.endTime) : 'Running'}</span>
            <strong>{formatDuration(entry.duration)}</strong>
          </div>
        ))}
        {!filteredEntries.length && <div className="teamReviewEmpty">No entries match these filters</div>}
      </div>
    </section>
  );
}
