// RESPONSE engine tests: compile src/lib with the repo TypeScript compiler,
// then assert routing, recommendation, and simulation behavior.
// Run: npm test
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const root = path.join(__dirname, '..');
const out = fs.mkdtempSync(path.join(os.tmpdir(), 'response-eng-'));
const tscBin = path.join(root, 'node_modules', 'typescript', 'bin', 'tsc');

execFileSync(process.execPath, [
  tscBin,
  '--module', 'commonjs',
  '--target', 'es2020',
  '--rootDir', 'src',
  '--outDir', out,
  'src/lib/engine.ts', 'src/lib/seed.ts', 'src/types.ts',
], { cwd: root, stdio: 'inherit' });

const { shortestPath, recommendForIncident, runSimulation, priorityOf } = require(path.join(out, 'lib', 'engine.js'));
const { ROADS, seedIncidents, seedResources, seedHospitals } = require(path.join(out, 'lib', 'seed.js'));

let pass = 0;
let fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log(`PASS ${name}`); }
  else { fail++; console.log(`FAIL ${name} ${extra}`); }
};

const p1 = shortestPath('n5', 'n2', ROADS, new Set());
ok('open-graph route n5->n2', !!p1 && p1.km > 0 && p1.path[0] === 'n5' && p1.path[p1.path.length - 1] === 'n2', JSON.stringify(p1));

const direct = shortestPath('n2', 'n3', ROADS, new Set());
const detour = shortestPath('n2', 'n3', ROADS, new Set(['r-2']));
ok('closure forces detour', !!direct && !!detour && detour.km > direct.km && !detour.roadIds.includes('r-2'));

ok('fully closed graph returns null', shortestPath('n1', 'n8', ROADS, new Set(ROADS.map((r) => r.id))) === null);

const incs = seedIncidents();
const mostlyBusy = seedResources().map((r, i) => (i < 5 ? { ...r, status: 'dispatched', assignedTo: 'inc-x' } : r));
const recs = recommendForIncident(incs[0], mostlyBusy, ROADS, new Set(), 3);
ok('unavailable units never recommended', recs.length > 0 && recs.every((r) => r.resourceId === 'P-05'));

const noneAvail = seedResources().map((r) => ({ ...r, status: 'offline' }));
ok('no units yields zero recommendations', recommendForIncident(incs[0], noneAvail, ROADS, new Set()).length === 0);

const liveRes = seedResources();
const liveHosp = seedHospitals();
const before = JSON.stringify({ liveRes, liveHosp });
const sim = runSimulation({ blockRoad: 'r-2', closeHospital: 'h-a', addVictims: 20 }, incs, liveRes, liveHosp, ROADS, new Set());
ok('simulation leaves live state untouched', JSON.stringify({ liveRes, liveHosp }) === before);
ok('simulation reports measured impacts', sim.impacts.length > 0 && typeof sim.reroutedKm === 'number');

ok('priority ordering sane',
  priorityOf('critical', 1, 0) > priorityOf('high', 12, 0) && priorityOf('high', 20, 0) > priorityOf('high', 1, 0));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
