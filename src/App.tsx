import React, { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import type {
  Hospital,
  Incident,
  IncidentType,
  LogEntry,
  Resource,
  Severity,
  SimResult,
  SimScenario,
} from './types';
import { NODES, ROADS, seedHospitals, seedIncidents, seedResources } from './lib/seed';
import { priorityOf, recommendForIncident, runSimulation, shortestPath } from './lib/engine';
import { CityMap } from './components/CityMap';
import { IncidentPanel } from './components/IncidentPanel';
import { ResourcePanel } from './components/ResourcePanel';
import { HospitalPanel } from './components/HospitalPanel';
import { Controls } from './components/Controls';
import { SimulationPanel } from './components/SimulationPanel';
import { EventLog } from './components/EventLog';
import { Footer } from './components/Footer';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';

const STORE_KEY = 'response-demo-v1';
const TYPES: IncidentType[] = ['fire', 'medical', 'accident', 'hazard', 'rescue'];
const SEVS: Severity[] = ['low', 'medium', 'high', 'critical'];
const NEXT_SEV: Record<Severity, Severity | null> = { low: 'medium', medium: 'high', high: 'critical', critical: null };

interface Persisted {
  incidents: Incident[];
  resources: Resource[];
  hospitals: Hospital[];
  closures: string[];
  events: LogEntry[];
  nextId: number;
}

function loadPersisted(): Persisted | null {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Persisted;
    if (!Array.isArray(p.incidents) || !Array.isArray(p.resources)) return null;
    return p;
  } catch {
    return null;
  }
}

function ageMinutes(createdAt: string): number {
  return Math.max(0, (Date.now() - new Date(createdAt).getTime()) / 60000);
}

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CommandCenter />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="*" element={<CommandCenter />} />
      </Routes>
    </BrowserRouter>
  );
};

const Clock: React.FC = () => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="clock" aria-label="Current local time">
      {now.toLocaleTimeString('en-GB', { hour12: false })}
    </span>
  );
};

const CommandCenter: React.FC = () => {
  const [entered, setEntered] = useState(false);
  const [incidents, setIncidents] = useState<Incident[]>(() => loadPersisted()?.incidents ?? seedIncidents());
  const [resources, setResources] = useState<Resource[]>(() => loadPersisted()?.resources ?? seedResources());
  const [hospitals, setHospitals] = useState<Hospital[]>(() => loadPersisted()?.hospitals ?? seedHospitals());
  const [closures, setClosures] = useState<Set<string>>(() => new Set(loadPersisted()?.closures ?? []));
  const [events, setEvents] = useState<LogEntry[]>(() => loadPersisted()?.events ?? []);
  const [nextId, setNextId] = useState(() => loadPersisted()?.nextId ?? 1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [simResult, setSimResult] = useState<SimResult | null>(null);
  const [incidentError, setIncidentError] = useState<string | null>(null);
  const [resourceError, setResourceError] = useState<string | null>(null);
  const [hospitalError, setHospitalError] = useState<string | null>(null);
  const [roadError, setRoadError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const p: Persisted = { incidents, resources, hospitals, closures: [...closures], events: events.slice(-50), nextId };
      localStorage.setItem(STORE_KEY, JSON.stringify(p));
    } catch {
      /* storage full or blocked: demo still works in memory */
    }
  }, [incidents, resources, hospitals, closures, events, nextId]);

  const log = (title: string, detail: string) => {
    setEvents((prev) => {
      const entry: LogEntry = {
        id: nextId,
        time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
        title,
        detail,
      };
      return [...prev, entry].slice(-50);
    });
    setNextId((n) => n + 1);
  };

  const selected = incidents.find((i) => i.id === selectedId) ?? null;

  const recommendations = useMemo(
    () => (selected && selected.status !== 'resolved' ? recommendForIncident(selected, resources, ROADS, closures, 3) : []),
    [selected, resources, closures],
  );

  const routeNodeIds = useMemo(() => {
    if (!selected || recommendations.length === 0) return [];
    const unit = resources.find((r) => r.id === recommendations[0].resourceId);
    if (!unit) return [];
    return shortestPath(unit.nodeId, selected.nodeId, ROADS, closures)?.path ?? [];
  }, [selected, recommendations, resources, closures]);

  const createIncident = (input: { type: IncidentType; severity: Severity; nodeId: string; affected: number }) => {
    setIncidentError(null);
    if (!TYPES.includes(input.type)) return setIncidentError('Invalid incident type.');
    if (!SEVS.includes(input.severity)) return setIncidentError('Invalid severity. Choose low, medium, high, or critical.');
    if (!NODES.some((n) => n.id === input.nodeId)) return setIncidentError('Invalid location.');
    if (!Number.isInteger(input.affected) || input.affected < 1 || input.affected > 500) {
      return setIncidentError('Affected people must be a whole number from 1 to 500.');
    }
    const id = `inc-${Date.now().toString(36)}`;
    const node = NODES.find((n) => n.id === input.nodeId)!;
    const inc: Incident = {
      id,
      type: input.type,
      severity: input.severity,
      nodeId: input.nodeId,
      affected: input.affected,
      createdAt: new Date().toISOString(),
      status: 'active',
      assignedUnits: [],
      priority: priorityOf(input.severity, input.affected, 0),
    };
    setIncidents((prev) => [...prev, inc]);
    setSelectedId(id);
    log('INCIDENT CREATED', `${input.type} ${input.severity} at ${node.label}, ${input.affected} affected`);
  };

  const dispatch = (resourceId: string, incidentId: string) => {
    setIncidentError(null);
    setResourceError(null);
    const unit = resources.find((r) => r.id === resourceId);
    if (!unit) return setResourceError(`Resource ${resourceId} does not exist.`);
    if (unit.status !== 'available') return setResourceError(`${resourceId} is ${unit.status} and cannot be dispatched.`);
    const inc = incidents.find((i) => i.id === incidentId);
    if (!inc || inc.status === 'resolved') return setIncidentError('Incident is no longer open.');
    const route = shortestPath(unit.nodeId, inc.nodeId, ROADS, closures);
    if (!route) return setResourceError(`No open route from ${resourceId} to ${incidentId}. Reopen a road first.`);
    setResources((prev) => prev.map((r) => (r.id === resourceId ? { ...r, status: 'dispatched' as const, assignedTo: incidentId } : r)));
    setIncidents((prev) =>
      prev.map((i) => (i.id === incidentId ? { ...i, status: 'assigned' as const, assignedUnits: [...i.assignedUnits, resourceId] } : i)),
    );
    log('UNITS DISPATCHED', `${resourceId} dispatched to ${incidentId}. Route ${route.km.toFixed(1)} km.`);
  };

  const escalate = (incidentId: string) => {
    setIncidentError(null);
    const inc = incidents.find((i) => i.id === incidentId);
    if (!inc) return setIncidentError('Incident not found.');
    const next = NEXT_SEV[inc.severity];
    if (!next) return setIncidentError('Incident is already at critical severity.');
    setIncidents((prev) =>
      prev.map((i) =>
        i.id === incidentId
          ? { ...i, severity: next, priority: priorityOf(next, i.affected, ageMinutes(i.createdAt)) }
          : i,
      ),
    );
    log('INCIDENT ESCALATED', `${incidentId} severity raised to ${next}. Recommendations recalculated.`);
  };

  const resolve = (incidentId: string) => {
    const inc = incidents.find((i) => i.id === incidentId);
    if (!inc) return;
    setResources((prev) =>
      prev.map((r) => (r.assignedTo === incidentId ? { ...r, status: 'available' as const, assignedTo: null } : r)),
    );
    setIncidents((prev) => prev.map((i) => (i.id === incidentId ? { ...i, status: 'resolved' as const } : i)));
    log('INCIDENT RESOLVED', `${incidentId} closed. Assigned units returned to available.`);
  };

  const recall = (resourceId: string) => {
    setResourceError(null);
    const unit = resources.find((r) => r.id === resourceId);
    if (!unit) return setResourceError(`Resource ${resourceId} does not exist.`);
    if (unit.status === 'available' || unit.status === 'offline') return setResourceError(`${resourceId} is already ${unit.status}.`);
    const incId = unit.assignedTo;
    setResources((prev) => prev.map((r) => (r.id === resourceId ? { ...r, status: 'available' as const, assignedTo: null } : r)));
    if (incId) {
      setIncidents((prev) =>
        prev.map((i) => {
          if (i.id !== incId) return i;
          const units = i.assignedUnits.filter((u) => u !== resourceId);
          return { ...i, assignedUnits: units, status: units.length === 0 ? ('active' as const) : i.status };
        }),
      );
    }
    log('UNIT RECALLED', `${resourceId} returned to available.`);
  };

  const toggleRoad = (roadId: string) => {
    setRoadError(null);
    const road = ROADS.find((r) => r.id === roadId);
    if (!road) return setRoadError(`Road ${roadId} does not exist.`);
    if (closures.has(roadId)) {
      const next = new Set(closures);
      next.delete(roadId);
      setClosures(next);
      log('ROAD REOPENED', `${road.name} reopened. Routes recalculated on open roads.`);
      return;
    }
    const before = new Map<string, number | null>();
    for (const inc of incidents.filter((i) => i.status !== 'resolved')) {
      let best: number | null = null;
      for (const r of resources.filter((x) => x.status === 'available')) {
        const rt = shortestPath(r.nodeId, inc.nodeId, ROADS, closures);
        if (rt && (best === null || rt.km < best)) best = rt.km;
      }
      before.set(inc.id, best);
    }
    const next = new Set(closures);
    next.add(roadId);
    let affected = 0;
    for (const inc of incidents.filter((i) => i.status !== 'resolved')) {
      let best: number | null = null;
      for (const r of resources.filter((x) => x.status === 'available')) {
        const rt = shortestPath(r.nodeId, inc.nodeId, ROADS, next);
        if (rt && (best === null || rt.km < best)) best = rt.km;
      }
      const was = before.get(inc.id);
      if (was !== best && (was === null || best === null || best > was)) affected += 1;
    }
    setClosures(next);
    log('ROAD CLOSURE DETECTED', `${road.name} blocked.${affected > 0 ? ` ${affected} incident route${affected === 1 ? '' : 's'} recalculated.` : ' No active route used it.'}`);
  };

  const toggleHospital = (hospitalId: string) => {
    setHospitalError(null);
    const h = hospitals.find((x) => x.id === hospitalId);
    if (!h) return setHospitalError(`Hospital ${hospitalId} does not exist.`);
    if (h.status === 'unavailable') {
      setHospitals((prev) => prev.map((x) => (x.id === hospitalId ? { ...x, status: 'operational' as const } : x)));
      log('HOSPITAL STATUS CHANGED', `${h.name} marked available again.`);
      return;
    }
    if (h.currentPatients < 0 || h.currentPatients > h.emergencyCapacity) {
      return setHospitalError(`${h.name} has inconsistent capacity data. Resolve counts before changing status.`);
    }
    setHospitals((prev) =>
      prev.map((x) => (x.id === hospitalId ? { ...x, status: 'unavailable' as const, incomingPatients: 0 } : x)),
    );
    log('HOSPITAL STATUS CHANGED', `${h.name} marked unavailable. Incoming patients rerouted to open hospitals.`);
  };

  const runSim = (scenario: SimScenario) => {
    const result = runSimulation(scenario, incidents, resources, hospitals, ROADS, closures);
    setSimResult(result);
    const parts: string[] = [];
    if (scenario.blockRoad) parts.push(`road ${scenario.blockRoad} blocked`);
    if (scenario.closeHospital) parts.push(`hospital ${scenario.closeHospital} unavailable`);
    if (scenario.addVictims > 0) parts.push(`${scenario.addVictims} added victims`);
    log('SIMULATION RUN', parts.length > 0 ? `What-If tested: ${parts.join(', ')}. Live state unchanged.` : 'What-If tested with no changes. Live state unchanged.');
  };

  const reset = () => {
    localStorage.removeItem(STORE_KEY);
    setIncidents(seedIncidents());
    setResources(seedResources());
    setHospitals(seedHospitals());
    setClosures(new Set());
    setSelectedId(null);
    setSimResult(null);
    setNextId((n) => n + 1);
    setEvents((prev) => [
      ...prev,
      { id: nextId, time: new Date().toLocaleTimeString('en-GB', { hour12: false }), title: 'SCENARIO RESET', detail: 'Demo scenario restored to seed state.' },
    ].slice(-50));
  };

  if (!entered) {
    return (
      <main className="intro">
        <p><span className="sim-badge">SIMULATION ENVIRONMENT</span></p>
        <h1>RESPONSE</h1>
        <p className="sub">Emergency Response Command Center</p>
        <p className="muted">Fictional city. Fictional data. Built by FORGE to demonstrate operational software.</p>
        <p><button className="btn primary" onClick={() => setEntered(true)}>Enter command center</button></p>
        <p className="links"><Link to="/terms">Terms and Conditions</Link> | <Link to="/privacy">Privacy Policy</Link></p>
      </main>
    );
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">R</span>
          <div>
            <h1>RESPONSE</h1>
            <p>Emergency Response Command Center</p>
          </div>
        </div>
        <div className="topmeta">
          <Clock />
          <span className="sim-badge">SIMULATION ENVIRONMENT</span>
        </div>
      </header>
      <div className="layout">
        <div>
          <section aria-label="City map" className="panel map-wrap">
            <h2>Everton City (fictional)</h2>
            <CityMap
              nodes={NODES}
              roads={ROADS}
              closures={closures}
              incidents={incidents}
              resources={resources}
              hospitals={hospitals}
              selectedId={selectedId}
              routeNodeIds={routeNodeIds}
              onSelectIncident={setSelectedId}
            />
          </section>
          <EventLog events={events} />
        </div>
        <div className="side">
          <IncidentPanel
            nodes={NODES}
            incidents={incidents}
            selected={selected}
            recommendations={recommendations}
            error={incidentError}
            onSelect={setSelectedId}
            onCreate={createIncident}
            onDispatch={dispatch}
            onEscalate={escalate}
            onResolve={resolve}
          />
          <ResourcePanel nodes={NODES} resources={resources} error={resourceError} onRecall={recall} />
          <HospitalPanel hospitals={hospitals} error={hospitalError} onToggle={toggleHospital} />
          <Controls roads={ROADS} closures={closures} error={roadError} onToggleRoad={toggleRoad} onReset={reset} />
          <SimulationPanel roads={ROADS} hospitals={hospitals} result={simResult} onRun={runSim} onExit={() => setSimResult(null)} />
        </div>
      </div>
      <Footer />
    </div>
  );
};
