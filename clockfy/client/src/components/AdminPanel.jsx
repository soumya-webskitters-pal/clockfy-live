import { ArcElement, Chart as ChartJS, PieController, Tooltip } from 'chart.js';
import { ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { formatDuration } from '../utils/time.js';

ChartJS.register(PieController, ArcElement, Tooltip);

export default function AdminPanel() {
  const { entries, projects, users } = useApp();
  const pieRef = useRef(null);
  const [userId, setUserId] = useState('all');
  const [projectId, setProjectId] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const normalUsers = users.filter((user) => user.role === 'user');
  const filteredEntries = useMemo(() => entries.filter((entry) => {
    const afterStart = !fromDate || entry.date >= fromDate;
    const beforeEnd = !toDate || entry.date <= toDate;
    const matchesUser = userId === 'all' || entry.userId === userId;
    const matchesProject = projectId === 'all' || entry.projectId === projectId;
    return afterStart && beforeEnd && matchesUser && matchesProject;
  }), [entries, fromDate, projectId, toDate, userId]);
  const totals = useMemo(() => {
    const map = new Map();
    filteredEntries.forEach((entry) => {
      const key = `${entry.userId}-${entry.projectId || entry.projectName}`;
      const current = map.get(key) || {
        userName: entry.userName || 'Unknown user',
        projectName: entry.projectName,
        projectColor: entry.projectColor,
        duration: 0,
        entries: 0,
        lastTracked: entry.startTime
      };
      current.duration += Number(entry.duration || 0);
      current.entries += 1;
      current.lastTracked = new Date(entry.startTime) > new Date(current.lastTracked) ? entry.startTime : current.lastTracked;
      map.set(key, current);
    });
    return [...map.values()].sort((a, b) => b.duration - a.duration);
  }, [filteredEntries]);

  const totalTime = totals.reduce((sum, item) => sum + item.duration, 0);
  const projectName = projectId === 'all' ? 'all projects' : projects.find((project) => project.id === projectId)?.name || 'selected project';
  const userWorkload = useMemo(() => {
    const map = new Map();
    filteredEntries.forEach((entry) => {
      const current = map.get(entry.userId) || {
        userName: entry.userName || 'Unknown user',
        duration: 0,
        entries: 0
      };
      current.duration += Number(entry.duration || 0);
      current.entries += 1;
      map.set(entry.userId, current);
    });
    return [...map.values()].sort((a, b) => b.duration - a.duration);
  }, [filteredEntries]);
  const topWorker = userWorkload[0];
  const pieColors = ['#25baeb', '#10b981', '#f59e0b', '#5264d8', '#ef4444', '#8b5cf6', '#14b8a6'];

  useEffect(() => {
    if (userId !== 'all' && !normalUsers.some((user) => user.id === userId)) {
      setUserId('all');
    }
  }, [normalUsers, userId]);

  useEffect(() => {
    if (!pieRef.current) return undefined;
    if (!userWorkload.length) return undefined;

    const chart = new ChartJS(pieRef.current, {
      type: 'pie',
      data: {
        labels: userWorkload.map((item) => item.userName),
        datasets: [{
          data: userWorkload.map((item) => item.duration),
          backgroundColor: userWorkload.map((_, index) => pieColors[index % pieColors.length]),
          borderColor: '#ffffff',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => {
                const item = userWorkload[context.dataIndex];
                return `${item.userName}: ${formatDuration(item.duration)}`;
              }
            }
          }
        }
      }
    });
    return () => chart.destroy();
  }, [userWorkload]);

  return (
    <section className="adminPanel">
      <div className="adminPanelHead">
        <div>
          <span><ShieldCheck size={17} /> Admin panel</span>
          <h2>Project tracking totals</h2>
        </div>
        <div className="adminTotals">
          <strong>{formatDuration(totalTime)}</strong>
          <small>{projects.length} projects · {entries.length} entries</small>
        </div>
      </div>
      <div className="adminFilters">
        <label>
          User
          <select value={userId} onChange={(event) => setUserId(event.target.value)}>
            <option value="all">All users</option>
            {normalUsers.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
          </select>
        </label>
        <label>
          Project
          <select value={projectId} onChange={(event) => setProjectId(event.target.value)}>
            <option value="all">All projects</option>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
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
      <div className="adminWorkloadChart">
        <div className="adminChartCopy">
          <span>Most worked</span>
          <strong>{topWorker ? topWorker.userName : 'No tracked time'}</strong>
          <small>
            {topWorker
              ? `${formatDuration(topWorker.duration)} in ${projectName}`
              : `No entries found for ${projectName}`}
          </small>
        </div>
        <div className="adminPieWrap">
          {userWorkload.length ? <canvas ref={pieRef} /> : <div className="adminChartEmpty">No data</div>}
        </div>
        <div className="adminChartLegend">
          {userWorkload.map((item, index) => (
            <span key={item.userName}>
              <i style={{ background: pieColors[index % pieColors.length] }} />
              {item.userName}
              <b>{formatDuration(item.duration)}</b>
            </span>
          ))}
        </div>
      </div>
      <div className="adminTable">
        <div className="adminTableHead">
          <span>User</span>
          <span>Project</span>
          <span>Entries</span>
          <span>Last tracked</span>
          <span>Total</span>
        </div>
        {totals.map((project) => (
          <div className="adminTableRow" key={`${project.userName}-${project.projectName}`}>
            <span>{project.userName}</span>
            <span className="adminProject"><i style={{ background: project.projectColor }} />{project.projectName}</span>
            <span>{project.entries}</span>
            <span>{new Date(project.lastTracked).toLocaleDateString()}</span>
            <strong>{formatDuration(project.duration)}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
