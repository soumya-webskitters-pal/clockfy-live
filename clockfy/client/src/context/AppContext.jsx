import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api.js';
import { toDateKey } from '../utils/time.js';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [entries, setEntries] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [customDate, setCustomDate] = useState(toDateKey());
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [mode, setMode] = useState('user');
  const [currentUser, setCurrentUser] = useState(null);
  const [timerRequest, setTimerRequest] = useState(null);
  const [activeTimer, setActiveTimer] = useState(null);
  const [timerCommand, setTimerCommand] = useState(null);

  const notify = useCallback((message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2600);
  }, []);

  const refresh = useCallback(async () => {
    const [userData, projectData, entryData, dashboardData] = await Promise.all([api.getUsers(), api.getProjects(), api.getEntries(), api.getDashboard()]);
    setUsers(userData);
    setProjects(projectData);
    setEntries(entryData);
    setDashboard(dashboardData);
    setSelectedProjectId((current) => current || projectData[0]?.id || '');
  }, []);

  useEffect(() => {
    refresh().catch((error) => notify(error.message)).finally(() => setLoading(false));
  }, [notify, refresh]);

  const createProject = async (payload) => {
    const project = await api.createProject(payload);
    await refresh();
    setSelectedProjectId(project.id);
    notify('Project created');
  };

  const updateProject = async (id, payload) => {
    await api.updateProject(id, payload);
    await refresh();
    notify('Project updated');
  };

  const deleteProject = async (id) => {
    await api.deleteProject(id);
    await refresh();
    notify('Project deleted');
  };

  const createEntry = async (payload) => {
    if (!currentUser || currentUser.role !== 'user') {
      notify('Choose a user before tracking time');
      return;
    }
    await api.createEntry({ ...payload, userId: currentUser.id });
    await refresh();
    notify('Time saved');
  };

  const updateEntry = async (id, payload) => {
    if (currentUser?.role !== 'admin') {
      notify('Only admin can modify time');
      return;
    }
    await api.updateEntry(id, { ...payload, actorRole: currentUser.role });
    await refresh();
    notify('Entry updated');
  };

  const deleteEntry = async (id) => {
    if (currentUser?.role !== 'admin') {
      notify('Only admin can delete time');
      return;
    }
    await api.deleteEntry(id, currentUser.role);
    await refresh();
    notify('Entry deleted');
  };

  const startTimerFromEntry = (entry) => {
    setMode('user');
    if (currentUser?.role === 'admin') {
      notify('Login as a user to track time');
      return;
    }
    setSelectedProjectId(entry.projectId);
    setTimerRequest({
      id: `${entry.id}-${Date.now()}`,
      sourceEntryId: entry.id,
      projectId: entry.projectId,
      notes: entry.notes || ''
    });
    notify('Timer started for same project');
  };

  const pauseTargetTimer = (entry) => {
    if (activeTimer?.sourceEntryId !== entry.id || activeTimer.status !== 'running') {
      notify('No running timer for this block');
      return;
    }
    setTimerCommand({ id: `${entry.id}-pause-${Date.now()}`, action: 'pause', sourceEntryId: entry.id });
  };

  const deleteTargetTimer = (entry) => {
    if (activeTimer?.sourceEntryId !== entry.id) {
      notify('No active timer for this block');
      return;
    }
    setTimerCommand({ id: `${entry.id}-delete-${Date.now()}`, action: 'delete', sourceEntryId: entry.id });
  };

  const login = async (credentials) => {
    const user = await api.login(credentials);
    setCurrentUser(user);
    setMode(user.role);
    notify(`Logged in as ${user.name}`);
  };

  const createUser = async (payload) => {
    const result = await api.createUser(payload);
    await refresh();
    notify(`User created: ${result.credential.loginId}`);
    return result;
  };

  const updateUserPassword = async (id, password) => {
    await api.updateUserPassword(id, { password });
    await refresh();
    notify('Password updated');
  };

  const deleteUser = async (id) => {
    await api.deleteUser(id);
    await refresh();
    notify('User removed');
  };

  const logout = () => {
    setCurrentUser(null);
    setMode('user');
    setTimerRequest(null);
  };

  const exportData = async () => {
    const data = await api.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'time-tracking.json';
    anchor.click();
    URL.revokeObjectURL(url);
    notify('Backup downloaded');
  };

  const importData = async (file, restore = false) => {
    const payload = JSON.parse(await file.text());
    restore ? await api.restoreData(payload) : await api.importData(payload);
    await refresh();
    notify(restore ? 'Data restored' : 'Data imported');
  };

  const value = useMemo(() => ({
    projects,
    users,
    entries,
    currentUser,
    createUser,
    updateUserPassword,
    deleteUser,
    login,
    logout,
    dashboard,
    selectedProjectId,
    setSelectedProjectId,
    search,
    setSearch,
    filter,
    setFilter,
    customDate,
    setCustomDate,
    loading,
    toast,
    darkMode,
    setDarkMode,
    mode,
    setMode,
    timerRequest,
    activeTimer,
    setActiveTimer,
    timerCommand,
    createProject,
    updateProject,
    deleteProject,
    createEntry,
    updateEntry,
    deleteEntry,
    startTimerFromEntry,
    pauseTargetTimer,
    deleteTargetTimer,
    exportData,
    importData
  }), [projects, users, entries, dashboard, currentUser, selectedProjectId, search, filter, customDate, loading, toast, darkMode, mode, timerRequest, activeTimer, timerCommand]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}
