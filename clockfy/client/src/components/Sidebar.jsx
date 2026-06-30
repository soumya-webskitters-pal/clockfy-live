import { BarChart3, CalendarDays, ChevronRight, Clock3, FileText, Grid2X2, TimerReset, Users } from 'lucide-react';

const icons = [TimerReset, Clock3, CalendarDays, Grid2X2, BarChart3, FileText, Users];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      {icons.map((Icon, index) => (
        <button className={index === 0 ? 'active' : ''} key={index} title="Navigation">
          <Icon size={20} />
        </button>
      ))}
      <button className="collapse" title="Collapse"><ChevronRight size={18} /></button>
    </aside>
  );
}
