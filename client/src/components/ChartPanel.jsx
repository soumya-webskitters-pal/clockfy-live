import { BarController, BarElement, CategoryScale, Chart as ChartJS, LinearScale, Tooltip } from 'chart.js';
import { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext.jsx';

ChartJS.register(BarController, CategoryScale, LinearScale, BarElement, Tooltip);

export default function ChartPanel() {
  const { dashboard } = useApp();
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !dashboard?.weeklySeries) return undefined;
    const chart = new ChartJS(canvasRef.current, {
      type: 'bar',
      data: {
        labels: dashboard.weeklySeries.map((item) => item.date.slice(5)),
        datasets: [{ data: dashboard.weeklySeries.map((item) => Math.round(item.total / 60)), backgroundColor: '#25baeb', borderRadius: 4 }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { grid: { display: false } }, y: { grid: { color: '#edf3f7' } } }
      }
    });
    return () => chart.destroy();
  }, [dashboard]);

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
