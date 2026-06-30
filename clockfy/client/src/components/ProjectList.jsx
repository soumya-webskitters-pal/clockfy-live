import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import Button from './Button.jsx';
import Input from './Input.jsx';

const colors = ['#009688', '#5264d8', '#25baeb', '#ef4444', '#f59e0b', '#10b981'];

export default function ProjectList() {
  const { projects, selectedProjectId, setSelectedProjectId, createProject } = useApp();
  const [name, setName] = useState('');
  const [color, setColor] = useState(colors[0]);

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
        <div className="swatches">
          {colors.map((item) => <button type="button" key={item} className={color === item ? 'picked' : ''} style={{ '--swatch': item }} onClick={() => setColor(item)} />)}
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
