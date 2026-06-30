import { getEntries, getProjects } from '../services/store.js';
import { monthStart, toDateKey, weekStart } from '../utils/time.js';

function sum(entries) {
  return entries.reduce((total, entry) => total + Number(entry.duration || 0), 0);
}

export function getDashboard(_req, res) {
  const entries = getEntries();
  const today = toDateKey();
  const week = weekStart();
  const month = monthStart(new Date());
  res.json({
    todayTotal: sum(entries.filter((entry) => entry.date === today)),
    weekTotal: sum(entries.filter((entry) => new Date(entry.startTime) >= week)),
    monthTotal: sum(entries.filter((entry) => new Date(entry.startTime) >= month)),
    totalProjects: getProjects().length,
    weeklySeries: buildSeries(entries, 7),
    monthlySeries: buildSeries(entries, 30)
  });
}

function buildSeries(entries, days) {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - index));
    const key = toDateKey(date);
    return { date: key, total: sum(entries.filter((entry) => entry.date === key)) };
  });
}
