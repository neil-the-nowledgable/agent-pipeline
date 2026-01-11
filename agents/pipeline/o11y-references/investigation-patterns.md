# Investigation Patterns

## Table of Contents
- [Investigation Framework](#investigation-framework)
- [Error Spike Investigation](#error-spike-investigation)
- [Latency Degradation](#latency-degradation)
- [Resource Exhaustion](#resource-exhaustion)
- [Cascading Failures](#cascading-failures)
- [Change Correlation](#change-correlation)
- [Cross-Signal Correlation](#cross-signal-correlation)

---

## Investigation Framework

### The MELT Model
**M**etrics → **E**vents → **L**ogs → **T**races

Always start broad and narrow down:

1. **Metrics**: Detect anomalies (rate changes, threshold breaches)
2. **Events**: Correlate with deployments, config changes, incidents
3. **Logs**: Find error messages, stack traces, context
4. **Traces**: Follow request path, identify slow/failing spans

### Investigation Checklist

```
□ Define the symptom (what's broken, for whom, since when)
□ Establish timeline (when did it start, any patterns)
□ Check for changes (deployments, config, infrastructure)
□ Identify affected components (which services, endpoints)
□ Gather evidence (metrics, logs, traces showing the issue)
□ Form hypothesis (what could cause this pattern)
□ Validate hypothesis (queries to confirm or refute)
□ Identify root cause (the actual source, not symptoms)
□ Determine remediation (fix, rollback, mitigation)
```

---

## Error Spike Investigation

### Step 1: Quantify the Error Rate

```promql
# Current error rate vs baseline
sum(rate(http_requests_total{status=~"5.."}[5m]))
  / sum(rate(http_requests_total[5m]))

# Error rate by service
sum by (service) (rate(http_requests_total{status=~"5.."}[5m]))

# Compare to 1 hour ago
sum(rate(http_requests_total{status=~"5.."}[5m]))
  / sum(rate(http_requests_total{status=~"5.."}[5m] offset 1h))
```

### Step 2: Identify Error Distribution

```promql
# Errors by status code
sum by (status) (rate(http_requests_total{status=~"5.."}[5m]))

# Errors by endpoint
topk(10, sum by (path) (rate(http_requests_total{status=~"5.."}[5m])))

# Errors by instance
sum by (instance) (rate(http_requests_total{status=~"5.."}[5m]))
```

### Step 3: Find Error Logs

```logql
# Recent errors for affected service
{service="$service"} |= "error" | json | level="error"

# Stack traces
{service="$service"} |~ "(?i)(exception|error|panic|fatal)"

# Group errors by type
sum by (error_type) (count_over_time({service="$service"} | json | level="error" [5m]))
```

### Step 4: Trace Failing Requests

```
# TraceQL - find error traces
{ status = error && resource.service.name = "$service" }

# Find slow + error traces
{ status = error && duration > 1s }
```

### Step 5: Correlate with Source Code

When you have a stack trace:
1. Extract file:line references
2. Search codebase for the function/method
3. Look for recent changes to that code
4. Check error handling patterns
5. Identify potential failure modes

---

## Latency Degradation

### Step 1: Quantify the Degradation

```promql
# P50, P90, P99 latency
histogram_quantile(0.50, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))
histogram_quantile(0.90, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))
histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))

# Compare to baseline
histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))
  / histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m] offset 1h)) by (le))
```

### Step 2: Identify Slow Endpoints

```promql
# Slowest endpoints
topk(10, histogram_quantile(0.99,
  sum by (path, le) (rate(http_request_duration_seconds_bucket[5m]))))

# Latency by service
histogram_quantile(0.99,
  sum by (service, le) (rate(http_request_duration_seconds_bucket[5m])))
```

### Step 3: Check Dependencies

```promql
# Database latency
histogram_quantile(0.99, sum(rate(db_query_duration_seconds_bucket[5m])) by (le))

# External API latency
histogram_quantile(0.99, sum(rate(http_client_duration_seconds_bucket[5m])) by (le, host))

# Cache hit rate
sum(rate(cache_hits_total[5m])) / sum(rate(cache_requests_total[5m]))
```

### Step 4: Trace Slow Requests

```
# TraceQL - slow traces
{ duration > 2s && resource.service.name = "$service" }

# Find where time is spent
{ duration > 2s } | select(span.duration, span.name, resource.service.name)
```

### Step 5: Check Resource Saturation

```promql
# CPU throttling
rate(container_cpu_cfs_throttled_seconds_total[5m])

# Memory pressure
container_memory_working_set_bytes / container_spec_memory_limit_bytes

# Connection pool exhaustion
sum(db_connections_active) / sum(db_connections_max)
```

---

## Resource Exhaustion

### Memory Investigation

```promql
# Memory usage trend
container_memory_working_set_bytes{container="$container"}

# Memory vs limit
container_memory_working_set_bytes / container_spec_memory_limit_bytes

# OOM kills
increase(container_oom_events_total[1h])

# Heap usage (JVM/Go)
jvm_memory_used_bytes{area="heap"}
go_memstats_heap_inuse_bytes
```

**Logs to check:**
```logql
{container="$container"} |~ "(?i)(oom|out of memory|cannot allocate|memory pressure)"
```

### CPU Investigation

```promql
# CPU usage
rate(container_cpu_usage_seconds_total[5m])

# CPU throttling (container hitting limits)
rate(container_cpu_cfs_throttled_seconds_total[5m])
  / rate(container_cpu_cfs_periods_total[5m])

# Process CPU
rate(process_cpu_seconds_total[5m])
```

### Disk Investigation

```promql
# Disk usage
(node_filesystem_size_bytes - node_filesystem_avail_bytes)
  / node_filesystem_size_bytes

# Disk I/O wait
rate(node_disk_io_time_seconds_total[5m])

# IOPS
rate(node_disk_reads_completed_total[5m]) + rate(node_disk_writes_completed_total[5m])
```

### Connection Exhaustion

```promql
# Database connections
sum by (db) (db_connections_active)
sum by (db) (db_connections_idle)
sum by (db) (db_connections_max)

# HTTP connections
sum(http_connections_active)

# File descriptors
process_open_fds / process_max_fds
```

---

## Cascading Failures

### Identify the Cascade Pattern

```promql
# Services with increasing error rates (sorted by spike)
sort_desc(
  rate(http_requests_total{status=~"5.."}[5m])
  / rate(http_requests_total{status=~"5.."}[5m] offset 10m)
)

# Latency spike propagation
sort_desc(
  histogram_quantile(0.99, sum by (service, le) (rate(http_request_duration_seconds_bucket[5m])))
  / histogram_quantile(0.99, sum by (service, le) (rate(http_request_duration_seconds_bucket[5m] offset 10m)))
)
```

### Find the Origin

```promql
# Which service error started first?
# Check timestamp of first error spike for each service
# Use range queries with small steps around incident start

# Dependency failures
sum by (target_service) (rate(http_client_requests_total{status=~"5.."}[5m]))
```

### Trace the Dependency Chain

```
# TraceQL - find traces that span multiple services with errors
{ status = error } | select(resource.service.name, span.name, status)

# Find upstream caller of failing service
{ resource.service.name = "$failing_service" && kind = server }
```

**Investigation questions:**
1. Which service failed first?
2. What does that service depend on?
3. Is there a shared dependency (DB, cache, external API)?
4. Are circuit breakers firing?
5. Is retry amplification occurring?

---

## Change Correlation

### Recent Deployments

```promql
# Deployment events (if tracked as metrics)
changes(deployment_timestamp{service="$service"}[1h])

# Compare error rate before/after deployment
sum(rate(http_requests_total{status=~"5.."}[5m]))
  - sum(rate(http_requests_total{status=~"5.."}[5m] offset 30m))
```

**Logs to check:**
```logql
{job="kube-events"} |= "deployment" |= "$service"
{job="argocd"} |= "sync" |= "$service"
{job="flux"} |= "release" |= "$service"
```

### Configuration Changes

```logql
# ConfigMap/Secret changes
{job="kube-audit"} |= "configmaps" or |= "secrets"

# Feature flag changes
{service="feature-flags"} |= "toggle" |= "changed"
```

### Infrastructure Changes

```promql
# Node changes
changes(kube_node_info[1h])

# Scaling events
changes(kube_deployment_spec_replicas[1h])
```

**Correlation checklist:**
1. What changed in the last [incident_duration]?
2. Was there a deployment to this service?
3. Was there a deployment to a dependency?
4. Were there infrastructure changes (scaling, node replacement)?
5. Were there config changes (env vars, secrets, feature flags)?

---

## Cross-Signal Correlation

### Metrics → Logs

When you find a metric anomaly:
```
1. Note the timestamp range
2. Identify the service/instance labels
3. Query logs for that service in that time window
4. Filter for errors, warnings, or relevant keywords
```

Example workflow:
```promql
# Found: error rate spike at 14:30 for service=api, instance=api-7b9c
```
```logql
{service="api", instance="api-7b9c"}
  | json
  | level=~"error|warn"
  # Time range: 14:25-14:35
```

### Logs → Traces

When you find error logs:
```
1. Extract trace_id or request_id from log
2. Query Tempo for that trace
3. Analyze span timings and errors
```

Example:
```logql
{service="api"} |= "error" | json | line_format "trace_id={{.trace_id}}"
```
```
# Then in Tempo
GET /api/traces/{trace_id}
```

### Traces → Profiles

When you find slow spans:
```
1. Note the time range of slow traces
2. Query Pyroscope for that service/time
3. Look for CPU or allocation hotspots
```

### Metrics → Source Code

When metrics show a pattern:
1. Identify the affected component from labels
2. Map metric name to code (instrumentation)
3. Search for metric registration in code
4. Find related code paths
5. Check for recent changes

Example mapping:
```
Metric: http_request_duration_seconds{handler="/api/users"}
→ Search: "http_request_duration" or "@GetMapping(\"/api/users\")"
→ Find: src/controllers/UserController.java:45
→ Git: git log -p src/controllers/UserController.java
```

---

## Investigation Templates

### Quick Triage (5 min)
```
1. Is the issue ongoing? (current error rate)
2. What's affected? (which services, endpoints)
3. When did it start? (metric timeline)
4. Any obvious cause? (recent deployments, known incidents)
5. What's the blast radius? (user impact)
```

### Deep Dive (30 min)
```
1. Full symptom characterization
2. Error log analysis
3. Trace sampling
4. Dependency check
5. Resource analysis
6. Change correlation
7. Hypothesis formation
8. Root cause identification
```

### Post-Incident (60 min)
```
1. Timeline reconstruction
2. Full telemetry collection
3. Source code analysis
4. Trigger identification
5. Contributing factors
6. Detection gap analysis
7. Remediation effectiveness
8. Prevention recommendations
```
