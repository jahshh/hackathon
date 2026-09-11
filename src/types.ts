export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentType = 'fire' | 'medical' | 'accident' | 'hazard' | 'rescue';
export type IncidentStatus = 'active' | 'assigned' | 'resolved';
export type ResourceType = 'ambulance' | 'fire' | 'police';
export type ResourceStatus =
  | 'available'
  | 'dispatched'
  | 'en_route'
  | 'on_scene'
  | 'transporting'
  | 'returning'
  | 'offline';
export type HospitalStatus = 'operational' | 'strained' | 'full' | 'unavailable';

export interface MapPoint {
  x: number;
  y: number;
}

export interface CityNode extends MapPoint {
  id: string;
  label: string;
}

export interface Road {
  id: string;
  name: string;
  from: string;
  to: string;
  km: number;
}

export interface Incident {
  id: string;
  type: IncidentType;
  severity: Severity;
  nodeId: string;
  affected: number;
  createdAt: string;
  status: IncidentStatus;
  assignedUnits: string[];
  priority: number;
}

export interface Resource {
  id: string;
  type: ResourceType;
  label: string;
  status: ResourceStatus;
  nodeId: string;
  assignedTo: string | null;
  station: string;
}

export interface Hospital {
  id: string;
  name: string;
  nodeId: string;
  emergencyCapacity: number;
  icuCapacity: number;
  currentPatients: number;
  incomingPatients: number;
  status: HospitalStatus;
}

export interface LogEntry {
  id: number;
  time: string;
  title: string;
  detail: string;
}

export interface Recommendation {
  resourceId: string;
  distanceKm: number;
  etaText: string;
  reasons: string[];
}

export interface SimScenario {
  blockRoad: string | null;
  closeHospital: string | null;
  addVictims: number;
}

export interface SimResult {
  liveActiveIncidents: number;
  liveAvailableUnits: number;
  liveOpenHospitals: number;
  simBlockedRoad: string | null;
  simClosedHospital: string | null;
  simAddedVictims: number;
  reroutedKm: number;
  routesAffected: number;
  reroutedPatients: number;
  recommendations: Recommendation[];
  alternativeHospital: string | null;
  alternativeHospitalLoad: number | null;
  impacts: string[];
}
