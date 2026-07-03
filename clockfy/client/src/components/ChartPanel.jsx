import { BarController, BarElement, CategoryScale, Chart as ChartJS, LinearScale, Tooltip } from 'chart.js';
import { useEffect, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext.jsx';

ChartJS.register(BarController, CategoryScale, LinearScale, BarElement, Tooltip);

function toDateKey(value = new Date()) {
  return new Date(value).toISOString().slice(0, 10);
}

function buildSeries(entries) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = toDateKey(date);
    const total = entries
      .filter((entry) => entry.date === key)
      .reduce((sum, entry) => sum + Number(entry.duration || 0), 0);
    return { date: key, total };
  });
}

export default function ChartPanel() {
  const { dashboard, entries, currentUser } = useApp();
  const canvasRef = useRef(null);
  const weeklySeries = useMemo(() => {
    if (currentUser?.role === 'admin') return dashboard?.weeklySeries || [];
    return buildSeries(entries.filter((entry) => entry.userId === currentUser?.id));
  }, [currentUser, dashboard, entries]);

  useEffect(() => {
    if (!canvasRef.current || !weeklySeries.length) return undefined;
    const chart = new ChartJS(canvasRef.current, {
      type: 'bar',
      data: {
        labels: weeklySeries.map((item) => item.date.slice(5)),
        datasets: [{ data: weeklySeries.map((item) => Math.round(item.total / 60)), backgroundColor: '#25baeb', borderRadius: 4 }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { grid: { display: false } }, y: { grid: { color: '#edf3f7' } } }
      }
    });
    return () => chart.destroy();
  }, [weeklySeries]);

  return (
    <section className="chartPanel">
      <div>
        <h2>Weekly productivity</h2>
        <span>Minutes tracked per day</span>
      </div>
      <canvas ref={canvasRef} />
    </section>
  );
}
