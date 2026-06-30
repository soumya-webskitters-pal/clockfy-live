import DashboardCards from './components/DashboardCards.jsx';
import FilterBar from './components/FilterBar.jsx';
import Header from './components/Header.jsx';
import HistoryTable from './components/HistoryTable.jsx';
import ProjectList from './components/ProjectList.jsx';
import SearchBar from './components/SearchBar.jsx';
import Sidebar from './components/Sidebar.jsx';
import Timer from './components/Timer.jsx';
import ChartPanel from './components/ChartPanel.jsx';
import AdminPanel from './components/AdminPanel.jsx';
import LoginBox from './components/LoginBox.jsx';
import AdminCreateUserPanel from './components/AdminCreateUserPanel.jsx';
import { useApp } from './context/AppContext.jsx';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.js';

export default function App() {
  const { loading, toast, darkMode, mode, currentUser } = useApp();
  useKeyboardShortcuts({ onNewProject: () => mode === 'admin' && document.querySelector('.projectForm input')?.focus() });

  if (!currentUser) {
    return (
      <div className={`app ${darkMode ? 'dark' : ''}`}>
        <LoginBox />
        {toast && <div className="toast">{toast}</div>}
      </div>
    );
  }

  return (
    <div className={`app ${darkMode ? 'dark' : ''}`}>
      <Header />
      <Sidebar />
      <main className="main">
        {mode === 'user' && <Timer />}
        <section className={`workspaceGrid ${mode === 'admin' ? 'adminWorkspace' : 'userWorkspace'}`}>
          {mode === 'admin' && (
            <div className="adminSideRail">
              <ProjectList />
              <AdminCreateUserPanel />
            </div>
          )}
          <div className="contentFlow">
            {mode === 'admin' && <AdminPanel />}
            <DashboardCards />
            <div className="toolRow">
              <SearchBar />
              <FilterBar />
            </div>
            {loading ? <div className="skeleton">Loading time entries...</div> : <HistoryTable />}
            <ChartPanel />
          </div>
        </section>
      </main>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
