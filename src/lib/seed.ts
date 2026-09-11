import type { CityNode, Hospital, Incident, Resource, Road } from '../types';
import { priorityOf, roadLengthKm } from '../lib/engine';

export const NODES: CityNode[] = [
  { id: 'n1', label: 'Harbor Gate', x: 12, y: 78 },
  { id: 'n2', label: 'Industrial District', x: 30, y: 70 },
  { id: 'n3', label: 'Old Town', x: 48, y: 76 },
  { id: 'n4', label: 'Central Station', x: 52, y: 52 },
  { id: 'n5', label: 'Riverside', x: 30, y: 44 },
  { id: 'n6', label: 'University Hill', x: 58, y: 30 },
  { id: 'n7', label: 'Highway Junction', x: 78, y: 52 },
  { id: 'n8', label: 'Northgate', x: 74, y: 22 },
  { id: 'n9', label: 'East Market', x: 86, y: 74 },
  { id: 'n10', label: 'Civic Center', x: 62, y: 66 },
];

const R = (id: string, name: string, from: string, to: string): Road => {
  const a = NODES.find((n) => n.id === from)!;
  const b = NODES.find((n) => n.id === to)!;
  return { id, name, from, to, km: roadLengthKm(a, b) };
};

export const ROADS: Road[] = [
  R('r-1', 'Harbor Road', 'n1', 'n2'),
  R('r-2', 'Foundry Avenue', 'n2', 'n3'),
  R('r-3', 'Mill Street', 'n3', 'n10'),
  R('r-4', 'Central Avenue', 'n10', 'n4'),
  R('r-5', 'Riverside Drive', 'n5', 'n4'),
  R('r-6', 'Foundry Link', 'n2', 'n5'),
  R('r-7', 'University Road', 'n4', 'n6'),
  R('r-8', 'Northgate Highway', 'n6', 'n8'),
  R('r-9', 'Junction Highway', 'n7', 'n8'),
  R('r-10', 'Market Highway', 'n7', 'n9'),
  R('r-11', 'Civic Row', 'n10', 'n7'),
  R('r-12', 'Old Town Road', 'n3', 'n4'),
];

export function seedIncidents(): Incident[] {
  const now = Date.now();
  const mk = (
    id: string,
    type: Incident['type'],
    severity: Incident['severity'],
    nodeId: string,
    affected: number,
    minsAgo: number,
    status: Incident['status'] = 'active',
  ): Incident => {
    const createdAt = new Date(now - minsAgo * 60000).toISOString();
    return {
      id,
      type,
      severity,
      nodeId,
      affected,
      createdAt,
      status,
      assignedUnits: [],
      priority: priorityOf(severity, affected, minsAgo),
    };
  };
  return [
    mk('inc-101', 'fire', 'high', 'n2', 12, 6),
    mk('inc-102', 'medical', 'medium', 'n9', 3, 3),
  ];
}

export function seedResources(): Resource[] {
  return [
    { id: 'A-07', type: 'ambulance', label: 'Ambulance A-07', status: 'available', nodeId: 'n4', assignedTo: null, station: 'Central Station' },
    { id: 'A-12', type: 'ambulance', label: 'Ambulance A-12', status: 'available', nodeId: 'n6', assignedTo: null, station: 'University Depot' },
    { id: 'F-03', type: 'fire', label: 'Fire Unit F-03', status: 'available', nodeId: 'n5', assignedTo: null, station: 'Riverside Fire Station' },
    { id: 'F-09', type: 'fire', label: 'Fire Unit F-09', status: 'available', nodeId: 'n8', assignedTo: null, station: 'Northgate Fire Station' },
    { id: 'P-02', type: 'police', label: 'Police Unit P-02', status: 'available', nodeId: 'n4', assignedTo: null, station: 'Central Precinct' },
    { id: 'P-05', type: 'police', label: 'Police Unit P-05', status: 'available', nodeId: 'n7', assignedTo: null, station: 'Junction Post' },
  ];
}

export function seedHospitals(): Hospital[] {
  return [
    { id: 'h-a', name: 'Hospital A (St. Mercy General)', nodeId: 'n4', emergencyCapacity: 20, icuCapacity: 8, currentPatients: 11, incomingPatients: 2, status: 'operational' },
    { id: 'h-b', name: 'Hospital B (Civic Center General)', nodeId: 'n10', emergencyCapacity: 30, icuCapacity: 12, currentPatients: 14, incomingPatients: 1, status: 'operational' },
    { id: 'h-c', name: 'Hospital C (Northgate Clinic)', nodeId: 'n8', emergencyCapacity: 12, icuCapacity: 4, currentPatients: 5, incomingPatients: 0, status: 'operational' },
  ];
}
