import React, { useState } from 'react';
import type { Hospital, Road, SimResult, SimScenario } from '../types';

interface Props {
  roads: Road[];
  hospitals: Hospital[];
  result: SimResult | null;
  onRun: (scenario: SimScenario) => void;
  onExit: () => void;
}

export const SimulationPanel: React.FC<Props> = ({ roads, hospitals, result, onRun, onExit }) => {
  const [blockRoad, setBlockRoad] = useState('');
  const [closeHospital, setCloseHospital] = useState('');
  const [addVictims, setAddVictims] = useState('20');
  const [open, setOpen] = useState(false);

  return (
    <section aria-label="Simulation mode" className="panel">
      <h2>Simulation Mode</h2>
      <p className="muted">Test a scenario without changing live operations. Results are calculated from current state.</p>
      {!open && (
        <button className="btn primary" onClick={() => setOpen(true)}>Open What-If simulator</button>
      )}
      {open && (
        <form
          className="form"
          onSubmit={(e) => {
            e.preventDefault();
            const n = Number.parseInt(addVictims, 10);
            onRun({
              blockRoad: blockRoad || null,
              closeHospital: closeHospital || null,
              addVictims: Number.isFinite(n) && n > 0 ? Math.min(n, 500) : 0,
            });
          }}
        >
          <label>Block road
            <select value={blockRoad} onChange={(e) => setBlockRoad(e.target.value)}>
              <option value="">No road blocked</option>
              {roads.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </label>
          <label>Hospital unavailable
            <select value={closeHospital} onChange={(e) => setCloseHospital(e.target.value)}>
              <option value="">All hospitals open</option>
              {hospitals.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </label>
          <label>Additional victims
            <input value={addVictims} onChange={(e) => setAddVictims(e.target.value)} inputMode="numeric" />
          </label>
          <div className="actions">
            <button type="submit" className="btn primary">Run What-If</button>
            <button type="button" className="btn" onClick={() => { setOpen(false); onExit(); }}>Exit simulation</button>
          </div>
        </form>
      )}
      {result && (
        <div className="details" aria-live="polite">
          <h3>Simulated impact</h3>
          <p>Live: {result.liveActiveIncidents} active incidents, {result.liveAvailableUnits} units available, {result.liveOpenHospitals} hospitals open.</p>
          <ul>
            {result.impacts.map((line, k) => <li key={k}>{line}</li>)}
          </ul>
          {result.reroutedPatients > 0 && (
            <p>{result.reroutedPatients} incoming patients rerouted. Extra distance {result.reroutedKm.toFixed(1)} km across {result.routesAffected} routes.</p>
          )}
          {result.alternativeHospital && (
            <p>Alternative hospital: {result.alternativeHospital} at {result.alternativeHospitalLoad}% emergency load.</p>
          )}
          {result.recommendations.length > 0 && (
            <div>
              <h4>Simulated recommendations</h4>
              <ol>
                {result.recommendations.map((r) => (
                  <li key={r.resourceId}>{r.resourceId}: ETA {r.etaText} over {r.distanceKm.toFixed(1)} km</li>
                ))}
              </ol>
            </div>
          )}
          <p className="muted">Live state unchanged. Close the simulator to return.</p>
        </div>
      )}
    </section>
  );
};
