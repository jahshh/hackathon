import React from 'react';
import type { Hospital } from '../types';

interface Props {
  hospitals: Hospital[];
  error: string | null;
  onToggle: (hospitalId: string) => void;
}

export const HospitalPanel: React.FC<Props> = ({ hospitals, error, onToggle }) => {
  return (
    <section aria-label="Hospitals" className="panel">
      <h2>Hospital Capacity</h2>
      {error && <p role="alert" className="error">{error}</p>}
      <ul className="list">
        {hospitals.map((h) => {
          const load = Math.round((h.currentPatients / h.emergencyCapacity) * 100);
          return (
            <li key={h.id} className="row">
              <strong>{h.name}</strong>
              <span className={`status status-${h.status}`}>{h.status.toUpperCase()}</span>
              <span>Emergency {h.currentPatients}/{h.emergencyCapacity} ({load}%)</span>
              <span>ICU {h.icuCapacity} beds</span>
              <span>Incoming {h.incomingPatients}</span>
              <button className="btn small" onClick={() => onToggle(h.id)}>
                {h.status === 'unavailable' ? 'Mark available' : 'Mark unavailable'}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
