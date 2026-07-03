import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api.js';
import { toDateKey } from '../utils/time.js';

const AppContext = createContext(null);
const timeEditorRoles = new Set(['admin', 'super-user']);

export function AppProvider({ children }) {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
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
  const [activePage, setActivePage] = useState('home');
  const [timerRequest, setTimerRequest] = useState(null);
  const [activeTimer, setActiveTimer] = useState(null);
  const [timerCommand, setTimerCommand] = useState(null);

  const notify = useCallback((message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2600);
  }, []);

  const refresh = useCallback(async () => {
    const [userData, projectData, clientData, entryData] = await Promise.all([api.getUsers(), api.getProjects(), api.getClients(), api.getEntries()]);
    const dashboardData = await api.getDashboard();
    setUsers(userData);
    setProjects(projectData);
    setClients(clientData);
    setEntries(entryData);
    setDashboard(dashboardData);
    setSelectedProjectId((current) => current || projectData[0]?.id || '');
  }, []);

  useEffect(() => {
    refresh().catch((error) => notify(error.message)).finally(() => setLoading(false));
  }, [notify, refresh]);

  const createProject = async (payload) => {
    if (!timeEditorRoles.has(currentUser?.role)) {
      notify('Only admin or super-user can add tasks');
      return;
    }
    const project = await api.createProject(payload);
    await refresh();
    setSelectedProjectId(project.id);
    notify('Project created');
  };

  const updateProject = async (id, payload) => {
    if (!timeEditorRoles.has(currentUser?.role)) {
      notify('Only admin or super-user can update tasks');
      return;
    }
    await api.updateProject(id, payload);
    await refresh();
    notify('Project updated');
  };

  const deleteProject = async (id) => {
    if (!timeEditorRoles.has(currentUser?.role)) {
      notify('Only admin or super-user can delete tasks');
      return;
    }
    await api.deleteProject(id);
    await refresh();
    notify('Project deleted');
  };

  const createClient = async (payload) => {
    if (!timeEditorRoles.has(currentUser?.role)) {
      notify('Only admin or super-user can add clients');
      return;
    }
    await api.createClient(payload);
    await refresh();
    notify('Client created');
  };

  const updateClient = async (id, payload) => {
    if (!timeEditorRoles.has(currentUser?.role)) {
      notify('Only admin or super-user can update clients');
      return;
    }
    await api.updateClient(id, payload);
    await refresh();
    notify('Client updated');
  };

  const deleteClient = async (id) => {
    if (!timeEditorRoles.has(currentUser?.role)) {
      notify('Only admin or super-user can delete clients');
      return;
    }
    await api.deleteClient(id);
    await refresh();
    notify('Client deleted');
  };

  const createEntry = async (payload) => {
    if (!currentUser || currentUser.role === 'admin') {
      notify('Choose a user before tracking time');
      return;
    }
    const entry = await api.createEntry({ ...payload, userId: currentUser.id });
    await refresh();
    notify(payload.endTime ? 'Time saved' : 'Timer started');
    return entry;
  };

  const stopEntry = async (id, payload) => {
    await api.updateEntry(id, payload);
    await refresh();
    notify('Time saved');
  };

  const deleteTimerEntry = async (id) => {
    await api.deleteEntry(id, 'timer');
    await refresh();
    notify('Timer discarded');
  };

  const updateEntry = async (id, payload) => {
    if (!timeEditorRoles.has(currentUser?.role)) {
      notify('Only admin or super-user can modify time');
      return;
    }
    await api.updateEntry(id, { ...payload, actorRole: currentUser.role });
    await refresh();
    notify('Entry updated');
  };

  const deleteEntry = async (id) => {
    if (!timeEditorRoles.has(currentUser?.role)) {
      notify('Only admin or super-user can delete time');
      return;
    }
    await api.deleteEntry(id, currentUser.role);
    await refresh();
    notify('Entry deleted');
  };

  const startTimerFromEntry = (entry) => {
    setMode(currentUser?.role === 'super-user' ? 'super-user' : 'user');
    if (currentUser?.role === 'admin') {
      notify('Login as a user to track time');
      return;
    }
    setSelectedProjectId(entry.projectId);
    setTimerRequest({
      id: `${entry.id}-${Date.now()}`,
      sourceEntryId: entry.id,
      projectId: entry.projectId,
      subtask: entry.subtask || '',
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
    setActivePage('home');
    notify(`Logged in as ${user.name}`);
  };

  const createUser = async (payload) => {
    if (currentUser?.role !== 'admin') {
      notify('Only admin can create users');
      return null;
    }
    const result = await api.createUser(payload);
    await refresh();
    notify(`User created: ${result.credential.loginId}`);
    return result;
  };

  const updateUserPassword = async (id, password) => {
    if (currentUser?.role !== 'admin') {
      notify('Only admin can update user passwords');
      return;
    }
    await api.updateUserPassword(id, { password });
    await refresh();
    notify('Password updated');
  };

  const updateUserRole = async (id, role) => {
    if (currentUser?.role !== 'admin') {
      notify('Only admin can change user mode');
      return;
    }
    await api.updateUserRole(id, { role });
    await refresh();
    notify('User mode updated');
  };

  const deleteUser = async (id) => {
    if (currentUser?.role !== 'admin') {
      notify('Only admin can remove users');
      return;
    }
    await api.deleteUser(id);
    await refresh();
    notify('User removed');
  };

  const logout = () => {
    setCurrentUser(null);
    setMode('user');
    setActivePage('home');
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
    clients,
    users,
    entries,
    currentUser,
    createUser,
    updateUserPassword,
    updateUserRole,
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
    activePage,
    setActivePage,
    timerRequest,
    activeTimer,
    setActiveTimer,
    timerCommand,
    createProject,
    updateProject,
    deleteProject,
    createClient,
    updateClient,
    deleteClient,
    createEntry,
    stopEntry,
    deleteTimerEntry,
    updateEntry,
    deleteEntry,
    startTimerFromEntry,
    pauseTargetTimer,
    deleteTargetTimer,
    exportData,
    importData
  }), [projects, clients, users, entries, dashboard, currentUser, selectedProjectId, search, filter, customDate, loading, toast, darkMode, mode, activePage, timerRequest, activeTimer, timerCommand]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}
