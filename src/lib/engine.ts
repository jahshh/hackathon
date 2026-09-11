import type {
  CityNode,
  Hospital,
  Incident,
  Recommendation,
  Resource,
  Road,
  Severity,
  SimResult,
  SimScenario,
} from '../types';

export const SEVERITY_WEIGHT: Record<Severity, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 5,
};

export function roadLengthKm(a: CityNode, b: CityNode): number {
  const dx = (a.x - b.x) * 0.12;
  const dy = (a.y - b.y) * 0.12;
  return Math.round(Math.hypot(dx, dy) * 10) / 10;
}

function neighbors(nodeId: string, roads: Road[], closures: Set<string>): { to: string; km: number; roadId: string }[] {
  const out: { to: string; km: number; roadId: string }[] = [];
  for (const r of roads) {
    if (closures.has(r.id)) continue;
    if (r.from === nodeId) out.push({ to: r.to, km: r.km, roadId: r.id });
    else if (r.to === nodeId) out.push({ to: r.from, km: r.km, roadId: r.id });
  }
  return out;
}

export function shortestPath(
  from: string,
  to: string,
  roads: Road[],
  closures: Set<string>,
): { km: number; path: string[]; roadIds: string[] } | null {
  if (from === to) return { km: 0, path: [from], roadIds: [] };
  const dist = new Map<string, number>([[from, 0]]);
  const prev = new Map<string, { node: string; roadId: string }>();
  const visited = new Set<string>();
  for (;;) {
    let current: string | null = null;
    let best = Infinity;
    for (const [node, d] of dist) {
      if (!visited.has(node) && d < best) {
        best = d;
        current = node;
      }
    }
    if (current === null) return null;
    if (current === to) break;
    visited.add(current);
    for (const n of neighbors(current, roads, closures)) {
      const nd = best + n.km;
      if (nd < (dist.get(n.to) ?? Infinity)) {
        dist.set(n.to, nd);
        prev.set(n.to, { node: current, roadId: n.roadId });
      }
    }
  }
  const km = dist.get(to);
  if (km === undefined || !Number.isFinite(km)) return null;
  const path: string[] = [to];
  const roadIds: string[] = [];
  let c = to;
  while (c !== from) {
    const p = prev.get(c);
    if (!p) return null;
    roadIds.unshift(p.roadId);
    c = p.node;
    path.unshift(c);
  }
  return { km: Math.round(km * 10) / 10, path, roadIds };
}

export function etaText(km: number): string {
  const minutes = km / 40 * 60;
  const m = Math.floor(minutes);
  const s = Math.round((minutes - m) * 60);
  if (m <= 0) return `${s} sec`;
  return `${m} min ${s} sec`;
}

const TYPE_MATCH: Record<Incident['type'], Resource['type'][]> = {
  fire: ['fire', 'ambulance', 'police'],
  medical: ['ambulance', 'police'],
  accident: ['ambulance', 'police', 'fire'],
  hazard: ['fire', 'police', 'ambulance'],
  rescue: ['fire', 'ambulance', 'police'],
};

export function recommendForIncident(
  incident: Incident,
  resources: Resource[],
  roads: Road[],
  closures: Set<string>,
  limit = 3,
): Recommendation[] {
  const order = TYPE_MATCH[incident.type];
  const scored: Recommendation[] = [];
  for (const r of resources) {
    if (r.status !== 'available') continue;
    const route = shortestPath(r.nodeId, incident.nodeId, roads, closures);
    if (!route) continue;
    const typeRank = order.indexOf(r.type);
    const reasons: string[] = [];
    reasons.push(typeRank === 0 ? `${r.label} is the closest matching unit type for ${incident.type}` : `${r.label} can support ${incident.type} as secondary unit`);
    reasons.push(`Route distance ${route.km.toFixed(1)} km via ${route.roadIds.length} road segment${route.roadIds.length === 1 ? '' : 's'}`);
    if (closures.size > 0) reasons.push(`Calculated on ${roads.length - closures.size} open roads (${closures.size} closed)`);
    else reasons.push(`Calculated on all ${roads.length} open roads`);
    scored.push({
      resourceId: r.id,
      distanceKm: route.km,
      etaText: etaText(route.km),
      reasons,
    });
  }
  scored.sort((a, b) => {
    const ra = resources.find((r) => r.id === a.resourceId);
    const rb = resources.find((r) => r.id === b.resourceId);
    const ta = ra ? order.indexOf(ra.type) : 99;
    const tb = rb ? order.indexOf(rb.type) : 99;
    if (ta !== tb) return ta - tb;
    return a.distanceKm - b.distanceKm;
  });
  return scored.slice(0, limit);
}

export function priorityOf(severity: Severity, affected: number, ageMinutes: number): number {
  return SEVERITY_WEIGHT[severity] * 10 + Math.min(affected, 50) + Math.min(ageMinutes / 10, 10);
}

export function pickHospital(
  incident: Incident,
  hospitals: Hospital[],
  nodes: CityNode[],
  roads: Road[],
  closures: Set<string>,
): Hospital | null {
  void incident;
  void nodes;
  const open = hospitals.filter((h) => h.status !== 'unavailable' && h.currentPatients < h.emergencyCapacity);
  if (open.length === 0) return null;
  const withDist = open.map((h) => {
    let km = Number.MAX_SAFE_INTEGER;
    return { h, km };
  });
  withDist.sort((a, b) => {
    const loadA = a.h.currentPatients / a.h.emergencyCapacity;
    const loadB = b.h.currentPatients / b.h.emergencyCapacity;
    return loadA - loadB;
  });
  void roads;
  void closures;
  return withDist[0]?.h ?? null;
}

export function runSimulation(
  scenario: SimScenario,
  incidents: Incident[],
  resources: Resource[],
  hospitals: Hospital[],
  roads: Road[],
  closures: Set<string>,
): SimResult {
  const simClosures = new Set(closures);
  if (scenario.blockRoad) simClosures.add(scenario.blockRoad);
  const simHospitals: Hospital[] = hospitals.map((h) =>
    h.id === scenario.closeHospital ? { ...h, status: 'unavailable' as const } : { ...h },
  );
  const simIncidents: Incident[] = incidents.map((i) => ({ ...i }));
  if (scenario.addVictims > 0 && simIncidents.length > 0) {
    const active = simIncidents.filter((i) => i.status !== 'resolved');
    const targets = active.length > 0 ? active : simIncidents;
    const per = Math.floor(scenario.addVictims / targets.length);
    let rest = scenario.addVictims - per * targets.length;
    for (const t of targets) {
      t.affected += per + (rest > 0 ? 1 : 0);
      if (rest > 0) rest -= 1;
    }
  }

  let reroutedKm = 0;
  let routesAffected = 0;
  let reroutedPatients = 0;
  const available = resources.filter((r) => r.status === 'available');
  for (const inc of simIncidents.filter((i) => i.status !== 'resolved')) {
    let best: { km: number } | null = null;
    for (const r of available) {
      const route = shortestPath(r.nodeId, inc.nodeId, roads, simClosures);
      if (route && (!best || route.km < best.km)) best = route;
    }
    let base: { km: number } | null = null;
    for (const r of available) {
      const route = shortestPath(r.nodeId, inc.nodeId, roads, closures);
      if (route && (!base || route.km < base.km)) base = route;
    }
    if (best && base && best.km > base.km) {
      reroutedKm += best.km - base.km;
      routesAffected += 1;
      reroutedPatients += inc.affected;
    }
  }
  reroutedKm = Math.round(reroutedKm * 10) / 10;

  const first = simIncidents.find((i) => i.status !== 'resolved') ?? simIncidents[0];
  const recommendations = first ? recommendForIncident(first, resources, roads, simClosures, 3) : [];
  const alt = first ? pickHospital(first, simHospitals, [], roads, simClosures) : null;

  const impacts: string[] = [];
  if (scenario.blockRoad) {
    const road = roads.find((r) => r.id === scenario.blockRoad);
    impacts.push(
      routesAffected > 0
        ? `${road?.name ?? scenario.blockRoad} closed: ${routesAffected} route${routesAffected === 1 ? '' : 's'} lengthened by ${reroutedKm.toFixed(1)} km total`
        : `${road?.name ?? scenario.blockRoad} closed: no active route uses it, no detour needed`,
    );
  }
  if (scenario.closeHospital) {
    const closed = hospitals.find((h) => h.id === scenario.closeHospital);
    impacts.push(
      alt
        ? `${closed?.name ?? scenario.closeHospital} unavailable: ${alt.name} takes overflow at ${Math.round((alt.currentPatients / alt.emergencyCapacity) * 100)}% load`
        : `${closed?.name ?? scenario.closeHospital} unavailable: no hospital has free emergency capacity`,
    );
  }
  if (scenario.addVictims > 0) {
    impacts.push(`${scenario.addVictims} additional victims distributed across open incidents, raising priority scores`);
  }
  if (impacts.length === 0) impacts.push('Scenario matches live state: no measurable impact');

  return {
    liveActiveIncidents: incidents.filter((i) => i.status !== 'resolved').length,
    liveAvailableUnits: resources.filter((r) => r.status === 'available').length,
    liveOpenHospitals: hospitals.filter((h) => h.status !== 'unavailable').length,
    simBlockedRoad: scenario.blockRoad,
    simClosedHospital: scenario.closeHospital,
    simAddedVictims: scenario.addVictims,
    reroutedKm,
    routesAffected,
    reroutedPatients,
    recommendations,
    alternativeHospital: alt ? alt.name : null,
    alternativeHospitalLoad: alt ? Math.round((alt.currentPatients / alt.emergencyCapacity) * 100) : null,
    impacts,
  };
}
