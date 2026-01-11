# Error Taxonomy

## Table of Contents
- [HTTP Status Codes](#http-status-codes)
- [Exception Categories](#exception-categories)
- [Infrastructure Errors](#infrastructure-errors)
- [Database Errors](#database-errors)
- [Network Errors](#network-errors)
- [Error Relationships](#error-relationships)
- [Error Patterns](#error-patterns)

---

## HTTP Status Codes

### 4xx Client Errors

| Code | Name | Typical Cause | Investigation |
|------|------|--------------|---------------|
| 400 | Bad Request | Malformed request, validation failure | Check request payload in logs |
| 401 | Unauthorized | Missing/invalid auth token | Check auth service, token expiry |
| 403 | Forbidden | Insufficient permissions | Check RBAC, user roles |
| 404 | Not Found | Resource doesn't exist | Check routing, data existence |
| 408 | Request Timeout | Client took too long | Check client-side issues |
| 409 | Conflict | Concurrent modification | Check for race conditions |
| 422 | Unprocessable Entity | Semantic validation failure | Check business logic validation |
| 429 | Too Many Requests | Rate limit exceeded | Check rate limiter, client behavior |

### 5xx Server Errors

| Code | Name | Typical Cause | Investigation |
|------|------|--------------|---------------|
| 500 | Internal Server Error | Unhandled exception | Check logs for stack traces |
| 502 | Bad Gateway | Upstream returned invalid response | Check upstream service health |
| 503 | Service Unavailable | Service overloaded or in maintenance | Check resource saturation, deployments |
| 504 | Gateway Timeout | Upstream didn't respond in time | Check upstream latency, timeouts |

### Error Code Investigation Priority

```
High Priority (Immediate):
  500 - Bug or unhandled error
  502 - Upstream failure cascade
  503 - Capacity/health issue
  504 - Performance degradation

Medium Priority (Monitor):
  429 - May indicate abuse or need scaling
  408 - May indicate client issues
  409 - May indicate data consistency issues

Low Priority (Normal):
  400, 401, 403, 404 - Usually client issues
```

---

## Exception Categories

### Null/Undefined Errors

**Signatures:**
- `NullPointerException`
- `TypeError: Cannot read property 'x' of undefined`
- `nil pointer dereference`

**Common Causes:**
- Missing null checks
- Uninitialized variables
- Unexpected API response format
- Missing database records

**Investigation:**
```logql
{service="$service"} |~ "(?i)(null|nil|undefined)"
```

### Type/Casting Errors

**Signatures:**
- `ClassCastException`
- `TypeError: x is not a function`
- `type assertion failed`

**Common Causes:**
- Schema mismatch
- Deserialization failure
- API contract change

**Investigation:**
```logql
{service="$service"} |~ "(?i)(cast|type|cannot convert)"
```

### Validation Errors

**Signatures:**
- `ValidationException`
- `IllegalArgumentException`
- `schema validation failed`

**Common Causes:**
- Invalid input data
- Business rule violation
- Contract mismatch

**Investigation:**
```logql
{service="$service"} |~ "(?i)(validation|invalid|constraint)"
```

### Resource Errors

**Signatures:**
- `OutOfMemoryError`
- `Too many open files`
- `Connection pool exhausted`

**Common Causes:**
- Memory leak
- Resource leak
- Traffic spike
- Configuration issue

**Investigation:**
```promql
# Memory
container_memory_working_set_bytes / container_spec_memory_limit_bytes

# File descriptors
process_open_fds / process_max_fds

# Connections
db_connections_active / db_connections_max
```

### Timeout Errors

**Signatures:**
- `TimeoutException`
- `context deadline exceeded`
- `read timeout`

**Common Causes:**
- Slow dependency
- Network latency
- Resource contention
- Timeout too aggressive

**Investigation:**
```promql
histogram_quantile(0.99, sum(rate(http_client_duration_seconds_bucket[5m])) by (le, host))
```

---

## Infrastructure Errors

### Container/Pod Errors

| Error | Signal | Cause |
|-------|--------|-------|
| OOMKilled | `container_oom_events_total` | Memory limit exceeded |
| CrashLoopBackOff | Pod restart count | App crash on startup |
| ImagePullBackOff | K8s events | Registry issue, wrong image |
| Pending | K8s events | Scheduling issue, resource shortage |

**Investigation queries:**
```promql
# OOM events
increase(container_oom_events_total{container="$container"}[1h])

# Restart count
kube_pod_container_status_restarts_total{container="$container"}

# Pod status
kube_pod_status_phase{pod=~"$pod.*"}
```

### Node Errors

| Error | Signal | Cause |
|-------|--------|-------|
| NodeNotReady | `kube_node_status_condition` | Node health check failing |
| DiskPressure | `kube_node_status_condition` | Disk space low |
| MemoryPressure | `kube_node_status_condition` | Memory low |
| PIDPressure | `kube_node_status_condition` | Too many processes |

### Network Errors

| Error | Signal | Cause |
|-------|--------|-------|
| Connection refused | Error logs | Service not running/listening |
| Connection reset | Error logs | Service crashed, firewall |
| DNS resolution failed | Error logs | DNS issue, wrong hostname |
| TLS handshake failed | Error logs | Certificate issue |

---

## Database Errors

### Connection Errors

| Error | Cause | Investigation |
|-------|-------|--------------|
| Connection refused | DB down, wrong port | Check DB health |
| Too many connections | Pool exhausted | Check connection pool metrics |
| Connection timeout | Network, DB overloaded | Check DB latency |
| Authentication failed | Wrong credentials | Check secrets |

### Query Errors

| Error | Cause | Investigation |
|-------|-------|--------------|
| Deadlock | Concurrent transactions | Check transaction patterns |
| Lock wait timeout | Long-running transaction | Check slow queries |
| Query timeout | Complex query, missing index | Analyze query plan |
| Unique constraint | Duplicate insert | Check application logic |

**Investigation queries:**
```promql
# Connection pool
db_connections_in_use / db_connections_max

# Query latency
histogram_quantile(0.99, sum(rate(db_query_duration_seconds_bucket[5m])) by (le))

# Slow queries (>1s)
sum(rate(db_queries_duration_seconds_bucket{le="1"}[5m]))
  / sum(rate(db_queries_duration_seconds_count[5m]))
```

---

## Network Errors

### DNS Errors

```logql
{service="$service"} |~ "(?i)(dns|resolve|lookup|NXDOMAIN)"
```

**Common causes:**
- Service not registered
- DNS propagation delay
- DNS server issue

### TLS/SSL Errors

```logql
{service="$service"} |~ "(?i)(tls|ssl|certificate|x509|handshake)"
```

**Common causes:**
- Certificate expired
- Wrong CA
- SNI mismatch
- Protocol version mismatch

### Connection Errors

```logql
{service="$service"} |~ "(?i)(ECONNREFUSED|ECONNRESET|ETIMEDOUT|connection)"
```

**Common causes:**
- Service down
- Port blocked
- Too many connections
- Network partition

---

## Error Relationships

### Cascade Patterns

```
[Upstream Error] → [Downstream Timeout] → [Client Error]

Example:
Database → API gets 504 → Frontend shows error

Investigation order:
1. Find the originating error (earliest in time)
2. Check its dependencies
3. Trace the cascade forward
```

### Correlation Rules

| Primary Error | Related Errors | Relationship |
|--------------|----------------|--------------|
| Database timeout | API 504 | Direct dependency |
| OOM Kill | Service restart, 503 | Resource exhaustion |
| Rate limit (429) | Retry storm, more 429s | Amplification |
| Certificate expired | TLS errors across services | Shared certificate |
| DNS failure | Connection refused multiple services | Shared DNS |

### Common Root Causes

```
Error Pattern → Likely Root Cause

Multiple 502/504 from same upstream → Upstream service issue
Gradual latency increase → Resource exhaustion, leak
Sudden spike in all errors → Deployment, config change
Periodic errors → Cron job, scheduled task
Single instance errors → Node issue, bad deploy
```

---

## Error Patterns

### Spike Pattern
- **Signal**: Sudden increase in error rate
- **Causes**: Deployment, traffic spike, dependency failure
- **Query**:
```promql
rate(http_requests_total{status=~"5.."}[1m])
  > 3 * rate(http_requests_total{status=~"5.."}[1m] offset 5m)
```

### Gradual Increase Pattern
- **Signal**: Slowly rising error rate
- **Causes**: Memory leak, connection leak, gradual degradation
- **Query**:
```promql
deriv(sum(rate(http_requests_total{status=~"5.."}[5m]))[30m:5m]) > 0
```

### Oscillation Pattern
- **Signal**: Error rate going up and down
- **Causes**: Auto-scaling issues, circuit breaker, retry storms
- **Query**: Look for regular patterns in error rate graph

### Periodic Pattern
- **Signal**: Errors at regular intervals
- **Causes**: Cron jobs, batch processing, health checks
- **Query**: Check for correlation with scheduled tasks

### Correlated Pattern
- **Signal**: Errors across multiple services simultaneously
- **Causes**: Shared dependency, infrastructure issue, config change
- **Query**:
```promql
count by (service) (rate(http_requests_total{status=~"5.."}[5m]) > 0)
```
