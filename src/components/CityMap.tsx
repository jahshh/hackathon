import React from 'react';
import type { CityNode, Hospital, Incident, Resource, Road } from '../types';

interface Props {
  nodes: CityNode[];
  roads: Road[];
  closures: Set<string>;
  incidents: Incident[];
  resources: Resource[];
  hospitals: Hospital[];
  selectedId: string | null;
  routeNodeIds: string[];
  onSelectIncident: (id: string | null) => void;
}

const SEV_COLOR: Record<string, string> = {
  low: '#4ade80',
  medium: '#f59e0b',
  high: '#ef4444',
  critical: '#dc2626',
};

const RES_COLOR: Record<string, string> = {
  ambulance: '#60a5fa',
  fire: '#f87171',
  police: '#93c5fd',
};

function nodeById(nodes: CityNode[], id: string): CityNode {
  return nodes.find((n) => n.id === id) ?? nodes[0];
}

export const CityMap: React.FC<Props> = ({
  nodes,
  roads,
  closures,
  incidents,
  resources,
  hospitals,
  selectedId,
  routeNodeIds,
  onSelectIncident,
}) => {
  const routePoints = routeNodeIds.map((id) => {
    const n = nodeById(nodes, id);
    return `${n.x},${100 - n.y}`;
  });

  return (
    <div>
      <svg viewBox="0 0 100 100" role="img" aria-label="Fictional city map of Everton City" style={{ width: '100%', height: 'auto', display: 'block', background: '#0b1220' }}>
        {roads.map((r) => {
          const a = nodeById(nodes, r.from);
          const b = nodeById(nodes, r.to);
          const closed = closures.has(r.id);
          return (
            <g key={r.id}>
              <line
                x1={a.x} y1={100 - a.y} x2={b.x} y2={100 - b.y}
                stroke={closed ? '#7f1d1d' : '#334155'}
                strokeWidth={closed ? 1.1 : 1.6}
                strokeDasharray={closed ? '2 1.4' : undefined}
              />
              {r.km >= 2.5 && (
                <text x={(a.x + b.x) / 2} y={100 - (a.y + b.y) / 2 - 1.2} fontSize="1.9" fill={closed ? '#f87171' : '#5b6b82'} textAnchor="middle">
                  {closed ? `${r.name} CLOSED` : r.name}
                </text>
              )}
            </g>
          );
        })}

        {routePoints.length > 1 && (
          <polyline points={routePoints.join(' ')} fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2.4 1.2" />
        )}

        {nodes.map((n) => (
          <g key={n.id}>
            <circle cx={n.x} cy={100 - n.y} r="1.1" fill="#475569" />
            <text x={n.x} y={100 - n.y + 4.4} fontSize="2.1" fill="#7d8aa0" textAnchor="middle">{n.label}</text>
          </g>
        ))}

        {hospitals.map((h) => {
          const n = nodeById(nodes, h.nodeId);
          const unavailable = h.status === 'unavailable';
          return (
            <g key={h.id}>
              <rect x={n.x + 3.2} y={100 - n.y - 7.6} width="4.4" height="4.4" fill={unavailable ? '#1f2937' : '#052e16'} stroke={unavailable ? '#6b7280' : '#22c55e'} strokeWidth="0.5" />
              <text x={n.x + 5.4} y={100 - n.y - 4.2} fontSize="2.8" fill={unavailable ? '#9ca3af' : '#4ade80'} textAnchor="middle">H</text>
              <text x={n.x + 5.4} y={100 - n.y - 1.6} fontSize="1.7" fill="#7d8aa0" textAnchor="middle">
                {h.currentPatients}/{h.emergencyCapacity}{unavailable ? ' shut' : ''}
              </text>
            </g>
          );
        })}

        {resources.map((r, ri) => {
          const n = nodeById(nodes, r.nodeId);
          const cx = n.x - 5.2;
          const cy = 100 - n.y + 6.4 + (ri % 3) * 2.6;
          const busy = r.status !== 'available';
          return (
            <g key={r.id} opacity={r.status === 'offline' ? 0.45 : 1}>
              <circle cx={cx} cy={cy} r="1.5" fill={RES_COLOR[r.type] ?? '#94a3b8'} stroke={busy ? '#f59e0b' : '#0f172a'} strokeWidth="0.5" />
              <text x={cx} y={cy + 0.8} fontSize="1.6" fill="#0f172a" textAnchor="middle">{r.id.slice(0, 1)}</text>
              <text x={cx + 2.4} y={cy + 0.8} fontSize="1.8" fill={busy ? '#fbbf24' : '#cbd5e1'}>{r.id}{busy ? ` (${r.status})` : ''}</text>
            </g>
          );
        })}

        {incidents.filter((i) => i.status !== 'resolved').map((i) => {
          const n = nodeById(nodes, i.nodeId);
          const selected = i.id === selectedId;
          return (
            <g key={i.id} onClick={() => onSelectIncident(selected ? null : i.id)} style={{ cursor: 'pointer' }}>
              <rect
                x={n.x - 2.4} y={100 - n.y - 9.4} width="4.8" height="4.8"
                transform={`rotate(45 ${n.x} ${100 - n.y - 7})`}
                fill={SEV_COLOR[i.severity] ?? '#e2e8f0'}
                stroke={selected ? '#ffffff' : '#0f172a'}
                strokeWidth={selected ? 0.9 : 0.5}
              />
              <text x={n.x} y={100 - n.y - 10.6} fontSize="2.2" fill="#f8fafc" textAnchor="middle">
                {i.type.toUpperCase()} {i.severity.toUpperCase()} ({i.affected})
              </text>
            </g>
          );
        })}
      </svg>
      <div className="legend">
        <span><span aria-hidden="true" style={{ color: '#ef4444' }}>◆</span> Incident (label shows type, severity, affected)</span>
        <span><span aria-hidden="true" style={{ color: '#60a5fa' }}>●</span> Ambulance</span>
        <span><span aria-hidden="true" style={{ color: '#f87171' }}>●</span> Fire</span>
        <span><span aria-hidden="true" style={{ color: '#93c5fd' }}>●</span> Police</span>
        <span><span aria-hidden="true" style={{ color: '#4ade80' }}>■</span> Hospital (open beds shown)</span>
        <span><span aria-hidden="true" style={{ color: '#38bdf8' }}>┄</span> Active recommended route</span>
      </div>
    </div>
  );
};
