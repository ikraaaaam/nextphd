'use client';

import { useState } from 'react';
import { COUNTRY_CATALOGUE, SUPPORTED_REGIONS, SUPPORTED_COUNTRIES } from '@/lib/constants';

export function CountryFilter({ defaultRegion, defaultCountry }: { defaultRegion?: string; defaultCountry?: string }) {
  const [region, setRegion] = useState(defaultRegion || '');
  const [country, setCountry] = useState(defaultCountry || '');

  const availableCountries = region && COUNTRY_CATALOGUE[region] 
    ? COUNTRY_CATALOGUE[region] 
    : SUPPORTED_COUNTRIES.toSorted();

  return (
    <>
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label htmlFor="region">Region</label>
        <select 
          id="region" 
          name="region" 
          className="form-control" 
          value={region} 
          onChange={(e) => {
            setRegion(e.target.value);
            setCountry(''); // Reset country when region changes
          }}
        >
          <option value="">All Regions</option>
          {SUPPORTED_REGIONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label htmlFor="country">Country</label>
        <select 
          id="country" 
          name="country" 
          className="form-control" 
          value={country} 
          onChange={(e) => setCountry(e.target.value)}
        >
          <option value="">All Countries</option>
          {availableCountries.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
    </>
  );
}
