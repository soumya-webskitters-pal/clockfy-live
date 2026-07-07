import { ChevronDown, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

export default function SearchableFilterSelect({ value, options, onChange, placeholder = 'Search' }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const selected = options.find((option) => option.value === value) || options[0];
  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((option) => option.label.toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    if (open) window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  return (
    <div className="searchableSelect" onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }}>
      <button type="button" className="searchableSelectButton" onClick={() => setOpen((current) => !current)} aria-expanded={open}>
        <span>{selected?.label || placeholder}</span>
        <ChevronDown size={13} />
      </button>
      {open && (
        <div className="searchableSelectMenu">
          <div className="searchableSelectSearch">
            <Search size={15} />
            <input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={placeholder} />
          </div>
          <div className="searchableSelectOptions">
            {filteredOptions.map((option) => (
              <button
                type="button"
                className={option.value === value ? 'active' : ''}
                key={option.value}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(option.value);
                  setQuery('');
                  setOpen(false);
                }}
              >
                {option.label}
              </button>
            ))}
            {!filteredOptions.length && <em>No matches</em>}
          </div>
        </div>
      )}
    </div>
  );
}
