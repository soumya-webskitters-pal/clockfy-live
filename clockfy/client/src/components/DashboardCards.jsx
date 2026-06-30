import { Briefcase, CalendarClock, Clock, Timer } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { formatDuration } from '../utils/time.js';

export default function DashboardCards() {
  const { dashboard, entries, currentUser } = useApp();
  const visibleEntries = currentUser?.role === 'user' ? entries.filter((entry) => entry.userId === currentUser.id) : entries;
  const today = new Date().toISOString().slice(0, 10);
  const weekStart = new Date();
  const day = weekStart.getDay();
  weekStart.setDate(weekStart.getDate() - day + (day === 0 ? -6 : 1));
  weekStart.setHours(0, 0, 0, 0);
  const month = today.slice(0, 7);
  const sum = (items) => items.reduce((total, entry) => total + Number(entry.duration || 0), 0);
  const totals = currentUser?.role === 'user' ? {
    todayTotal: sum(visibleEntries.filter((entry) => entry.date === today)),
    weekTotal: sum(visibleEntries.filter((entry) => new Date(entry.startTime) >= weekStart)),
    monthTotal: sum(visibleEntries.filter((entry) => entry.date.startsWith(month))),
    totalProjects: new Set(visibleEntries.map((entry) => entry.projectId)).size
  } : dashboard;
  const cards = [
    ['Today', formatDuration(totals?.todayTotal), Timer],
    ['This Week', formatDuration(totals?.weekTotal), Clock],
    ['This Month', formatDuration(totals?.monthTotal), CalendarClock],
    ['Projects', totals?.totalProjects || 0, Briefcase]
  ];
  return (
    <section className="dashboardGrid">
      {cards.map(([label, value, Icon]) => (
        <article className="metric" key={label}>
          <Icon size={18} />
          <span>{label}</span>
          <strong>{value}</strong>
        </article>
      ))}
    </section>
  );
}
