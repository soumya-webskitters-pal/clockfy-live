import { CircleDollarSign, MoreVertical, Pause, Play, RotateCcw, Square, Tag } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { formatDuration } from '../utils/time.js';
import Button from './Button.jsx';

export default function Timer() {
  const { projects, selectedProjectId, setSelectedProjectId, createEntry, timerRequest, activeTimer, timerCommand, setActiveTimer } = useApp();
  const [notes, setNotes] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [pausedSeconds, setPausedSeconds] = useState(0);
  const [pauseStarted, setPauseStarted] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [menuOpen, setMenuOpen] = useState(false);

  const selectedProject = useMemo(() => projects.find((project) => project.id === selectedProjectId), [projects, selectedProjectId]);
  const status = !startTime ? 'idle' : pauseStarted ? 'paused' : 'running';
  const elapsed = startTime ? Math.max(0, Math.floor((now - startTime.getTime()) / 1000) - pausedSeconds - (pauseStarted ? Math.floor((now - pauseStarted) / 1000) : 0)) : 0;

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!timerRequest) return;
    async function restartTimer() {
      if (startTime && selectedProject) {
        const adjustedEnd = new Date(Date.now() - (pauseStarted ? Date.now() - pauseStarted : 0));
        await createEntry({ projectId: selectedProject.id, startTime: startTime.toISOString(), endTime: adjustedEnd.toISOString(), notes });
      }
      setSelectedProjectId(timerRequest.projectId);
      setNotes(timerRequest.notes || '');
      setStartTime(new Date());
      setPausedSeconds(0);
      setPauseStarted(null);
      setActiveTimer({ sourceEntryId: timerRequest.sourceEntryId || null, projectId: timerRequest.projectId, status: 'running' });
    }
    restartTimer();
  }, [timerRequest, setSelectedProjectId]);

  useEffect(() => {
    if (!startTime || !selectedProject) {
      setActiveTimer(null);
      return;
    }
    setActiveTimer((current) => ({
      sourceEntryId: current?.sourceEntryId || null,
      projectId: selectedProject.id,
      status
    }));
  }, [selectedProject, setActiveTimer, startTime, status]);

  useEffect(() => {
    if (!timerCommand || !startTime) return;
    if (activeTimer?.sourceEntryId !== timerCommand.sourceEntryId) return;
    if (timerCommand.action === 'pause' && !pauseStarted) {
      setPauseStarted(Date.now());
      setActiveTimer({ ...activeTimer, status: 'paused' });
      setMenuOpen(false);
    }
    if (timerCommand.action === 'delete') {
      setStartTime(null);
      setPauseStarted(null);
      setPausedSeconds(0);
      setNotes('');
      setActiveTimer(null);
      setMenuOpen(false);
    }
  }, [activeTimer, timerCommand, startTime, pauseStarted, setActiveTimer]);

  function start() {
    if (!selectedProject) return;
    setStartTime(new Date());
    setPausedSeconds(0);
    setPauseStarted(null);
    setActiveTimer({ sourceEntryId: null, projectId: selectedProject.id, status: 'running' });
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
    if (!startTime || !selectedProject) return;
    const adjustedEnd = new Date(Date.now() - (pauseStarted ? Date.now() - pauseStarted : 0));
    await createEntry({ projectId: selectedProject.id, startTime: startTime.toISOString(), endTime: adjustedEnd.toISOString(), notes });
    setStartTime(null);
    setPauseStarted(null);
    setPausedSeconds(0);
    setNotes('');
    setActiveTimer(null);
    setMenuOpen(false);
  }

  function deleteTimer() {
    setStartTime(null);
    setPauseStarted(null);
    setPausedSeconds(0);
    setNotes('');
    setActiveTimer(null);
    setMenuOpen(false);
  }

  return (
    <section className="timerStrip">
      <input className="taskInput" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="What are you working on?" />
      <select className="projectSelect" value={selectedProjectId} onChange={(event) => setSelectedProjectId(event.target.value)}>
        {projects.map((project) => <option value={project.id} key={project.id}>{project.name}</option>)}
      </select>
      <span className="currentProject"><i style={{ background: selectedProject?.color || '#009688' }} />{selectedProject?.name || 'Select project'} <b>- Vishal - Vish UK</b></span>
      <button className="iconCell" title="Tag"><Tag size={20} /></button>
      <button className="iconCell money" title="Billable"><CircleDollarSign size={23} /></button>
      <strong className="timerValue">{formatDuration(elapsed)}</strong>
      {status === 'idle' && <Button className="startBtn" onClick={start}><Play size={16} /> Start</Button>}
      {status !== 'idle' && <Button className="stopBtn" onClick={stop}><Square size={14} /> Stop</Button>}
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
