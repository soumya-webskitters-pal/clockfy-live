import { BarChart3, Clock3, FolderKanban, UserPlus } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';

export default function Sidebar() {
  const { currentUser, activePage, setActivePage } = useApp();
  if (!currentUser) return null;
  const isAdmin = currentUser.role === 'admin';
  const isSuperUser = currentUser.role === 'super-user';

  return (
    <aside className="sidebar">
      <button
        className={activePage === 'home' || activePage === 'admin-time' ? 'active' : ''}
        onClick={() => setActivePage('home')}
        title={isAdmin ? 'All time' : 'My data'}
        aria-label={isAdmin ? 'All time' : 'My data'}
      >
        <Clock3 size={21} />
        <span>{isAdmin ? 'Time' : 'Tracker'}</span>
      </button>
      {isAdmin && (
      <>
        <button
          className={activePage === 'admin-analytics' ? 'active' : ''}
          onClick={() => setActivePage('admin-analytics')}
          title="Analytics"
          aria-label="Analytics"
        >
          <BarChart3 size={21} />
          <span>Stats</span>
        </button>
        <button
          className={activePage === 'admin-tasks' ? 'active' : ''}
          onClick={() => setActivePage('admin-tasks')}
          title="Tasks"
          aria-label="Tasks"
        >
          <FolderKanban size={21} />
          <span>Tasks</span>
        </button>
        <button
          className={activePage === 'admin-users' ? 'active' : ''}
          onClick={() => setActivePage('admin-users')}
          title="Users"
          aria-label="Users"
        >
          <UserPlus size={21} />
          <span>Users</span>
        </button>
      </>
      )}
      {isSuperUser && (
      <>
        <button
          className={activePage === 'super-time' ? 'active' : ''}
          onClick={() => setActivePage('super-time')}
          title="Time management"
          aria-label="Time management"
        >
          <Clock3 size={21} />
          <span>Time</span>
        </button>
        <button
          className={activePage === 'super-stats' ? 'active' : ''}
          onClick={() => setActivePage('super-stats')}
          title="Stats"
          aria-label="Stats"
        >
          <BarChart3 size={21} />
          <span>Stats</span>
        </button>
        <button
          className={activePage === 'super-tasks' ? 'active' : ''}
          onClick={() => setActivePage('super-tasks')}
          title="Tasks"
          aria-label="Tasks"
        >
          <FolderKanban size={21} />
          <span>Tasks</span>
        </button>
      </>
      )}
    </aside>
  );
}
