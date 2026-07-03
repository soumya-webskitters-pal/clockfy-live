import DashboardCards from './components/DashboardCards.jsx';
import FilterBar from './components/FilterBar.jsx';
import Header from './components/Header.jsx';
import HistoryTable from './components/HistoryTable.jsx';
import ProjectList from './components/ProjectList.jsx';
import SearchBar from './components/SearchBar.jsx';
import Sidebar from './components/Sidebar.jsx';
import Timer from './components/Timer.jsx';
import ChartPanel from './components/ChartPanel.jsx';
import LoginBox from './components/LoginBox.jsx';
import AdminCreateUserPanel from './components/AdminCreateUserPanel.jsx';
import AdminCredentialsPanel from './components/AdminCredentialsPanel.jsx';
import SuperUserReviewPanel from './components/SuperUserReviewPanel.jsx';
import AdminAnalyticsPanel from './components/AdminAnalyticsPanel.jsx';
import { useApp } from './context/AppContext.jsx';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.js';
import { useEffect } from 'react';

export default function App() {
  const { loading, toast, darkMode, mode, currentUser, activePage, setActivePage } = useApp();
  const canManageTasks = ['admin', 'super-user'].includes(mode);
  const canTrackTime = currentUser?.role !== 'admin';
  const isAdminTimePage = mode === 'admin' && activePage === 'home';
  const isAdminAnalyticsPage = mode === 'admin' && activePage === 'admin-analytics';
  const isAdminTasksPage = mode === 'admin' && activePage === 'admin-tasks';
  const isAdminUsersPage = mode === 'admin' && activePage === 'admin-users';
  const isSuperTimePage = mode === 'super-user' && activePage === 'super-time';
  const isSuperStatsPage = mode === 'super-user' && activePage === 'super-stats';
  const isSuperTasksPage = mode === 'super-user' && activePage === 'super-tasks';
  useKeyboardShortcuts({ onNewProject: () => canManageTasks && document.querySelector('.projectForm input')?.focus() });

  useEffect(() => {
    if (mode !== 'super-user' && ['team', 'super-time', 'super-stats', 'super-tasks'].includes(activePage)) setActivePage('home');
    if (mode === 'super-user' && activePage === 'team') setActivePage('home');
    if (mode !== 'admin' && ['admin-analytics', 'admin-tasks', 'admin-users'].includes(activePage)) setActivePage('home');
  }, [activePage, mode, setActivePage]);

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
      <main className="main hasSidebar">
        {!isAdminTimePage && !isAdminAnalyticsPage && !isAdminTasksPage && !isAdminUsersPage && !isSuperTimePage && !isSuperStatsPage && !isSuperTasksPage && canTrackTime && <Timer />}
        {isAdminTimePage || isSuperTimePage ? (
          <SuperUserReviewPanel />
        ) : isAdminAnalyticsPage || isSuperStatsPage ? (
          <AdminAnalyticsPanel />
        ) : isAdminTasksPage || isSuperTasksPage ? (
          <section className="singlePanelPage">
            <ProjectList />
          </section>
        ) : isAdminUsersPage ? (
          <section className="singlePanelPage userAdminPage">
            <AdminCreateUserPanel />
            <AdminCredentialsPanel />
          </section>
        ) : (
        <section className="workspaceGrid userWorkspace">
          <div className="contentFlow">
            <DashboardCards />
            <div className="toolRow">
              <SearchBar />
              <FilterBar />
            </div>
            {loading ? <div className="skeleton">Loading time entries...</div> : <HistoryTable />}
            <ChartPanel />
          </div>
        </section>
        )}
      </main>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
