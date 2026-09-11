import React from 'react';
import type { CityNode, Resource } from '../types';

interface Props {
  nodes: CityNode[];
  resources: Resource[];
  error: string | null;
  onRecall: (resourceId: string) => void;
}

export const ResourcePanel: React.FC<Props> = ({ nodes, resources, error, onRecall }) => {
  const available = resources.filter((r) => r.status === 'available').length;
  return (
    <section aria-label="Resources" className="panel">
      <h2>Available Resources ({available} of {resources.length})</h2>
      {error && <p role="alert" className="error">{error}</p>}
      <ul className="list">
        {resources.map((r) => {
          const node = nodes.find((n) => n.id === r.nodeId);
          return (
            <li key={r.id} className="row">
              <strong>{r.label}</strong>
              <span className={`status status-${r.status}`}>{r.status.replace('_', ' ').toUpperCase()}</span>
              <span>{node?.label}</span>
              <span>{r.assignedTo ? `assigned to ${r.assignedTo}` : 'unassigned'}</span>
              {r.status !== 'available' && r.status !== 'offline' && (
                <button className="btn small" onClick={() => onRecall(r.id)}>Recall to available</button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
};
