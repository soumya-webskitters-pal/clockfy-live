import { MoreVertical, Pause, Play, RotateCcw, Square } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { formatDuration } from '../utils/time.js';
import Button from './Button.jsx';

export default function Timer() {
  const { projects, clients, selectedProjectId, setSelectedProjectId, createEntry, stopEntry, deleteTimerEntry, timerRequest, activeTimer, timerCommand, setActiveTimer } = useApp();
  const [notes, setNotes] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedSubtask, setSelectedSubtask] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [activeEntryId, setActiveEntryId] = useState(null);
  const [pausedSeconds, setPausedSeconds] = useState(0);
  const [pauseStarted, setPauseStarted] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const selectedProject = useMemo(() => projects.find((project) => project.id === selectedProjectId), [projects, selectedProjectId]);
  const clientProjects = useMemo(() => projects.filter((project) => project.clientId === selectedClientId), [projects, selectedClientId]);
  const status = !startTime ? 'idle' : pauseStarted ? 'paused' : 'running';
  const elapsed = startTime ? Math.max(0, Math.floor((now - startTime.getTime()) / 1000) - pausedSeconds - (pauseStarted ? Math.floor((now - pauseStarted) / 1000) : 0)) : 0;
  const canStart = Boolean(
    selectedClientId &&
    selectedProject?.id &&
    selectedProject.clientId === selectedClientId &&
    selectedSubtask &&
    selectedProject.subtasks.includes(selectedSubtask)
  );

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!timerRequest) return;
    async function restartTimer() {
      if (startTime && selectedProject && activeEntryId) {
        const adjustedEnd = new Date(Date.now() - (pauseStarted ? Date.now() - pauseStarted : 0));
        await stopEntry(activeEntryId, { endTime: adjustedEnd.toISOString(), notes });
      }
      const requestProject = projects.find((project) => project.id === timerRequest.projectId);
      const requestSubtask = timerRequest.subtask || requestProject?.subtasks?.[0] || '';
      setSelectedClientId(requestProject?.clientId || '');
      setSelectedProjectId(timerRequest.projectId);
      setSelectedSubtask(requestSubtask);
      setNotes(timerRequest.notes || '');
      const nextStart = new Date();
      const entry = await createEntry({ projectId: timerRequest.projectId, subtask: requestSubtask, startTime: nextStart.toISOString(), notes: timerRequest.notes || '' });
      setStartTime(nextStart);
      setActiveEntryId(entry?.id || null);
      setPausedSeconds(0);
      setPauseStarted(null);
      setActiveTimer({ sourceEntryId: timerRequest.sourceEntryId || null, projectId: timerRequest.projectId, subtask: requestSubtask, status: 'running' });
    }
    restartTimer();
  }, [timerRequest, setSelectedProjectId, projects]);

  useEffect(() => {
    if (status !== 'idle') return;
    if (!selectedClientId) {
      setSelectedProjectId('');
      setSelectedSubtask('');
      return;
    }
    if (selectedProject && selectedProject.clientId === selectedClientId) return;
    setSelectedProjectId('');
    setSelectedSubtask('');
  }, [selectedClientId, selectedProject, setSelectedProjectId, status]);

  useEffect(() => {
    if (status !== 'idle') return;
    if (!selectedProject) {
      setSelectedSubtask('');
      return;
    }
    if (selectedProject.clientId && selectedProject.clientId !== selectedClientId) {
      setSelectedClientId(selectedProject.clientId);
    }
    if (!selectedProject.subtasks.includes(selectedSubtask)) {
      setSelectedSubtask('');
    }
  }, [selectedProject, selectedClientId, selectedSubtask, status]);

  useEffect(() => {
    if (!startTime || !selectedProject) {
      setActiveTimer(null);
      return;
    }
    setActiveTimer((current) => ({
      sourceEntryId: current?.sourceEntryId || null,
      projectId: selectedProject.id,
      subtask: selectedSubtask,
      status
    }));
  }, [selectedProject, selectedSubtask, setActiveTimer, startTime, status]);

  useEffect(() => {
    if (!timerCommand || !startTime) return;
    if (activeTimer?.sourceEntryId !== timerCommand.sourceEntryId) return;
    if (timerCommand.action === 'pause' && !pauseStarted) {
      setPauseStarted(Date.now());
      setActiveTimer({ ...activeTimer, status: 'paused' });
      setMenuOpen(false);
    }
    if (timerCommand.action === 'delete') {
      if (activeEntryId) deleteTimerEntry(activeEntryId);
      setStartTime(null);
      setActiveEntryId(null);
      setPauseStarted(null);
      setPausedSeconds(0);
      setNotes('');
      setActiveTimer(null);
      setMenuOpen(false);
    }
  }, [activeTimer, timerCommand, startTime, pauseStarted, setActiveTimer]);

  async function start() {
    if (!canStart) return;
    setBusy(true);
    try {
      const nextStart = new Date();
      const entry = await createEntry({ projectId: selectedProject.id, subtask: selectedSubtask, startTime: nextStart.toISOString(), notes });
      setStartTime(nextStart);
      setActiveEntryId(entry?.id || null);
      setPausedSeconds(0);
      setPauseStarted(null);
      setActiveTimer({ sourceEntryId: null, projectId: selectedProject.id, subtask: selectedSubtask, status: 'running' });
    } finally {
      setBusy(false);
    }
  }

  function pause() {
    setPauseStarted(Date.now());
    setActiveTimer((current) => current ? { ...current, status: 'paused' } : current);
    setMenuOpen(false);
  }

  function resume() {
    setPausedSeconds((total) => total + Math.floor((Date.now() - pauseStarted) / 1000));
    setPauseStarted(null);
    setActiveTimer((current) => current ? { ...current, status: 'running' } : current);
  }

  async function stop() {
    if (!startTime || !selectedProject || !activeEntryId) return;
    setBusy(true);
    const adjustedEnd = new Date(Date.now() - (pauseStarted ? Date.now() - pauseStarted : 0));
    try {
      await stopEntry(activeEntryId, { endTime: adjustedEnd.toISOString(), notes });
      setStartTime(null);
      setActiveEntryId(null);
      setPauseStarted(null);
      setPausedSeconds(0);
      setNotes('');
      setActiveTimer(null);
      setMenuOpen(false);
    } finally {
      setBusy(false);
    }
  }

  async function deleteTimer() {
    if (activeEntryId) await deleteTimerEntry(activeEntryId);
    setStartTime(null);
    setActiveEntryId(null);
    setPauseStarted(null);
    setPausedSeconds(0);
    setNotes('');
    setActiveTimer(null);
    setMenuOpen(false);
  }

  return (
    <section className="timerStrip">
      <input className="taskInput" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="What are you working on?" />
      <select className="projectSelect" value={selectedClientId} onChange={(event) => setSelectedClientId(event.target.value)} disabled={status !== 'idle'} title={status !== 'idle' ? 'Stop the timer before changing client' : 'Select client'}>
        <option value="">Select client</option>
        {clients.map((client) => <option value={client.id} key={client.id}>{client.name}</option>)}
      </select>
      <select className="projectSelect" value={selectedProjectId} onChange={(event) => setSelectedProjectId(event.target.value)} disabled={status !== 'idle' || !selectedClientId} title={status !== 'idle' ? 'Stop the timer before changing task' : 'Select task'}>
        <option value="">Select project</option>
        {clientProjects.map((project) => <option value={project.id} key={project.id}>{project.name}</option>)}
      </select>
      <select className="projectSelect" value={selectedSubtask} onChange={(event) => setSelectedSubtask(event.target.value)} disabled={status !== 'idle' || !selectedProject} title={status !== 'idle' ? 'Stop the timer before changing subtask' : 'Select subtask'}>
        <option value="">Select subtask</option>
        {selectedProject?.subtasks.map((subtask) => <option value={subtask} key={subtask}>{subtask}</option>)}
      </select>
      {selectedProject && (
        <span className="currentProject"><i style={{ background: selectedProject.color || '#009688' }} />{selectedProject.clientName} / {selectedProject.name} {selectedSubtask && <b>- {selectedSubtask}</b>}</span>
      )}
      <strong className="timerValue">{formatDuration(elapsed)}</strong>
      {status === 'idle' && <Button className="startBtn" onClick={start} disabled={busy || !canStart}><Play size={16} /> Start</Button>}
      {status !== 'idle' && <Button className="stopBtn" onClick={stop} disabled={busy}><Square size={14} /> Stop</Button>}
      <div className="timerMenuWrap">
        <button className="kebab" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-label="Timer actions"><MoreVertical size={21} /></button>
        {menuOpen && (
          <div className="timerMenu">
            {status === 'running' && <button onClick={pause}><Pause size={15} /> Pause timer</button>}
            {status === 'paused' && <button onClick={resume}><RotateCcw size={15} /> Resume timer</button>}
            {status !== 'idle' && <button className="dangerItem" onClick={deleteTimer}><Square size={14} /> Delete timer</button>}
            {status === 'idle' && <span>No active timer</span>}
          </div>
        )}
      </div>
    </section>
  );
}
