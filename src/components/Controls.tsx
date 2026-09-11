import React from 'react';
import type { Road } from '../types';

interface Props {
  roads: Road[];
  closures: Set<string>;
  error: string | null;
  onToggleRoad: (roadId: string) => void;
  onReset: () => void;
}

export const Controls: React.FC<Props> = ({ roads, closures, error, onToggleRoad, onReset }) => {
  return (
    <section aria-label="Road network" className="panel">
      <h2>Road Network</h2>
      {error && <p role="alert" className="error">{error}</p>}
      <ul className="list">
        {roads.map((r) => {
          const closed = closures.has(r.id);
          return (
            <li key={r.id} className="row">
              <strong>{r.name}</strong>
              <span>{r.km.toFixed(1)} km</span>
              <span className={closed ? 'status status-unavailable' : 'status status-operational'}>
                {closed ? 'CLOSED' : 'OPEN'}
              </span>
              <button className="btn small" onClick={() => onToggleRoad(r.id)}>
                {closed ? 'Reopen road' : 'Block road'}
              </button>
            </li>
          );
        })}
      </ul>
      <button className="btn" onClick={onReset}>Reset demo scenario</button>
    </section>
  );
};
