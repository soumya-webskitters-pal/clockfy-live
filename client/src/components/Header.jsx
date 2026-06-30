import { Bell, CircleHelp, Grid3X3, LogOut, Moon, Settings, Sun } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';

export default function Header() {
  const { darkMode, setDarkMode, currentUser, logout } = useApp();
  const initials = currentUser?.name?.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'U';
  return (
    <header className="topbar">
      <div className="brandArea">
        <Grid3X3 size={20} />
        <div className="logoMark">C</div>
        <strong className="wordmark">clockify</strong>
        <div className="workspace">Webskitters</div>
        <span className="dots">•••</span>
      </div>
      <div className="topActions">
        <div className="modeSwitch" aria-label="Current login">
          <span>{currentUser?.role === 'admin' ? 'Admin' : 'User'}</span>
          <strong>{currentUser?.name}</strong>
        </div>
        <button aria-label="settings"><Settings size={18} /></button>
        <button aria-label="notifications"><Bell size={18} /></button>
        <button aria-label="help"><CircleHelp size={18} /></button>
        <button aria-label="theme" onClick={() => setDarkMode(!darkMode)}>{darkMode ? <Sun size={18} /> : <Moon size={18} />}</button>
        <button aria-label="logout" onClick={logout}><LogOut size={18} /></button>
        <span className="avatar">{initials}</span>
      </div>
    </header>
  );
}
