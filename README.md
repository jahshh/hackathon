# RESPONSE: Emergency Response Command Center

Fictional emergency operations simulation built by FORGE. Static React + TypeScript
single-page app (no backend, no API keys, no map tiles: the city map and Dijkstra
routing are computed in-app). Scenario state persists in browser local storage.

Live demo: https://response-jahsh-dev.apps.rm2.thpm.p1.openshiftapps.com/

## Develop

```sh
npm ci
npm test        # engine unit tests (routing, recommendations, simulation purity)
npm run dev     # http://localhost:5173/
npm run build   # production bundle in dist/
```

## Container

```sh
docker build -t response .
docker run -p 8080:8080 response
```

`Dockerfile` builds the Vite bundle and serves `dist/` with unprivileged nginx
(Sandbox-compatible: runs as non-root on port 8080, SPA fallback for `/terms`
and `/privacy`).

## OpenShift deploy (imperative)

```sh
oc project jahsh-dev
oc new-build --strategy=docker --binary --name=response -l app=response
oc start-build response --from-dir=. --follow
oc new-app response -l app=response
oc expose svc/response
oc patch route response --type=merge \
  -p '{"spec":{"port":{"targetPort":"8080-tcp"},"tls":{"termination":"edge","insecureEdgeTerminationPolicy":"Redirect"}}}'
```

## GitOps / declarative deploy

```sh
oc apply -f k8s/rbac.yaml -f k8s/service.yaml -f k8s/route.yaml
oc apply -f k8s/deployment.yaml   # 3 replicas, probes, zero-downtime rolling update
oc rollout status deploy/response --timeout=300s
oc apply -f k8s/hpa.yaml -f k8s/networkpolicy.yaml
```

What is where:

| Concern | Manifest |
|---|---|
| HA deployment (3 replicas, rolling update, startup/readiness/liveness probes, resources, non-root) | `k8s/deployment.yaml` |
| In-cluster load balancing | `k8s/service.yaml` (ClusterIP across ready pods) |
| Edge TLS route | `k8s/route.yaml` |
| CPU autoscaling 3-6 pods | `k8s/hpa.yaml` (needs metrics API; check `oc get hpa`) |
| Least-privilege identity | `k8s/rbac.yaml` (dedicated ServiceAccount) |
| Default-deny traffic (router + DNS only) | `k8s/networkpolicy.yaml` |
| Scale-to-zero serverless variant | `k8s/serverless/knative-service.yaml` (needs Serverless operator) |
| Grafana dashboard (platform metrics, no app changes) | `k8s/monitoring/dashboard.yaml` |
| GitHub Actions CI (test, build, GHCR image) | `.github/workflows/ci.yaml` |
| OpenShift Pipelines CD | `tekton/pipeline.yaml` (needs Pipelines operator) |

Notes:

- **Secrets:** the app is a static bundle with no backend and no credentials, so no
  Secret is shipped. TLS terminates at the route. If a backend is added later, mount
  it from a Secret referenced here and document rotation.
- **Storage:** no server-side storage is required (scenario lives in browser local
  storage). No PVC is created. The Tekton PipelineRun provisions a 2 Gi workspace
  volume for builds only.
- **Monitoring:** pod CPU/memory, restarts, and rollout status come from the
  OpenShift console and `oc adm top` / `oc logs`. The dashboard ConfigMap targets
  clusters with kube-state-metrics + Grafana operator.
