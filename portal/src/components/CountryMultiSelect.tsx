'use client';

import { useState } from 'react';
import { SUPPORTED_COUNTRIES } from '@/lib/constants';

export function CountryMultiSelect({ name, defaultValue = [] }: { name: string; defaultValue?: string[] }) {
  const [selected, setSelected] = useState<string[]>(defaultValue);
  const [search, setSearch] = useState('');
  
  const addCountry = (c: string) => {
    if (!selected.includes(c)) {
      setSelected([...selected, c]);
    }
    setSearch('');
  };
  
  const removeCountry = (c: string) => {
    setSelected(selected.filter(x => x !== c));
  };

  const filteredOptions = SUPPORTED_COUNTRIES.filter(
    c => c.toLowerCase().includes(search.toLowerCase()) && !selected.includes(c)
  ).slice(0, 10); // Show max 10 to keep it manageable

  return (
    <div style={{ position: 'relative' }}>
      <input type="hidden" name={name} value={selected.join(',')} />
      
      <div className="chips-container" style={{ marginBottom: '8px', minHeight: '32px' }}>
        {selected.map(c => (
          <span key={c} className="badge" style={{ backgroundColor: 'var(--brand)', color: 'white', cursor: 'pointer', paddingRight: '4px' }} onClick={() => removeCountry(c)} title="Remove">
            {c} <span style={{ marginLeft: '4px', opacity: 0.7 }}>×</span>
          </span>
        ))}
        {selected.length === 0 && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No countries selected</span>}
      </div>

      <input 
        type="text" 
        className="form-control" 
        placeholder="Search and add countries..." 
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && filteredOptions.length > 0) {
            e.preventDefault();
            addCountry(filteredOptions[0]);
          }
        }}
      />
      
      {search && filteredOptions.length > 0 && (
        <div className="card" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, padding: '4px', marginTop: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          {filteredOptions.map(c => (
            <div 
              key={c} 
              style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: '4px' }}
              onClick={() => addCountry(c)}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface)'}
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
