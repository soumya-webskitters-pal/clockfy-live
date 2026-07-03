import { ChevronDown, Plus, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import Button from './Button.jsx';
import Input from './Input.jsx';

const colors = [
  ['Teal', '#009688'],
  ['Indigo', '#5264d8'],
  ['Sky', '#25baeb'],
  ['Red', '#ef4444'],
  ['Amber', '#f59e0b'],
  ['Green', '#10b981'],
  ['Violet', '#8b5cf6'],
  ['Rose', '#f43f5e'],
  ['Cyan', '#06b6d4'],
  ['Lime', '#84cc16'],
  ['Orange', '#f97316'],
  ['Slate', '#64748b']
];

export default function ProjectList() {
  const { projects, clients, selectedProjectId, setSelectedProjectId, createProject } = useApp();
  const [name, setName] = useState('');
  const [clientId, setClientId] = useState('');
  const [subtasks, setSubtasks] = useState([]);
  const [subtaskDraft, setSubtaskDraft] = useState('');
  const [error, setError] = useState('');
  const [color, setColor] = useState(colors[0][1]);
  const [colorMenuOpen, setColorMenuOpen] = useState(false);
  const colorDropdownRef = useRef(null);
  const selectedColorLabel = colors.find(([, value]) => value === color)?.[0] || 'Color';

  useEffect(() => {
    function closeOnOutsideClick(event) {
      if (!colorDropdownRef.current?.contains(event.target)) setColorMenuOpen(false);
    }
    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick);
  }, []);

  async function submit(event) {
    event.preventDefault();
    setError('');
    const nextSubtasks = [...subtasks, subtaskDraft]
      .map((item) => item.trim().replace(/\s+/g, ' '))
      .filter(Boolean);
    if (!name.trim() || !clientId || !nextSubtasks.length) return;
    const subtaskKeys = nextSubtasks.map((item) => item.toLowerCase());
    if (new Set(subtaskKeys).size !== subtaskKeys.length) {
      setError('Subtask name already exists');
      return;
    }
    try {
      await createProject({ name, color, clientId, subtasks: nextSubtasks });
      setName('');
      setClientId('');
      setSubtasks([]);
      setSubtaskDraft('');
    } catch (err) {
      setError(err.message);
    }
  }

  function addSubtask() {
    setError('');
    const next = subtaskDraft.trim().replace(/\s+/g, ' ');
    if (!next) return;
    if (subtasks.some((item) => item.toLowerCase() === next.toLowerCase())) {
      setError('Subtask name already exists');
      return;
    }
    setSubtasks((items) => [...items, next]);
    setSubtaskDraft('');
  }

  function removeSubtask(item) {
    setSubtasks((items) => items.filter((subtask) => subtask !== item));
  }

  return (
    <aside className="projectPanel taskPanel">
      <div className="panelTitle">
        <h2>Tasks</h2>
        <span>{projects.length}</span>
      </div>
      <form className="projectForm" onSubmit={submit}>
        <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Task name" required />
        <select className="clientSelect" value={clientId} onChange={(event) => setClientId(event.target.value)} aria-label="Task client" required>
          <option value="">{clients.length ? 'Select client' : 'Create a client first'}</option>
          {clients.map((client) => <option value={client.id} key={client.id}>{client.name}</option>)}
        </select>
        <div className="subtaskBuilder">
          <div className="subtaskInputRow">
            <Input
              value={subtaskDraft}
              onChange={(event) => setSubtaskDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addSubtask();
                }
              }}
              placeholder="Subtask"
            />
            <button type="button" className="iconButton subtaskAddButton" onClick={addSubtask} title="Add subtask" aria-label="Add subtask">
              <Plus size={16} />
            </button>
          </div>
          <div className="subtaskChips" aria-label="Subtasks">
            {subtasks.map((item) => (
              <span key={item}>
                {item}
                <button type="button" onClick={() => removeSubtask(item)} aria-label={`Remove ${item}`}>
                  <X size={13} />
                </button>
              </span>
            ))}
            {!subtasks.length && <em>At least one subtask required</em>}
          </div>
          {error && <em className="formError">{error}</em>}
        </div>
        <div className="colorDropdown" style={{ '--selected-color': color }} ref={colorDropdownRef}>
          <button type="button" className="colorDropdownButton" onClick={() => setColorMenuOpen((open) => !open)} aria-expanded={colorMenuOpen}>
            <span />
            <b>{selectedColorLabel}</b>
            <ChevronDown size={16} />
          </button>
          {colorMenuOpen && (
            <div className="colorDropdownMenu">
              {colors.map(([label, value]) => (
                <button
                  type="button"
                  className={color === value ? 'selected' : ''}
                  key={value}
                  style={{ '--option-color': value }}
                  onClick={() => {
                    setColor(value);
                    setColorMenuOpen(false);
                  }}
                >
                  <i />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
        <Button disabled={!name.trim() || !clientId || (!subtasks.length && !subtaskDraft.trim())}><Plus size={16} /> Add</Button>
      </form>
      <div className="projectList">
        {projects.map((project) => (
          <div className={`projectItem taskOnly ${selectedProjectId === project.id ? 'current' : ''}`} key={project.id}>
            <button className="projectName" onClick={() => setSelectedProjectId(project.id)}>
              <span style={{ background: project.color }} />
              <span className="projectNameText">{project.name}</span>
              {!!project.subtasks?.length && <small>{project.subtasks.length} subtasks</small>}
              {project.clientName && <small>{project.clientName}</small>}
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}
