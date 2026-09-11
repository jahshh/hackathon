import React, { useState } from 'react';
import type { CityNode, Incident, IncidentType, Recommendation, Severity } from '../types';

interface Props {
  nodes: CityNode[];
  incidents: Incident[];
  selected: Incident | null;
  recommendations: Recommendation[];
  error: string | null;
  onSelect: (id: string | null) => void;
  onCreate: (input: { type: IncidentType; severity: Severity; nodeId: string; affected: number }) => void;
  onDispatch: (resourceId: string, incidentId: string) => void;
  onEscalate: (incidentId: string) => void;
  onResolve: (incidentId: string) => void;
}

const TYPES: IncidentType[] = ['fire', 'medical', 'accident', 'hazard', 'rescue'];
const SEVS: Severity[] = ['low', 'medium', 'high', 'critical'];

export const IncidentPanel: React.FC<Props> = ({
  nodes,
  incidents,
  selected,
  recommendations,
  error,
  onSelect,
  onCreate,
  onDispatch,
  onEscalate,
  onResolve,
}) => {
  const [type, setType] = useState<IncidentType>('fire');
  const [severity, setSeverity] = useState<Severity>('high');
  const [nodeId, setNodeId] = useState(nodes[1]?.id ?? 'n2');
  const [affected, setAffected] = useState('12');

  const open = incidents.filter((i) => i.status !== 'resolved');

  return (
    <section aria-label="Incidents" className="panel">
      <h2>Active Incidents ({open.length})</h2>
      {error && <p role="alert" className="error">{error}</p>}
      <ul className="list">
        {open.map((i) => {
          const node = nodes.find((n) => n.id === i.nodeId);
          return (
            <li key={i.id}>
              <button
                className={selected?.id === i.id ? 'row selected' : 'row'}
                onClick={() => onSelect(selected?.id === i.id ? null : i.id)}
                aria-pressed={selected?.id === i.id}
              >
                <strong>{i.type.toUpperCase()}</strong>
                <span className={`sev sev-${i.severity}`}>{i.severity.toUpperCase()}</span>
                <span>{node?.label}</span>
                <span>{i.affected} affected</span>
                <span>priority {i.priority.toFixed(1)}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {open.length === 0 && <p className="muted">No active incidents.</p>}

      {selected && (
        <div className="details">
          <h3>Incident {selected.id}</h3>
          <dl>
            <dt>Type</dt><dd>{selected.type}</dd>
            <dt>Severity</dt><dd>{selected.severity}</dd>
            <dt>Location</dt><dd>{nodes.find((n) => n.id === selected.nodeId)?.label}</dd>
            <dt>Affected</dt><dd>{selected.affected}</dd>
            <dt>Priority score</dt><dd>{selected.priority.toFixed(1)} (simulation model)</dd>
            <dt>Assigned units</dt><dd>{selected.assignedUnits.length > 0 ? selected.assignedUnits.join(', ') : 'none'}</dd>
          </dl>
          <h4>Response recommendation</h4>
          {recommendations.length === 0 && <p className="muted">No available unit can reach this incident on open roads.</p>}
          <ol>
            {recommendations.map((r) => (
              <li key={r.resourceId} className="rec">
                <div className="rec-head"><strong>{r.resourceId}</strong><span className="rec-eta">ETA {r.etaText} ({r.distanceKm.toFixed(1)} km)</span></div>
                <ul>
                  {r.reasons.map((reason, k) => <li key={k}>{reason}</li>)}
                </ul>
                <button className="btn primary" onClick={() => onDispatch(r.resourceId, selected.id)}>
                  Dispatch {r.resourceId}
                </button>
              </li>
            ))}
          </ol>
          <div className="actions">
            <button className="btn warn" onClick={() => onEscalate(selected.id)}>Escalate incident</button>
            <button className="btn" onClick={() => onResolve(selected.id)}>Mark resolved</button>
          </div>
        </div>
      )}

      <h3>Create incident</h3>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const n = Number.parseInt(affected, 10);
          onCreate({ type, severity, nodeId, affected: n });
        }}
        className="form"
      >
        <label>Incident type
          <select value={type} onChange={(e) => setType(e.target.value as IncidentType)}>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label>Severity
          <select value={severity} onChange={(e) => setSeverity(e.target.value as Severity)}>
            {SEVS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label>Location
          <select value={nodeId} onChange={(e) => setNodeId(e.target.value)}>
            {nodes.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
          </select>
        </label>
        <label>Affected people
          <input value={affected} onChange={(e) => setAffected(e.target.value)} inputMode="numeric" aria-describedby="affected-hint" />
        </label>
        <p id="affected-hint" className="muted">Whole number from 1 to 500.</p>
        <button type="submit" className="btn primary">Create incident</button>
      </form>
    </section>
  );
};
