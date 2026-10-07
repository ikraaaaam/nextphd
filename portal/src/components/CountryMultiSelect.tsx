'use client';

import { useState, useRef, useEffect } from 'react';
import { SUPPORTED_COUNTRIES } from '@/lib/constants';

export function CountryMultiSelect({ name, defaultValue = [] }: { name: string; defaultValue?: string[] }) {
  const [selected, setSelected] = useState<string[]>(defaultValue);
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addCountry = (c: string) => {
    if (!selected.includes(c)) {
      setSelected([...selected, c]);
    }
    setSearch('');
    // Keep it open for multiple selections
  };
  
  const removeCountry = (c: string) => {
    setSelected(selected.filter(x => x !== c));
  };

  const filteredOptions = SUPPORTED_COUNTRIES.filter(
    c => c.toLowerCase().includes(search.toLowerCase()) && !selected.includes(c)
  ).slice(0, 15); // Show max 15 to keep it manageable

  return (
    <div style={{ position: 'relative' }} ref={containerRef}>
      <input type="hidden" name={name} value={selected.join(',')} />
      
      <div className="chips-container" style={{ marginBottom: '8px', minHeight: '32px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
        {selected.map(c => (
          <span 
            key={c} 
            className="badge" 
            style={{ backgroundColor: 'var(--brand)', color: 'white', cursor: 'pointer', paddingRight: '4px', display: 'inline-flex', alignItems: 'center' }} 
            onClick={() => removeCountry(c)} 
            title="Remove"
          >
            {c} <span style={{ marginLeft: '4px', opacity: 0.7, padding: '0 4px' }}>×</span>
          </span>
        ))}
        {selected.length === 0 && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No countries selected</span>}
      </div>

      <input 
        type="text" 
        className="form-control" 
        placeholder="Search and add countries..." 
        value={search}
        onFocus={() => setIsOpen(true)}
        onChange={(e) => {
          setSearch(e.target.value);
          setIsOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredOptions.length > 0) {
              addCountry(filteredOptions[0]);
            }
          }
        }}
      />
      
      {isOpen && filteredOptions.length > 0 && (
        <div className="card" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, padding: '4px', marginTop: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxHeight: '300px', overflowY: 'auto' }}>
          {filteredOptions.map(c => (
            <div 
              key={c} 
              style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: '4px', transition: 'background-color 0.1s' }}
              onClick={() => addCountry(c)}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-muted)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {c}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
