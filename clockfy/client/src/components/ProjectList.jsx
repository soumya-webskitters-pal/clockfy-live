import { ChevronDown, Plus } from 'lucide-react';
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
  const { projects, selectedProjectId, setSelectedProjectId, createProject } = useApp();
  const [name, setName] = useState('');
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
    if (!name.trim()) return;
    await createProject({ name, color });
    setName('');
  }

  return (
    <aside className="projectPanel taskPanel">
      <div className="panelTitle">
        <h2>Tasks</h2>
        <span>{projects.length}</span>
      </div>
      <form className="projectForm" onSubmit={submit}>
        <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="New task" />
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
        <Button><Plus size={16} /> Add</Button>
      </form>
      <div className="projectList">
        {projects.map((project) => (
          <div className={`projectItem taskOnly ${selectedProjectId === project.id ? 'current' : ''}`} key={project.id}>
            <button className="projectName" onClick={() => setSelectedProjectId(project.id)}>
              <span style={{ background: project.color }} />
              {project.name}
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}
