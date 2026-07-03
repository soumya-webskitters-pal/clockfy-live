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
import { BarChart3, Briefcase, Clock, Trophy, UsersRound } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { formatDuration } from '../utils/time.js';

ChartJS.register(ArcElement, BarController, BarElement, CategoryScale, LinearScale, PieController, Tooltip);

const chartColors = ['#25baeb', '#10b981', '#f59e0b', '#5264d8', '#ef4444', '#8b5cf6', '#14b8a6', '#f43f5e'];

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

function useChart(ref, config, deps) {
  useEffect(() => {
    if (!ref.current || !config) return undefined;
    const chart = new ChartJS(ref.current, config);
    return () => chart.destroy();
  }, deps);
}

export default function AdminAnalyticsPanel() {
  const { entries, projects, users, currentUser } = useApp();
  const projectPieRef = useRef(null);
  const userBarRef = useRef(null);
  const dailyBarRef = useRef(null);
  const [userId, setUserId] = useState('all');
  const [projectId, setProjectId] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const trackableUsers = users.filter((user) => user.role !== 'admin');
  const filteredEntries = useMemo(() => entries.filter((entry) => {
    const matchesUser = userId === 'all' || entry.userId === userId;
    const matchesProject = projectId === 'all' || entry.projectId === projectId;
    const afterStart = !fromDate || entry.date >= fromDate;
    const beforeEnd = !toDate || entry.date <= toDate;
    return matchesUser && matchesProject && afterStart && beforeEnd;
  }), [entries, fromDate, projectId, toDate, userId]);

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

  const dailySeries = useMemo(() => buildDailySeries(filteredEntries), [filteredEntries]);
  const totalTime = sumEntries(filteredEntries);
  const topProject = projectTotals[0];
  const topUser = userTotals[0];
  const averagePerEntry = filteredEntries.length ? Math.round(totalTime / filteredEntries.length) : 0;

  useChart(projectPieRef, projectTotals.length && {
    type: 'pie',
    data: {
      labels: projectTotals.slice(0, 8).map((item) => item.label),
      datasets: [{
        data: projectTotals.slice(0, 8).map((item) => item.total),
        backgroundColor: projectTotals.slice(0, 8).map((item, index) => item.color || chartColors[index % chartColors.length]),
        borderColor: '#ffffff',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } }
    }
  }, [projectTotals]);

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
      scales: { x: { grid: { display: false } }, y: { grid: { color: '#edf3f7' } } }
    }
  }, [userTotals]);

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
      scales: { x: { grid: { display: false } }, y: { grid: { color: '#edf3f7' } } }
    }
  }, [dailySeries]);

  return (
    <section className="analyticsPanel">
      <div className="analyticsHead">
        <div>
          <span><BarChart3 size={17} /> {currentUser?.role === 'super-user' ? 'Super-user stats' : 'Admin analytics'}</span>
          <h2>Time performance overview</h2>
        </div>
        <strong>{formatDuration(totalTime)}</strong>
      </div>

      <div className="analyticsMetrics">
        <article><Clock size={17} /><span>Total time</span><strong>{formatDuration(totalTime)}</strong></article>
        <article><Briefcase size={17} /><span>Projects worked</span><strong>{projectTotals.length}</strong></article>
        <article><UsersRound size={17} /><span>Users worked</span><strong>{userTotals.length}</strong></article>
        <article><Trophy size={17} /><span>Avg entry</span><strong>{formatDuration(averagePerEntry)}</strong></article>
      </div>

      <div className="analyticsFilters">
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
    </section>
  );
}
