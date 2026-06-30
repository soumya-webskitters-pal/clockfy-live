import { CalendarDays, ChevronDown, CircleDollarSign, MoreVertical, Pause, Pencil, Play, Save, Square, Tag, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { formatClock, formatDuration, getWeekBucket, isoFromLocalInput, labelDate, localInputValue, toDateKey } from '../utils/time.js';

function filterEntries(entries, search, filter, customDate) {
  const today = toDateKey();
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = toDateKey(yesterdayDate);
  const month = today.slice(0, 7);
  return entries.filter((entry) => {
    const q = search.trim().toLowerCase();
    const matches = !q || entry.projectName.toLowerCase().includes(q) || entry.date.includes(q) || entry.notes.toLowerCase().includes(q);
    const inFilter =
      filter === 'all' ||
      (filter === 'today' && entry.date === today) ||
      (filter === 'yesterday' && entry.date === yesterday) ||
      (filter === 'week' && getWeekBucket(entry.date) === 'This week') ||
      (filter === 'month' && entry.date.startsWith(month)) ||
      (filter === 'custom' && entry.date === customDate);
    return matches && inFilter;
  });
}

export default function HistoryTable() {
  const { entries, search, filter, customDate, mode, currentUser, activeTimer, updateEntry, deleteEntry, startTimerFromEntry, pauseTargetTimer, deleteTargetTimer } = useApp();
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState({});
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [openRowMenu, setOpenRowMenu] = useState(null);
  const isAdmin = mode === 'admin';
  const scopedEntries = useMemo(() => (
    currentUser?.role === 'user' ? entries.filter((entry) => entry.userId === currentUser.id) : entries
  ), [entries, currentUser]);
  const filtered = useMemo(() => filterEntries(scopedEntries, search, filter, customDate), [scopedEntries, search, filter, customDate]);
  const groups = useMemo(() => {
    const result = new Map();
    filtered.forEach((entry) => {
      const bucket = getWeekBucket(entry.date);
      const day = entry.date;
      if (!result.has(bucket)) result.set(bucket, new Map());
      if (!result.get(bucket).has(day)) result.get(bucket).set(day, []);
      result.get(bucket).get(day).push(entry);
    });
    return result;
  }, [filtered]);

  function startEdit(entry) {
    if (!isAdmin) return;
    setEditing(entry.id);
    setDraft({ notes: entry.notes, startTime: localInputValue(entry.startTime), endTime: localInputValue(entry.endTime) });
  }

  async function save(entry) {
    await updateEntry(entry.id, { notes: draft.notes, startTime: isoFromLocalInput(draft.startTime), endTime: isoFromLocalInput(draft.endTime) });
    setEditing(null);
  }

  function toggleGroup(key) {
    setCollapsedGroups((current) => {
      const isCurrentlyCollapsed = current[key] !== false;
      return { ...current, [key]: !isCurrentlyCollapsed };
    });
  }

  if (!filtered.length) return <div className="emptyState">No time entries yet. Start timer, then saved rows appear here.</div>;

  return (
    <section className="history">
      {[...groups.entries()].map(([week, days]) => (
        <div className="weekGroup" key={week}>
          <div className="weekHeader">
            <h2>{week}</h2>
            <p>Week total: <strong>{formatDuration([...days.values()].flat().reduce((sum, entry) => sum + entry.duration, 0))}</strong></p>
          </div>
          {[...days.entries()].map(([day, rows]) => (
            <div className="dayGroup" key={day}>
              <div className="dayHeader">
                <span>{labelDate(day)}</span>
                <span>Total: <strong>{formatDuration(rows.reduce((sum, entry) => sum + entry.duration, 0))}</strong></span>
              </div>
              {[...rows.reduce((map, entry) => {
                const key = entry.projectId || entry.projectName;
                if (!map.has(key)) map.set(key, []);
                map.get(key).push(entry);
                return map;
              }, new Map()).entries()].map(([projectKey, projectRows]) => {
                const accordionKey = `${day}-${projectKey}`;
                const canCollapse = !isAdmin && projectRows.length > 1;
                const isCollapsed = canCollapse && collapsedGroups[accordionKey] !== false;
                const visibleRows = isCollapsed ? [] : projectRows;
                return (
                <div className={`projectEntryGroup ${isCollapsed ? 'collapsed' : ''}`} key={projectKey}>
                  <button
                    className={`projectGroupHeader ${canCollapse ? 'accordion' : ''}`}
                    type="button"
                    disabled={!canCollapse}
                    onClick={() => canCollapse && toggleGroup(accordionKey)}
                    aria-expanded={!isCollapsed}
                  >
                    <span><i style={{ background: projectRows[0].projectColor }} />{projectRows[0].projectName}</span>
                    <span className="projectGroupMeta">
                      <small>{projectRows.length} {projectRows.length === 1 ? 'entry' : 'entries'}</small>
                      <strong>{formatDuration(projectRows.reduce((sum, entry) => sum + entry.duration, 0))}</strong>
                      {canCollapse && <ChevronDown size={17} />}
                    </span>
                  </button>
                  {visibleRows.map((entry, index) => (
                    <div className={`entryRow ${!isAdmin ? 'userLocked' : ''}`} key={entry.id}>
                      <span className="badge">{index % 2 === 0 ? '2' : ''}</span>
                      {editing === entry.id ? (
                        <input className="notesEdit" value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
                      ) : (
                        <button className="description" disabled={!isAdmin} onClick={() => startEdit(entry)}>{entry.notes || 'Add description'}</button>
                      )}
                      <span className="entryProject"><i style={{ background: entry.projectColor }} />{entry.projectName} <b>- {entry.userName}</b></span>
                      <span className="entryIcon"><Tag size={20} /></span>
                      <span className="entryMoney"><CircleDollarSign size={22} /></span>
                      {editing === entry.id ? (
                        <span className="editTimes">
                          <input type="datetime-local" value={draft.startTime} onChange={(e) => setDraft({ ...draft, startTime: e.target.value })} />
                          <input type="datetime-local" value={draft.endTime} onChange={(e) => setDraft({ ...draft, endTime: e.target.value })} />
                        </span>
                      ) : (
                        <span className="timeRange">{formatClock(entry.startTime)} <em>-</em> {formatClock(entry.endTime)}</span>
                      )}
                      <span className="entryIcon"><CalendarDays size={20} /></span>
                      <strong className="duration">{formatDuration(entry.duration)}</strong>
                      {isAdmin ? (
                        editing === entry.id ? <button className="rowAction" onClick={() => save(entry)}><Save size={18} /></button> : <button className="rowAction" title="Edit time entry" onClick={() => startEdit(entry)}><Pencil size={17} /></button>
                      ) : (
                        <button className="rowAction" title="Start timer for same project" onClick={() => startTimerFromEntry(entry)}><Play size={18} /></button>
                      )}
                      {isAdmin && <button className="rowAction danger" onClick={() => confirm('Delete entry?') && deleteEntry(entry.id)}><Trash2 size={17} /></button>}
                      {isAdmin ? (
                        <MoreVertical className="more" size={20} />
                      ) : (
                        <div className="rowMenuWrap">
                          <button className="moreButton" onClick={() => setOpenRowMenu((current) => current === entry.id ? null : entry.id)} aria-label="Entry timer actions" aria-expanded={openRowMenu === entry.id}>
                            <MoreVertical size={20} />
                          </button>
                          {openRowMenu === entry.id && (
                            <div className="timerMenu rowTimerMenu">
                              <button
                                disabled={activeTimer?.sourceEntryId !== entry.id || activeTimer.status !== 'running'}
                                onClick={() => {
                                  pauseTargetTimer(entry);
                                  setOpenRowMenu(null);
                                }}
                              >
                                <Pause size={15} /> Pause timer
                              </button>
                              <button
                                className="dangerItem"
                                disabled={activeTimer?.sourceEntryId !== entry.id}
                                onClick={() => {
                                  deleteTargetTimer(entry);
                                  setOpenRowMenu(null);
                                }}
                              >
                                <Square size={14} /> Delete timer
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );})}
            </div>
          ))}
        </div>
      ))}
    </section>
  );
}
