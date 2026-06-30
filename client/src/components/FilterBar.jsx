import { Download, Upload } from 'lucide-react';
import { useRef } from 'react';
import { useApp } from '../context/AppContext.jsx';
import Button from './Button.jsx';

export default function FilterBar() {
  const { filter, setFilter, customDate, setCustomDate, exportData, importData } = useApp();
  const importRef = useRef(null);
  const restoreRef = useRef(null);
  const options = ['all', 'today', 'yesterday', 'week', 'month', 'custom'];
  return (
    <div className="filterBar">
      <div className="segments">
        {options.map((option) => (
          <button key={option} className={filter === option ? 'selected' : ''} onClick={() => setFilter(option)}>
            {option === 'all' ? 'All' : option === 'week' ? 'This Week' : option === 'month' ? 'This Month' : option[0].toUpperCase() + option.slice(1)}
          </button>
        ))}
      </div>
      {filter === 'custom' && <input className="dateInput" type="date" value={customDate} onChange={(e) => setCustomDate(e.target.value)} />}
      <div className="dataActions">
        <Button variant="ghost" onClick={exportData}><Download size={16} /> Export</Button>
        <Button variant="ghost" onClick={() => importRef.current.click()}><Upload size={16} /> Import</Button>
        <Button variant="ghost" onClick={() => restoreRef.current.click()}>Restore</Button>
        <input ref={importRef} type="file" accept="application/json" hidden onChange={(e) => e.target.files[0] && importData(e.target.files[0])} />
        <input ref={restoreRef} type="file" accept="application/json" hidden onChange={(e) => e.target.files[0] && importData(e.target.files[0], true)} />
      </div>
    </div>
  );
}
