import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  PieController,
  Tooltip
} from 'chart.js';
import { Briefcase, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Clock, Search, Trophy, UsersRound } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { formatClock, formatDuration } from '../utils/time.js';
import SearchableFilterSelect from './SearchableFilterSelect.jsx';

ChartJS.register(ArcElement, BarController, BarElement, CategoryScale, LinearScale, PieController, Tooltip);

const chartColors = ['#25baeb', '#10b981', '#f59e0b', '#5264d8', '#ef4444', '#8b5cf6', '#14b8a6', '#f43f5e'];
const reportTabs = ['Summary', 'Detailed', 'Weekly', 'Shared'];
const datePresets = [
  { id: 'all', label: 'All dates' },
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'this-week', label: 'This week' },
  { id: 'last-week', label: 'Last week' },
  { id: 'this-month', label: 'This month' }
];

function shortLabel(value) {
  const label = String(value || 'Untitled');
  return label.length > 18 ? `${label.slice(0, 16)}...` : label;
}

function sumEntries(entries) {
  return entries.reduce((total, entry) => total + Number(entry.duration || 0), 0);
}

function aggregateBy(entries, keyFn, labelFn, colorFn) {
  const map = new Map();
  entries.forEach((entry) => {
    const key = keyFn(entry);
    const current = map.get(key) || {
      key,
      label: labelFn(entry),
      color: colorFn?.(entry),
      total: 0,
      entries: 0
    };
    current.total += Number(entry.duration || 0);
    current.entries += 1;
    map.set(key, current);
  });
  return [...map.values()].sort((a, b) => b.total - a.total);
}

function buildDailySeries(entries, days = 14) {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - index));
    const key = date.toISOString().slice(0, 10);
    return { date: key, total: sumEntries(entries.filter((entry) => entry.date === key)) };
  });
}

function formatReportDate(value) {
  if (!value) return '';
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function shiftDate(value, days) {
  if (!value) return value;
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function dateKey(date) {
  return date.toISOString().slice(0, 10);
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

function weekKey(value) {
  const date = new Date(`${value}T00:00:00`);
  const day = date.getDay() || 7;
  date.setDate(date.getDate() - day + 1);
  return date.toISOString().slice(0, 10);
}

function weekLabel(value) {
  const start = new Date(`${value}T00:00:00`);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return `${formatReportDate(value)} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

function useChart(ref, config, deps) {
  useEffect(() => {
    if (!ref.current || !config) return undefined;
    const chart = new ChartJS(ref.current, config);
    return () => chart.destroy();
  }, deps);
}

export default function AdminAnalyticsPanel() {
  const { entries, projects, clients, users, currentUser, darkMode } = useApp();
  const projectPieRef = useRef(null);
  const userBarRef = useRef(null);
  const dailyBarRef = useRef(null);
  const [userId, setUserId] = useState('all');
  const [clientId, setClientId] = useState('all');
  const [projectId, setProjectId] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [query, setQuery] = useState('');
  const [reportTab, setReportTab] = useState('Summary');
  const [datePreset, setDatePreset] = useState('all');
  const [dateMenuOpen, setDateMenuOpen] = useState(false);
  const trackableUsers = users.filter((user) => user.role !== 'admin');
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
  const filteredEntries = useMemo(() => entries.filter((entry) => {
    const q = query.trim().toLowerCase();
    const selectedClient = clients.find((client) => client.id === clientId);
    const matchesUser = userId === 'all' || entry.userId === userId;
    const matchesClient = clientId === 'all' || entry.clientId === clientId || (
      selectedClient && entry.clientName?.toLowerCase() === selectedClient.name.toLowerCase()
    );
    const matchesProject = projectId === 'all' || entry.projectId === projectId;
    const afterStart = !fromDate || entry.date >= fromDate;
    const beforeEnd = !toDate || entry.date <= toDate;
    const matchesQuery = !q || [
      entry.clientName,
      entry.projectName,
      entry.userName,
      entry.subtask,
      entry.notes
    ].some((value) => String(value || '').toLowerCase().includes(q));
    return matchesUser && matchesClient && matchesProject && afterStart && beforeEnd && matchesQuery;
  }), [clients, clientId, entries, fromDate, projectId, query, toDate, userId]);

  const projectTotals = useMemo(() => aggregateBy(
    filteredEntries,
    (entry) => entry.projectId || entry.projectName,
    (entry) => entry.projectName || 'Untitled project',
    (entry) => entry.projectColor
  ), [filteredEntries]);

  const userTotals = useMemo(() => aggregateBy(
    filteredEntries,
    (entry) => entry.userId || entry.userName,
    (entry) => entry.userName || 'Unknown user'
  ), [filteredEntries]);

  const detailedEntries = useMemo(() => [...filteredEntries]
    .sort((a, b) => new Date(b.startTime) - new Date(a.startTime)), [filteredEntries]);

  const weeklyTotals = useMemo(() => aggregateBy(
    filteredEntries,
    (entry) => weekKey(entry.date),
    (entry) => weekLabel(weekKey(entry.date))
  ), [filteredEntries]);

  const sharedTotals = useMemo(() => aggregateBy(
    filteredEntries,
    (entry) => `${entry.userId || entry.userName}-${entry.projectId || entry.projectName}`,
    (entry) => entry.userName || 'Unknown user',
    (entry) => entry.projectColor
  ).map((item) => {
    const entry = filteredEntries.find((current) => `${current.userId || current.userName}-${current.projectId || current.projectName}` === item.key);
    return {
      ...item,
      projectName: entry?.projectName || 'Untitled project',
      clientName: entry?.clientName || 'No client'
    };
  }), [filteredEntries]);

  const dailySeries = useMemo(() => buildDailySeries(filteredEntries), [filteredEntries]);
  const totalTime = sumEntries(filteredEntries);
  const topProject = projectTotals[0];
  const topUser = userTotals[0];
  const averagePerEntry = filteredEntries.length ? Math.round(totalTime / filteredEntries.length) : 0;
  const dateRangeLabel = fromDate || toDate
    ? `${formatReportDate(fromDate) || 'Any start'} - ${formatReportDate(toDate) || 'Any end'}`
    : 'All dates';
  const chartGridColor = darkMode ? '#3a4a54' : '#edf3f7';
  const chartTextColor = darkMode ? '#d9e6ec' : '#4f5961';
  const chartPanelColor = darkMode ? '#202b32' : '#ffffff';

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

  useChart(projectPieRef, projectTotals.length && {
    type: 'pie',
    data: {
      labels: projectTotals.slice(0, 8).map((item) => item.label),
      datasets: [{
        data: projectTotals.slice(0, 8).map((item) => item.total),
        backgroundColor: projectTotals.slice(0, 8).map((item, index) => item.color || chartColors[index % chartColors.length]),
        borderColor: chartPanelColor,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } }
    }
  }, [projectTotals, chartPanelColor]);

  useChart(userBarRef, userTotals.length && {
    type: 'bar',
    data: {
      labels: userTotals.slice(0, 8).map((item) => shortLabel(item.label)),
      datasets: [{
        data: userTotals.slice(0, 8).map((item) => Math.round(item.total / 60)),
        backgroundColor: '#5264d8',
        borderRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: chartTextColor } },
        y: { grid: { color: chartGridColor }, ticks: { color: chartTextColor } }
      }
    }
  }, [userTotals, chartGridColor, chartTextColor]);

  useChart(dailyBarRef, {
    type: 'bar',
    data: {
      labels: dailySeries.map((item) => item.date.slice(5)),
      datasets: [{
        data: dailySeries.map((item) => Math.round(item.total / 60)),
        backgroundColor: '#10b981',
        borderRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: chartTextColor } },
        y: { grid: { color: chartGridColor }, ticks: { color: chartTextColor } }
      }
    }
  }, [dailySeries, chartGridColor, chartTextColor]);

  return (
    <section className="analyticsPanel">
      <div className="reportToolbar">
        <div className="reportTabs">
          <button type="button" className="reportMenu">Time Report</button>
          {reportTabs.map((tab) => (
            <button
              type="button"
              className={reportTab === tab ? 'active' : ''}
              key={tab}
              onClick={() => setReportTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="reportActions">
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

      {reportTab === 'Summary' && (
        <>
          <div className="analyticsMetrics">
            <article><Clock size={17} /><span>Total time</span><strong>{formatDuration(totalTime)}</strong></article>
            <article><Briefcase size={17} /><span>Projects worked</span><strong>{projectTotals.length}</strong></article>
            <article><UsersRound size={17} /><span>Users worked</span><strong>{userTotals.length}</strong></article>
            <article><Trophy size={17} /><span>Avg entry</span><strong>{formatDuration(averagePerEntry)}</strong></article>
          </div>

          <div className="analyticsGrid">
            <article className="analyticsCard wide projectTotalsCard">
              <div className="analyticsCardHead">
                <span>Total time worked per project</span>
                <strong>{formatDuration(totalTime)}</strong>
              </div>
              <div className="projectTotalsTable">
                {projectTotals.map((item, index) => (
                  <div key={item.key}>
                    <span><i style={{ background: item.color || chartColors[index % chartColors.length] }} />{item.label}</span>
                    <small>{item.entries} {item.entries === 1 ? 'entry' : 'entries'}</small>
                    <strong>{formatDuration(item.total)}</strong>
                  </div>
                ))}
                {!projectTotals.length && <em>No project time matches these filters</em>}
              </div>
            </article>

            <article className="analyticsCard">
              <div className="analyticsCardHead">
                <span>Total project time</span>
                <strong>{topProject ? topProject.label : 'No time yet'}</strong>
              </div>
              <div className="analyticsChart pie">{projectTotals.length ? <canvas ref={projectPieRef} /> : <em>No project data</em>}</div>
              <div className="analyticsLegend">
                {projectTotals.slice(0, 6).map((item, index) => (
                  <span key={item.key}><i style={{ background: item.color || chartColors[index % chartColors.length] }} />{item.label}<b>{formatDuration(item.total)}</b></span>
                ))}
              </div>
            </article>

            <article className="analyticsCard">
              <div className="analyticsCardHead">
                <span>User time</span>
                <strong>{topUser ? topUser.label : 'No time yet'}</strong>
              </div>
              <div className="analyticsChart">{userTotals.length ? <canvas ref={userBarRef} /> : <em>No user data</em>}</div>
              <div className="analyticsList">
                {userTotals.slice(0, 5).map((item) => <span key={item.key}>{item.label}<b>{formatDuration(item.total)}</b></span>)}
              </div>
            </article>

            <article className="analyticsCard wide">
              <div className="analyticsCardHead">
                <span>Daily tracked minutes</span>
                <strong>Last 14 days</strong>
              </div>
              <div className="analyticsChart trend"><canvas ref={dailyBarRef} /></div>
            </article>
          </div>
        </>
      )}

      {reportTab === 'Detailed' && (
        <article className="analyticsCard reportTableCard">
          <div className="analyticsCardHead">
            <span>Detailed time entries</span>
            <strong>{formatDuration(totalTime)}</strong>
          </div>
          <div className="reportTable detailedReportTable">
            <div className="reportTableHead">
              <span>User</span>
              <span>Client</span>
              <span>Project</span>
              <span>Task</span>
              <span>Description</span>
              <span>Date</span>
              <span>Time</span>
              <span>Total</span>
            </div>
            {detailedEntries.map((entry) => (
              <div className="reportTableRow" key={entry.id}>
                <span>{entry.userName || 'Unknown user'}</span>
                <span>{entry.clientName || 'No client'}</span>
                <span><i style={{ background: entry.projectColor }} />{entry.projectName || 'Untitled project'}</span>
                <span>{entry.subtask || 'No task'}</span>
                <span>{entry.notes || 'No comments'}</span>
                <span>{entry.date}</span>
                <span>{formatClock(entry.startTime)} - {entry.endTime ? formatClock(entry.endTime) : 'Running'}</span>
                <strong>{formatDuration(entry.duration)}</strong>
              </div>
            ))}
            {!detailedEntries.length && <em>No entries match these filters</em>}
          </div>
        </article>
      )}

      {reportTab === 'Weekly' && (
        <article className="analyticsCard reportTableCard">
          <div className="analyticsCardHead">
            <span>Weekly totals</span>
            <strong>{formatDuration(totalTime)}</strong>
          </div>
          <div className="reportTable weeklyReportTable">
            <div className="reportTableHead">
              <span>Week</span>
              <span>Entries</span>
              <span>Total</span>
            </div>
            {weeklyTotals.map((week) => (
              <div className="reportTableRow" key={week.key}>
                <span>{week.label}</span>
                <span>{week.entries} {week.entries === 1 ? 'entry' : 'entries'}</span>
                <strong>{formatDuration(week.total)}</strong>
              </div>
            ))}
            {!weeklyTotals.length && <em>No weekly time matches these filters</em>}
          </div>
        </article>
      )}

      {reportTab === 'Shared' && (
        <article className="analyticsCard reportTableCard">
          <div className="analyticsCardHead">
            <span>Shared report</span>
            <strong>{formatDuration(totalTime)}</strong>
          </div>
          <div className="reportTable sharedReportTable">
            <div className="reportTableHead">
              <span>User</span>
              <span>Client</span>
              <span>Project</span>
              <span>Entries</span>
              <span>Total</span>
            </div>
            {sharedTotals.map((item, index) => (
              <div className="reportTableRow" key={item.key}>
                <span>{item.label}</span>
                <span>{item.clientName}</span>
                <span><i style={{ background: item.color || chartColors[index % chartColors.length] }} />{item.projectName}</span>
                <span>{item.entries} {item.entries === 1 ? 'entry' : 'entries'}</span>
                <strong>{formatDuration(item.total)}</strong>
              </div>
            ))}
            {!sharedTotals.length && <em>No shared report data matches these filters</em>}
          </div>
        </article>
      )}
    </section>
  );
}
